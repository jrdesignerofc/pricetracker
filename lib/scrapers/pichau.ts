// lib/scrapers/pichau.ts (troque o conteÃºdo da funÃ§Ã£o para usar normalize e utils)
import * as cheerio from "cheerio";
import { parseBRL } from "../price";
import { fetchWithRetry } from "../http";
import { parsePriceFromNextData, parsePriceFromAnyScript, normalizePrice } from "./utils";

export async function scrapePichauPrice(productUrl: string): Promise<{ price: number; currency: "BRL" }> {
  const { html } = await fetchWithRetry(productUrl);
  const $ = cheerio.load(html);

  // 1) JSON-LD
  const jsonLd: number[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        const price = item?.offers?.price ?? item?.offers?.lowPrice ?? item?.price;
        const num = typeof price === "string" ? Number(price.replace(",", ".")) : Number(price);
        const cand = normalizePrice(Number.isFinite(num) ? num : null);
        if (cand) jsonLd.push(cand);
      }
    } catch {}
  });
  if (jsonLd.length > 0) return { price: jsonLd[0], currency: "BRL" };

  // 2) __NEXT_DATA__
  const nd = normalizePrice(parsePriceFromNextData($));
  if (nd) return { price: nd, currency: "BRL" };

  // 3) HTML
  const candidates = [
    $(".price, .final-price, .product-price, [data-price], [data-testid='price']").first().text(),
    $("[data-price]").attr("data-price") ?? "",
    $("[class*='preco'] [class*='valor']").first().text(),
  ].filter(Boolean);

  for (const raw of candidates) {
    const cand = normalizePrice(parseBRL(raw));
    if (cand) return { price: cand, currency: "BRL" };
  }

  // 4) scripts genÃ©ricos
  const any = normalizePrice(parsePriceFromAnyScript($));
  if (any) return { price: any, currency: "BRL" };

  throw new Error("PRICE_NOT_FOUND");
}
