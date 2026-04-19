function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
    siteUrl: process.env.SITE_URL || "gorcomfort.ru",
  };
}

function formatLeadPage(page, siteUrl) {
  if (!page || page === "/" || page === "/index.html") {
    return siteUrl;
  }

  return `${siteUrl}${page}`;
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

function escapeTelegramText(value) {
  return String(value).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function buildTelegramMessage(lead, siteUrl) {
  const typeLabel =
    lead.type === "coupon" ? "Купон / скидка" : "Обычная заявка";
  const pageLabel = formatLeadPage(lead.page, siteUrl);
  const timeLabel = formatLeadDateTime(lead.createdAt);
  const title =
    lead.type === "coupon"
      ? "Новая заявка на скидку"
      : "Новая заявка с сайта";

  return [
    `*${escapeTelegramText(title)}*`,
    "",
    `*ID:* ${escapeTelegramText(lead.id || "Не указано")}`,
    `*Тип заявки:* ${escapeTelegramText(typeLabel)}`,
    `*Имя:* ${escapeTelegramText(lead.name || "Не указано")}`,
    `*Телефон:* ${escapeTelegramText(lead.phone || "Не указано")}`,
    `*Услуга:* ${escapeTelegramText(lead.service || "Не указана")}`,
    `*Комментарий:* ${escapeTelegramText(lead.message || "Не указан")}`,
    `*Страница:* ${escapeTelegramText(pageLabel)}`,
    `*Источник:* ${escapeTelegramText(lead.source || "Не указан")}`,
    `*Время:* ${escapeTelegramText(timeLabel)}`,
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
        parse_mode: "MarkdownV2",
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
