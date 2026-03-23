module.exports = function parseTime(timeString) {
  if (typeof timeString !== "string") return 0;

  const s = timeString.trim();
  if (!s) return 0;

  const unitToMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  let i = 0;
  let totalMs = 0;
  let sawAnyPart = false;

  while (i < s.length) {
    // allow whitespace between parts
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;

    // parse number (must exist)
    if (s[i] < "0" || s[i] > "9") return 0;

    let value = 0;
    while (i < s.length && s[i] >= "0" && s[i] <= "9") {
      value = value * 10 + (s.charCodeAt(i) - 48);
      i++;
    }

    // parse unit (must exist)
    if (i >= s.length) return 0;
    const unit = s[i];
    const mult = unitToMs[unit];
    if (!mult) return 0;
    i++;

    totalMs += value * mult;
    sawAnyPart = true;
  }

  return sawAnyPart ? totalMs : 0;
};