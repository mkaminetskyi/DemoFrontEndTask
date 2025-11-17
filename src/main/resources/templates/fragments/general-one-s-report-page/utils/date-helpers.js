export function toISODateLocal(d) {
  const tz = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tz);
  return local.toISOString().slice(0, 10);
}

export function setDefaultRange(dateFromEl, dateToEl, dataEndpoint) {
  const now = new Date();
  const shouldUseRollingMonth =
    typeof dataEndpoint === "string" &&
    (dataEndpoint.includes("accounts-reconciliation") ||
      dataEndpoint.includes("cash-registers"));

  const start = shouldUseRollingMonth
    ? (() => {
        const date = new Date(now);
        date.setMonth(date.getMonth() - 1);
        return date;
      })()
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const end = shouldUseRollingMonth
    ? now
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (dateFromEl && !dateFromEl.value)
    dateFromEl.value = toISODateLocal(start);
  if (dateToEl && !dateToEl.value)
    dateToEl.value = toISODateLocal(end);
}
