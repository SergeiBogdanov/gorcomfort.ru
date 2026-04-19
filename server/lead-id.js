function pad(value, size) {
  return String(value).padStart(size, "0");
}

function createRandomSuffix(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    result += alphabet[randomIndex];
  }

  return result;
}

function generateLeadId(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1, 2);
  const day = pad(date.getDate(), 2);
  const hours = pad(date.getHours(), 2);
  const minutes = pad(date.getMinutes(), 2);
  const seconds = pad(date.getSeconds(), 2);
  const suffix = createRandomSuffix(4);

  return `GC-${year}${month}${day}-${hours}${minutes}${seconds}-${suffix}`;
}

module.exports = {
  generateLeadId,
};
