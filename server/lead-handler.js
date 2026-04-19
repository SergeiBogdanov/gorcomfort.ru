const { validateLeadPayload } = require("./lead-validator");
const { deliverLead } = require("./notifications");
const {
  DEDUPE_WINDOW_MS,
  reserveLead,
  confirmLead,
  releaseLead,
} = require("./lead-deduplication");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 1_000_000) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });
}

async function handleLeadRequest(request, response) {
  try {
    const payload = await readJsonBody(request);
    const lead = validateLeadPayload(payload);
    const reservation = reserveLead(lead);

    if (!reservation.accepted) {
      sendJson(response, 200, {
        ok: true,
        lead,
        duplicate: true,
        delivery: {
          accepted: true,
          duplicate: true,
          channels: [],
          dedupeWindowMs: DEDUPE_WINDOW_MS,
        },
      });
      return;
    }

    let deliveryResult;

    try {
      deliveryResult = await deliverLead(lead);

      if (deliveryResult.accepted) {
        confirmLead(reservation.fingerprint);
      } else {
        releaseLead(reservation.fingerprint);
        throw new Error(
          "Не удалось отправить заявку. Попробуйте еще раз."
        );
      }
    } catch (error) {
      releaseLead(reservation.fingerprint);
      throw error;
    }

    sendJson(response, 200, {
      ok: true,
      lead,
      duplicate: false,
      delivery: {
        ...deliveryResult,
        duplicate: false,
        dedupeWindowMs: DEDUPE_WINDOW_MS,
      },
    });
  } catch (error) {
    const statusCode =
      error.message === "Invalid JSON" || error.message === "Payload too large"
        ? 400
        : error.name === "LeadValidationError"
        ? 422
        : 500;

    sendJson(response, statusCode, {
      ok: false,
      error: error.message || "Unexpected server error",
    });
  }
}

module.exports = {
  handleLeadRequest,
};
