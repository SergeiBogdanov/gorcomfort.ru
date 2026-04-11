async function sendEmailNotification(lead) {
  const isConfigured = Boolean(process.env.SMTP_HOST && process.env.MAIL_TO);

  if (!isConfigured) {
    return {
      channel: "email",
      enabled: false,
      status: "skipped",
      reason: "Email provider is not configured yet",
    };
  }

  return {
    channel: "email",
    enabled: true,
    status: "not_implemented",
    reason: "Email delivery will be connected in the next step",
    leadPreview: {
      type: lead.type,
      name: lead.name,
      phone: lead.phone,
    },
  };
}

module.exports = {
  sendEmailNotification,
};
