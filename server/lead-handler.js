const { validateLeadPayload } = require("./lead-validator");
const { deliverLead } = require("./notifications");

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
    const deliveryResult = await deliverLead(lead);

    sendJson(response, 200, {
      ok: true,
      lead,
      delivery: deliveryResult,
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
