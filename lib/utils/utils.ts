// lib/utils/price-utils.ts
export function parseBRL(text: string): number {
  if (!text) return NaN;
  // remove non-digit except comma and dot and minus
  let cleaned = text.replace(/\s/g, "").replace(/[^\d\-,.]/g, "");
  // if format like "1.234,56" -> remove dots, replace comma with dot
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  if (hasComma) {
    // assume dots are thousand separators -> remove them
    const lastComma = cleaned.lastIndexOf(",");
    const intPart = cleaned.slice(0, lastComma).replace(/\./g, "");
    const decPart = cleaned.slice(lastComma + 1).replace(/\./g, "");
    cleaned = `${intPart}.${decPart}`;
  } else if (hasDot && cleaned.match(/\.\d{2}$/)) {
    // format "1234.56" - keep
  } else {
    // only digits
  }
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}
