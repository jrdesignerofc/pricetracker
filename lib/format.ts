// lib/format.ts
export const DEFAULT_TZ = process.env.DEFAULT_TZ ?? "America/Sao_Paulo";

export function formatDatePT(date: Date | string | number | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DEFAULT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}
