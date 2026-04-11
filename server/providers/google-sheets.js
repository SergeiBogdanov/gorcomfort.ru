const { google } = require("googleapis");

function getSheetsConfig() {
  return {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || "Leads",
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    privateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(
      /\\n/g,
      "\n"
    ),
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

function buildLeadRow(lead, siteUrl) {
  return [
    formatLeadDateTime(lead.createdAt),
    lead.type === "coupon" ? "Купон / скидка" : "Обычная заявка",
    lead.name || "",
    lead.phone || "",
    lead.service || "",
    lead.message || "",
    formatLeadPage(lead.page, siteUrl),
    lead.source || "",
  ];
}

async function sendGoogleSheetsNotification(lead) {
  const config = getSheetsConfig();
  const isConfigured = Boolean(
    config.spreadsheetId &&
      config.sheetName &&
      config.clientEmail &&
      config.privateKey
  );

  if (!isConfigured) {
    return {
      channel: "google_sheets",
      enabled: false,
      status: "skipped",
      reason: "Google Sheets provider is not configured yet",
    };
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sheetName}!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [buildLeadRow(lead, config.siteUrl)],
    },
  });

  return {
    channel: "google_sheets",
    enabled: true,
    status: "sent",
    spreadsheetId: config.spreadsheetId,
    updatedRange: response.data.updates?.updatedRange || "",
    updatedRows: response.data.updates?.updatedRows || 0,
  };
}

module.exports = {
  sendGoogleSheetsNotification,
};
