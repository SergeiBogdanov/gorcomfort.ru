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

function formatLeadPage(page) {
  const siteUrl = process.env.SITE_URL || "gorcomfort.ru";

  if (!page || page === "/" || page === "/index.html") {
    return siteUrl;
  }

  return `${siteUrl}${page}`;
}

function formatLeadDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u043e";
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
  const nameSuffix = name ? ` \u043e\u0442 ${name}` : "";

  return lead.type === "coupon"
    ? `\u041d\u043e\u0432\u0430\u044f \u0437\u0430\u044f\u0432\u043a\u0430 \u043d\u0430 \u0441\u043a\u0438\u0434\u043a\u0443 \u0441 \u0441\u0430\u0439\u0442\u0430${nameSuffix}`
    : `\u041d\u043e\u0432\u0430\u044f \u0437\u0430\u044f\u0432\u043a\u0430 \u0441 \u0441\u0430\u0439\u0442\u0430${nameSuffix}`;
}

function buildLeadText(lead) {
  const typeLabel =
    lead.type === "coupon"
      ? "\u041a\u0443\u043f\u043e\u043d / \u0441\u043a\u0438\u0434\u043a\u0430"
      : "\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0437\u0430\u044f\u0432\u043a\u0430";
  const pageLabel = formatLeadPage(lead.page);
  const timeLabel = formatLeadDateTime(lead.createdAt);

  return [
    `\u0422\u0438\u043f \u0437\u0430\u044f\u0432\u043a\u0438: ${typeLabel}`,
    `\u0418\u043c\u044f: ${lead.name}`,
    `\u0422\u0435\u043b\u0435\u0444\u043e\u043d: ${lead.phone}`,
    `\u0423\u0441\u043b\u0443\u0433\u0430: ${lead.service || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430"}`,
    `\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439: ${lead.message || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d"}`,
    `\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430: ${pageLabel}`,
    `\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a: ${lead.source || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d"}`,
    `\u0412\u0440\u0435\u043c\u044f: ${timeLabel}`,
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
  const typeLabel =
    lead.type === "coupon"
      ? "\u041a\u0443\u043f\u043e\u043d / \u0441\u043a\u0438\u0434\u043a\u0430"
      : "\u041e\u0431\u044b\u0447\u043d\u0430\u044f \u0437\u0430\u044f\u0432\u043a\u0430";
  const pageLabel = formatLeadPage(lead.page);
  const timeLabel = formatLeadDateTime(lead.createdAt);

  const rows = [
    ["\u0422\u0438\u043f \u0437\u0430\u044f\u0432\u043a\u0438", typeLabel],
    ["\u0418\u043c\u044f", lead.name],
    ["\u0422\u0435\u043b\u0435\u0444\u043e\u043d", lead.phone],
    ["\u0423\u0441\u043b\u0443\u0433\u0430", lead.service || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430"],
    ["\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439", lead.message || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d"],
    ["\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u0430", pageLabel],
    ["\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a", lead.source || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d"],
    ["\u0412\u0440\u0435\u043c\u044f", timeLabel],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #dbe2ea;font-weight:700;vertical-align:top;">${escapeHtml(
          label
        )}</td><td style="padding:8px 12px;border:1px solid #dbe2ea;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(
          value
        )}</td></tr>`
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
