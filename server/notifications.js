const { sendEmailNotification } = require("./providers/email");
const { sendGoogleSheetsNotification } = require("./providers/google-sheets");
const { sendTelegramNotification } = require("./providers/telegram");

function isSuccessfulResult(result) {
  return result?.enabled && result.status === "sent";
}

function isFailedResult(result) {
  return result?.enabled && result.status === "failed";
}

async function runChannelDelivery(sendNotification, channelName, lead) {
  try {
    return await sendNotification(lead);
  } catch (error) {
    return {
      channel: channelName,
      enabled: true,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown delivery error",
    };
  }
}

function toSuccessPromise(deliveryPromise) {
  return deliveryPromise.then((result) => {
    if (isSuccessfulResult(result)) {
      return result;
    }

    throw result;
  });
}

function collectChannelNames(results, predicate) {
  return results.filter(predicate).map((result) => result.channel);
}

function logFailedChannels(results) {
  const failedResults = results.filter(isFailedResult);

  if (failedResults.length === 0) {
    return;
  }

  console.warn("Lead delivery failed in some channels:");

  failedResults.forEach((result) => {
    console.warn(
      `  - ${result.channel}: ${result.error || "Unknown delivery error"}`
    );
  });
}

async function deliverLead(lead) {
  const emailPromise = runChannelDelivery(sendEmailNotification, "email", lead);
  const googleSheetsPromise = runChannelDelivery(
    sendGoogleSheetsNotification,
    "google_sheets",
    lead
  );
  const telegramPromise = runChannelDelivery(
    sendTelegramNotification,
    "telegram",
    lead
  );
  const allResultsPromise = Promise.all([
    emailPromise,
    googleSheetsPromise,
    telegramPromise,
  ]);

  try {
    const firstSuccessfulResult = await Promise.any([
      toSuccessPromise(emailPromise),
      toSuccessPromise(googleSheetsPromise),
      toSuccessPromise(telegramPromise),
    ]);

    void allResultsPromise.then((results) => {
      logFailedChannels(results);
    });

    const pendingChannels = ["email", "google_sheets", "telegram"].filter(
      (channelName) => channelName !== firstSuccessfulResult.channel
    );

    return {
      accepted: true,
      channels: [firstSuccessfulResult],
      successfulChannels: [firstSuccessfulResult.channel],
      failedChannels: [],
      pendingChannels,
    };
  } catch (error) {
    const results = await allResultsPromise;
    const hasConfiguredChannels = results.some((result) => result.enabled);
    const successfulChannels = collectChannelNames(results, isSuccessfulResult);
    const failedChannels = collectChannelNames(results, isFailedResult);

    logFailedChannels(results);

    return {
      accepted: !hasConfiguredChannels || successfulChannels.length > 0,
      channels: results.filter((result) => result.enabled),
      successfulChannels,
      failedChannels,
      pendingChannels: [],
    };
  }
}

module.exports = {
  deliverLead,
};
