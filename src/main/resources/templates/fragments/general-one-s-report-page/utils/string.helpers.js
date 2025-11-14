export const normaliseValue = value => (value || "").trim();

export const toDisplayString = value => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return value.toString();
  return "";
};

export const DEFAULT_CONTRACTOR_VALUE = "всі клієнти";

export const isDefaultContractor = value =>
  normaliseValue(value).toLowerCase() === DEFAULT_CONTRACTOR_VALUE;
