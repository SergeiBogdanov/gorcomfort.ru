async function sendTelegramNotification(lead) {
  const isConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  if (!isConfigured) {
    return {
      channel: "telegram",
      enabled: false,
      status: "skipped",
      reason: "Telegram provider is not configured yet",
    };
  }

  return {
    channel: "telegram",
    enabled: true,
    status: "not_implemented",
    reason: "Telegram delivery will be connected in a later step",
    leadPreview: {
      type: lead.type,
      name: lead.name,
      phone: lead.phone,
    },
  };
}

module.exports = {
  sendTelegramNotification,
};
