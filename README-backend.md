# Backend preparation

This project now includes a lightweight local Node.js server for lead processing.

## What is ready

- `server.js` serves static files and accepts `POST /api/leads`
- `server/lead-validator.js` normalizes and validates incoming leads
- `server/notifications.js` is the shared delivery layer for email and Telegram
- `server/providers/email.js` and `server/providers/telegram.js` are prepared as separate providers
- `.env.example` contains the variables we will use in the next steps

## Local start

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

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
