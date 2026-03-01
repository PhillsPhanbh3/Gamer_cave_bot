module.exports = function parseTime(timeString) {
  const regex = /(\d+)([smhdw])/g;
  let match;
  let totalMs = 0;

  while ((match = regex.exec(timeString)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        totalMs += value * 1000;
        break;
      case "m":
        totalMs += value * 60 * 1000;
        break;
      case "h":
        totalMs += value * 60 * 60 * 1000;
        break;
      case "d":
        totalMs += value * 24 * 60 * 60 * 1000;
        break;
      case "w":
        totalMs += value * 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        return 0;
    }
  }

  return totalMs;
};
