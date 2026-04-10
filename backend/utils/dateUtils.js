/**
 * Add planMonths to a base date using calendar-month semantics.
 * Clamps to end of month if the target month is shorter.
 */
const calcValidTill = (baseDate, planMonths = 1) => {
  const d = new Date(baseDate);
  const currentDay = d.getDate();
  d.setMonth(d.getMonth() + planMonths);
  if (d.getDate() !== currentDay) {
    d.setDate(0); // clamp to last day of target month
  }
  d.setDate(d.getDate() - 1);
  return d;
};

module.exports = { calcValidTill };