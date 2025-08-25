// lib/price.ts
// util p/ normalizar números em BRL (R$ 1.234,56 -> 1234.56)
export function parseBRL(text: string): number | null {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/[^\d,.-]/g, "") // mantém dígitos, vírgula, ponto e sinal
    .trim();

  if (!cleaned) return null;

  // regra comum pt-BR: separador decimal = vírgula; milhar = ponto
  const normalized = cleaned
    .replace(/\.(?=\d{3}(?:\D|$))/g, "") // remove pontos de milhar
    .replace(",", "."); // vírgula -> ponto decimal

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}