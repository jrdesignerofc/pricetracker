// lib/scrapers/kabum.ts
import * as cheerio from "cheerio";
import { parseBRL } from "../price";
import { fetchWithRetry } from "../http";
import { parsePriceFromNextData, parsePriceFromAnyScript } from "./utils";

export async function scrapeKabumPrice(url: string): Promise<{ price: number; currency?: string }> {
  const { html } = await fetchWithRetry(url, {
    headers: { "User-Agent": process.env.SCRAPER_USER_AGENT || "PriceTrackerBot/1.0" },
    timeoutMs: 12000,
    retries: 2,
  });

  const $ = cheerio.load(html);

  const fromJson = parsePriceFromNextData($) ?? parsePriceFromAnyScript($);
  if (typeof fromJson === "number" && Number.isFinite(fromJson)) {
    return { price: fromJson, currency: "BRL" };
  }

  // Fallback por seletor (ajuste se necessário)
  let text =
    $("span.price__current").first().text().trim() ||
    $("strong.finalPrice").first().text().trim() ||
    $("div.priceCard > strong").first().text().trim();

  if (text) {
    const parsed = parseBRL(text); // number | null
    const value = typeof parsed === "number" ? parsed : NaN;
    if (Number.isFinite(value)) return { price: value, currency: "BRL" };
  }

  throw new Error("price-not-found-kabum");
}

export default scrapeKabumPrice;
