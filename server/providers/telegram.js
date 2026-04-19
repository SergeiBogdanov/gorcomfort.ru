function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
    siteUrl: process.env.SITE_URL || "gorcomfort.ru",
  };
}

function normalizeSiteUrl(siteUrl) {
  if (!siteUrl) {
    return "https://gorcomfort.ru";
  }

  return /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
}

function formatLeadPagePath(page) {
  if (!page || page === "/" || page === "/index.html") {
    return "";
  }

  return page;
}

function buildLeadPageUrl(page, siteUrl) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl).replace(/\/+$/, "");
  const pagePath = formatLeadPagePath(page);

  return pagePath ? `${normalizedSiteUrl}${pagePath}` : normalizedSiteUrl;
}

function buildLeadPageLabel(page, siteUrl) {
  return buildLeadPageUrl(page, siteUrl).replace(/^https?:\/\//i, "");
}

function buildPhoneHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `tel:+${digits}` : "";
}

function formatLeadDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Не указано";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function escapeTelegramHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildTelegramMessage(lead, siteUrl) {
  const typeLabel =
    lead.type === "coupon" ? "Купон / скидка" : "Обычная заявка";
  const pageLabel = buildLeadPageLabel(lead.page, siteUrl);
  const pageUrl = buildLeadPageUrl(lead.page, siteUrl);
  const phoneHref = buildPhoneHref(lead.phone);
  const timeLabel = formatLeadDateTime(lead.createdAt);
  const title =
    lead.type === "coupon"
      ? "Новая заявка на скидку"
      : "Новая заявка с сайта";

  return [
    `<b>${escapeTelegramHtml(title)}</b>`,
    "",
    `<b>ID:</b> ${escapeTelegramHtml(lead.id || "Не указано")}`,
    `<b>Тип заявки:</b> ${escapeTelegramHtml(typeLabel)}`,
    `<b>Имя:</b> ${escapeTelegramHtml(lead.name || "Не указано")}`,
    phoneHref
      ? `<b>Телефон:</b> <a href="${escapeTelegramHtml(
          phoneHref
        )}">${escapeTelegramHtml(lead.phone || "")}</a>`
      : `<b>Телефон:</b> ${escapeTelegramHtml(lead.phone || "Не указано")}`,
    `<b>Услуга:</b> ${escapeTelegramHtml(lead.service || "Не указана")}`,
    `<b>Комментарий:</b> ${escapeTelegramHtml(lead.message || "Не указан")}`,
    `<b>Страница:</b> <a href="${escapeTelegramHtml(
      pageUrl
    )}">${escapeTelegramHtml(pageLabel)}</a>`,
    `<b>Источник:</b> ${escapeTelegramHtml(lead.source || "Не указан")}`,
    `<b>Время:</b> ${escapeTelegramHtml(timeLabel)}`,
  ].join("\n");
}

async function sendTelegramNotification(lead) {
  const config = getTelegramConfig();
  const isConfigured = Boolean(config.botToken && config.chatId);

  if (!isConfigured) {
    return {
      channel: "telegram",
      enabled: false,
      status: "skipped",
      reason: "Telegram provider is not configured yet",
    };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${config.botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: buildTelegramMessage(lead, config.siteUrl),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );

  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.description || "Telegram notification request failed"
    );
  }

  return {
    channel: "telegram",
    enabled: true,
    status: "sent",
    messageId: result.result?.message_id,
    chatId: String(config.chatId),
  };
}

module.exports = {
  sendTelegramNotification,
};
