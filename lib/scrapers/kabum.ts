// lib/scrapers/kabum.ts
import * as cheerio from "cheerio";
import { parseBRL } from "@/lib/price";
import { fetchWithRetry } from "@/lib/http";
import { parsePriceFromNextData, parsePriceFromAnyScript } from "./utils";

export async function scrapeKabumPrice(productUrl: string): Promise<{ price: number; currency: "BRL" }> {
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
  if (jsonLdPrices.length > 0) return { price: jsonLdPrices[0], currency: "BRL" };

  // 2) __NEXT_DATA__
  const nd = parsePriceFromNextData($);
  if (nd) return { price: nd, currency: "BRL" };

  // 3) Seletores HTML tÃ­picos
  const candidates = [
    $(".finalPrice, .price__value, .product-price, [data-testid='price-value'], [data-price]").first().text(),
    $("[data-price]").attr("data-price") ?? "",
    $("[class*='price'] [class*='value']").first().text(),
  ].filter(Boolean);
  for (const text of candidates) {
    const n = parseBRL(text);
    if (n) return { price: n, currency: "BRL" };
  }

  // 4) Fallback: qualquer <script> com "price":
  const any = parsePriceFromAnyScript($);
  if (any) return { price: any, currency: "BRL" };

  throw new Error("PRICE_NOT_FOUND");
}
