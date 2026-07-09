export const phoneRegex = /^(\+251|0)?9\d{8}$/;

export const upgradeAmounts = {
  extend: 25,
  boost: 50,
  overflow: 25
} as const;

export function expiry(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function assertString(value: unknown, name: string, min: number, max: number) {
  if (typeof value !== "string") throw new Error(`${name} is required`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) throw new Error(`${name} length is invalid`);
  return trimmed;
}
