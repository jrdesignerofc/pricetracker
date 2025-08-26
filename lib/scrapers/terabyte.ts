// lib/scrapers/terabyte.ts
import * as cheerio from "cheerio";
import { parseBRL } from "../price";
import { fetchWithRetry } from "../http";

/**
 * Extrai o preÃ§o da pÃ¡gina de produto da Terabyte.
 * EstratÃ©gia:
 * 1) JSON-LD (schema.org) -> offers.price / lowPrice
 * 2) Seletores comuns no HTML
 * 3) TODO: ajustar seletor real se layout mudar (inspecione no DevTools)
 */
export async function scrapeTerabytePrice(productUrl: string): Promise<{ price: number; currency: "BRL" }> {
  const { html } = await fetchWithRetry(productUrl);
  const $ = cheerio.load(html);

  // 1) JSON-LD
  const jsonLdPrices: number[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        const price = item?.offers?.price ?? item?.offers?.lowPrice ?? item?.price;
        if (typeof price === "string") {
          const n = Number(price.replace(",", "."));
          if (Number.isFinite(n)) jsonLdPrices.push(n);
        } else if (typeof price === "number") {
          jsonLdPrices.push(price);
        }
      }
    } catch {}
  });
  if (jsonLdPrices.length > 0) {
    const p = jsonLdPrices[0];
    if (Number.isFinite(p)) return { price: p, currency: "BRL" };
  }

  // 2) Seletores HTML (exemplos provÃ¡veis; ajuste conforme a pÃ¡gina real)
  const candidates = [
    $(".preco-promocional, .price, .product-price, [data-price]").first().text(),
    $("[data-price]").attr("data-price") ?? "",
    $("[class*='preco'] [class*='valor']").first().text(),
  ].filter(Boolean);

  for (const raw of candidates) {
    const n = parseBRL(raw);
    if (n) return { price: n, currency: "BRL" };
  }

  // 3) TODO: substituir por seletor real se necessÃ¡rio
  throw new Error("PRICE_NOT_FOUND");
}
