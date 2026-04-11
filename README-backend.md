# Backend preparation

This project now includes a lightweight local Node.js server for lead processing.

## What is ready

- `server.js` serves static files and accepts `POST /api/leads`
- `server/lead-validator.js` normalizes and validates incoming leads
- `server/notifications.js` is the shared delivery layer for email and Telegram
- `server/providers/email.js`, `server/providers/google-sheets.js` and `server/providers/telegram.js` are prepared as separate providers
- `.env.example` contains the variables we will use in the next steps
- Telegram delivery is already implemented and will start working as soon as `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are filled in
- Google Sheets delivery is already implemented and will start working as soon as the Google service account variables are filled in

## Local start

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## Telegram later

When we move to the Telegram step, only these values will be needed in `.env`:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

After that, every new lead will be sent both to email and to Telegram through the shared notification layer.

## Google Sheets later

To enable Google Sheets saving, these values will be needed in `.env`:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_SHEET_NAME`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

After that, every new lead can also be appended to a Google Sheet as a separate row.

## Test API example

Send a `POST` request to `/api/leads` with JSON:

```json
{
  "type": "request",
  "name": "Иван",
  "phone": "+7 (999) 123-45-67",
  "service": "Монтаж",
  "message": "Тестовая заявка",
  "page": "/index.html",
  "source": "request-modal"
}
```
