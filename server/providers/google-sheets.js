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
    lead.id || "",
  ];
}

function createSheetsClient(config) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function resolveSheetId(sheets, config) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });

  const sheet = spreadsheet.data.sheets?.find(
    (item) => item.properties?.title === config.sheetName
  );

  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
    throw new Error(
      `Google Sheets tab "${config.sheetName}" was not found in the spreadsheet`
    );
  }

  return sheet.properties.sheetId;
}

async function insertLeadAtTop(sheets, config, rowValues) {
  const sheetId = await resolveSheetId(sheets, config);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: config.spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: 1,
              endIndex: 2,
            },
            inheritFromBefore: false,
          },
        },
      ],
    },
  });

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sheetName}!A2:I2`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [rowValues],
    },
  });

  return response.data;
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

  const sheets = createSheetsClient(config);
  const updates = await insertLeadAtTop(
    sheets,
    config,
    buildLeadRow(lead, config.siteUrl)
  );

  return {
    channel: "google_sheets",
    enabled: true,
    status: "sent",
    spreadsheetId: config.spreadsheetId,
    updatedRange: updates.updatedRange || `${config.sheetName}!A2:I2`,
    updatedRows: updates.updatedRows || 1,
  };
}

module.exports = {
  sendGoogleSheetsNotification,
};
