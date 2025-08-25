// lib/scrapers/utils.ts (substitua inteiro)
import * as cheerio from "cheerio";
import { parseBRL } from "../price";

/** Normaliza e valida um preço (faixa “sensata”). */
export function normalizePrice(n: number | null): number | null {
  if (!n || !Number.isFinite(n)) return null;
  const min = Number(process.env.SCRAPE_MIN_PRICE ?? 50);   // evita “1”
  const max = Number(process.env.SCRAPE_MAX_PRICE ?? 200000);
  if (n < min || n > max) return null;
  // duas casas decimais
  return Math.round(n * 100) / 100;
}

/** Tenta ler preço de <script id="__NEXT_DATA__"> (JSON Next.js) */
export function parsePriceFromNextData($: cheerio.CheerioAPI): number | null {
  const raw = $("#__NEXT_DATA__").text();
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const flat: any[] = [];
    walk(data, flat);
    const nums = flat
      .filter((v) => typeof v === "string" || typeof v === "number")
      .map((v) => (typeof v === "string" ? v : String(v)));

    for (const s of nums) {
      // tenta nº estilo EN
      const en = Number(s.replace(/\s+/g, "").replace(",", "."));
      const br = parseBRL(s);
      const candidate = normalizePrice(Number.isFinite(en) ? en : br);
      if (candidate) return candidate;
    }
  } catch {}
  return null;
}

/** Procura "price": 1234.xx em todos os <script> (regex exige 3+ dígitos totais) */
export function parsePriceFromAnyScript($: cheerio.CheerioAPI): number | null {
  const scripts = $("script")
    .map((_, el) => $(el).contents().text())
    .get()
    .filter(Boolean);

  // exige pelo menos 3 dígitos (ex.: 999, 1.999, 1999.90)
  const re = /"price"\s*:\s*"?(\d{3,}(?:[\.,]\d{2})?)"?/gi;

  for (const s of scripts) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      const txt = m[1];
      const num =
        Number(txt.replace(/\./g, "").replace(",", ".")) || parseBRL(txt) || null;
      const candidate = normalizePrice(num);
      if (candidate) return candidate;
    }
  }
  return null;
}

function walk(node: any, out: any[]) {
  if (node == null) return;
  if (typeof node !== "object") {
    out.push(node);
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (/price|preco|valor/i.test(k)) out.push(v);
    walk(v, out);
  }
}
