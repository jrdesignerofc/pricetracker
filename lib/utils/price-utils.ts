// lib/utils/price-utils.ts
export function parseBRL(text: string): number {
  if (!text) return NaN;

  // normalize whitespace
  let cleaned = String(text).trim();

  // remove currency symbols and non-numeric chars except dot, comma, minus
  cleaned = cleaned.replace(/\s/g, "").replace(/[^\d\-,.]/g, "");

  // If contains comma, assume Brazilian format with comma as decimal separator
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma) {
    // Keep only last comma as decimal separator, remove other dots (thousands)
    const lastCommaIdx = cleaned.lastIndexOf(",");
    const intPart = cleaned.slice(0, lastCommaIdx).replace(/\./g, "");
    const decPart = cleaned.slice(lastCommaIdx + 1).replace(/\./g, "");
    cleaned = `${intPart}.${decPart}`;
  } else if (hasDot && cleaned.match(/\.\d{2}$/)) {
    // form like 1234.56 -> already ok
  } else {
    // only digits or unexpected format -> leave as-is
  }

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}
