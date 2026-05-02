const { generateLeadId } = require("./lead-id");

class LeadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "LeadValidationError";
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value) {
  const digits = normalizeString(value).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }

  return digits;
}

function validateLeadPayload(payload) {
  const type = normalizeString(payload.type);
  const name = normalizeString(payload.name);
  const phone = normalizePhone(payload.phone);
  const service = normalizeString(payload.service);
  const message = normalizeString(payload.message);
  const page = normalizeString(payload.page);
  const source = normalizeString(payload.source);

  if (!type) {
    throw new LeadValidationError("Lead type is required");
  }

  if (!["request", "coupon", "cart"].includes(type)) {
    throw new LeadValidationError("Unsupported lead type");
  }

  if (!name) {
    throw new LeadValidationError("Name is required");
  }

  if (!phone || phone.length !== 11) {
    throw new LeadValidationError("Phone must contain 11 digits");
  }

  return {
    type,
    name,
    phone,
    service,
    message,
    page,
    source,
  };
}

function finalizeLead(validLeadPayload) {
  return {
    id: generateLeadId(),
    ...validLeadPayload,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  LeadValidationError,
  validateLeadPayload,
  finalizeLead,
};
