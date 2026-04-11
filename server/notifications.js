const { sendEmailNotification } = require("./providers/email");
const { sendTelegramNotification } = require("./providers/telegram");

async function deliverLead(lead) {
  const channels = [];

  const emailResult = await sendEmailNotification(lead);
  if (emailResult.enabled) {
    channels.push(emailResult);
  }

  const telegramResult = await sendTelegramNotification(lead);
  if (telegramResult.enabled) {
    channels.push(telegramResult);
  }

  return {
    accepted: true,
    channels,
  };
}

module.exports = {
  deliverLead,
};
