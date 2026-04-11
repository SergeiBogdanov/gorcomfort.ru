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

function buildLeadSubject(lead) {
  const clientName = lead.name ? ` от ${lead.name}` : "";

  return lead.type === "coupon"
    ? `Новая заявка на скидку с сайта${clientName}`
    : `Новая заявка с сайта${clientName}`;
}

function buildLeadText(lead) {
  const typeLabel = lead.type === "coupon" ? "Купон / скидка" : "Обычная заявка";

  return [
    `Тип заявки: ${typeLabel}`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    `Услуга: ${lead.service || "Не указана"}`,
    `Комментарий: ${lead.message || "Не указан"}`,
    `Страница: ${lead.page || "Не указана"}`,
    `Источник: ${lead.source || "Не указан"}`,
    `Время: ${lead.createdAt}`,
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

function buildLeadHtml(lead) {
  const heading = buildLeadSubject(lead);
  const rows = [
    ["Тип заявки", lead.type === "coupon" ? "Купон / скидка" : "Обычная заявка"],
    ["Имя", lead.name],
    ["Телефон", lead.phone],
    ["Услуга", lead.service || "Не указана"],
    ["Комментарий", lead.message || "Не указан"],
    ["Страница", lead.page || "Не указана"],
    ["Источник", lead.source || "Не указан"],
    ["Время", lead.createdAt],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #dbe2ea;font-weight:700;">${escapeHtml(
          label
        )}</td><td style="padding:8px 12px;border:1px solid #dbe2ea;">${escapeHtml(value)}</td></tr>`
    )
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
    text: buildLeadText(lead),
    html: buildLeadHtml(lead),
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
