const nodemailer = require("nodemailer");

let transporter = null;
let transporterCacheKey = "";

function getEmailConfig() {
  return {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    to: process.env.MAIL_TO || "",
    siteUrl: process.env.SITE_URL || "gorcomfort.ru",
  };
}

function getTransporter() {
  const config = getEmailConfig();
  const cacheKey = JSON.stringify(config);

  if (transporter && transporterCacheKey === cacheKey) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  transporterCacheKey = cacheKey;

  return transporter;
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

function buildLeadSubject(lead) {
  const name = (lead.name || "").trim();
  const nameSuffix = name ? ` от ${name}` : "";
  const idPrefix = lead.id ? `[${lead.id}] ` : "";

  if (lead.type === "coupon") {
    return `${idPrefix}Новая заявка на скидку с сайта${nameSuffix}`;
  }

  if (lead.type === "cart") {
    return `${idPrefix}Новая заявка из корзины${nameSuffix}`;
  }

  return `${idPrefix}Новая заявка с сайта${nameSuffix}`;
}

function getLeadTypeLabel(type) {
  if (type === "coupon") return "Купон / скидка";
  if (type === "cart") return "Корзина";
  return "Обычная заявка";
}

function buildLeadText(lead, siteUrl) {
  const typeLabel = getLeadTypeLabel(lead.type);
  const pageLabel = buildLeadPageUrl(lead.page, siteUrl);
  const timeLabel = formatLeadDateTime(lead.createdAt);

  return [
    `ID: ${lead.id || "Не указан"}`,
    `Тип заявки: ${typeLabel}`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    `Услуга: ${lead.service || "Не указана"}`,
    `Комментарий: ${lead.message || "Не указан"}`,
    `Страница: ${pageLabel}`,
    `Источник: ${lead.source || "Не указан"}`,
    `Время: ${timeLabel}`,
  ].join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLeadHtml(lead, siteUrl) {
  const heading = buildLeadSubject(lead);
  const typeLabel = getLeadTypeLabel(lead.type);
  const pageLabel = buildLeadPageLabel(lead.page, siteUrl);
  const pageUrl = buildLeadPageUrl(lead.page, siteUrl);
  const phoneHref = buildPhoneHref(lead.phone);
  const timeLabel = formatLeadDateTime(lead.createdAt);

  const rows = [
    ["ID", lead.id || "Не указан"],
    ["Тип заявки", typeLabel],
    ["Имя", lead.name],
    [
      "Телефон",
      phoneHref
        ? `<a href="${escapeHtml(phoneHref)}" style="color:#0b5ed7;text-decoration:none;">${escapeHtml(
            lead.phone
          )}</a>`
        : escapeHtml(lead.phone || "Не указан"),
    ],
    ["Услуга", lead.service || "Не указана"],
    ["Комментарий", lead.message || "Не указан"],
    [
      "Страница",
      `<a href="${escapeHtml(
        pageUrl
      )}" style="color:#0b5ed7;text-decoration:none;">${escapeHtml(
        pageLabel
      )}</a>`,
    ],
    ["Источник", lead.source || "Не указан"],
    ["Время", timeLabel],
  ]
    .map(([label, value]) => {
      const safeValue =
        label === "Телефон" || label === "Страница"
          ? value
          : escapeHtml(value);

      return `<tr><td style="padding:8px 12px;border:1px solid #dbe2ea;font-weight:700;vertical-align:top;">${escapeHtml(
        label
      )}</td><td style="padding:8px 12px;border:1px solid #dbe2ea;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${safeValue}</td></tr>`;
    })
    .join("");

  return [
    '<div style="font-family:Arial,sans-serif;color:#0f172a;">',
    `<h2 style="margin:0 0 16px;">${escapeHtml(heading)}</h2>`,
    '<table style="border-collapse:collapse;width:100%;max-width:720px;">',
    rows,
    "</table>",
    "</div>",
  ].join("");
}

async function sendEmailNotification(lead) {
  const config = getEmailConfig();
  const isConfigured = Boolean(
    config.host &&
      config.port &&
      config.user &&
      config.pass &&
      config.from &&
      config.to
  );

  if (!isConfigured) {
    return {
      channel: "email",
      enabled: false,
      status: "skipped",
      reason: "Email provider is not configured yet",
    };
  }

  const mailOptions = {
    from: config.from,
    to: config.to,
    subject: buildLeadSubject(lead),
    text: buildLeadText(lead, config.siteUrl),
    html: buildLeadHtml(lead, config.siteUrl),
  };

  const emailTransporter = getTransporter();
  const info = await emailTransporter.sendMail(mailOptions);

  return {
    channel: "email",
    enabled: true,
    status: "sent",
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

module.exports = {
  sendEmailNotification,
};
