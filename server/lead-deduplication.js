const DEDUPE_WINDOW_MS = 2 * 60 * 1000;

const leadCache = new Map();

function normalizeText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function buildLeadFingerprint(lead) {
  return JSON.stringify({
    type: normalizeText(lead.type),
    name: normalizeText(lead.name).toLowerCase(),
    phone: normalizeText(lead.phone),
    service: normalizeText(lead.service).toLowerCase(),
    message: normalizeText(lead.message).toLowerCase(),
    page: normalizeText(lead.page).toLowerCase(),
    source: normalizeText(lead.source).toLowerCase(),
  });
}

function cleanupExpiredLeads(now) {
  leadCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      leadCache.delete(key);
    }
  });
}

function reserveLead(lead) {
  const now = Date.now();
  cleanupExpiredLeads(now);

  const fingerprint = buildLeadFingerprint(lead);
  const existingEntry = leadCache.get(fingerprint);

  if (existingEntry && existingEntry.expiresAt > now) {
    return {
      accepted: false,
      fingerprint,
      duplicate: true,
      status: existingEntry.status,
      retryAfterMs: existingEntry.expiresAt - now,
      existingLead: existingEntry.lead || null,
    };
  }

  leadCache.set(fingerprint, {
    status: "pending",
    expiresAt: now + DEDUPE_WINDOW_MS,
    lead: null,
  });

  return {
    accepted: true,
    fingerprint,
    duplicate: false,
    existingLead: null,
  };
}

function confirmLead(fingerprint, lead) {
  if (!fingerprint) {
    return;
  }

  leadCache.set(fingerprint, {
    status: "sent",
    expiresAt: Date.now() + DEDUPE_WINDOW_MS,
    lead: lead || null,
  });
}

function releaseLead(fingerprint) {
  if (!fingerprint) {
    return;
  }

  leadCache.delete(fingerprint);
}

module.exports = {
  DEDUPE_WINDOW_MS,
  reserveLead,
  confirmLead,
  releaseLead,
};
