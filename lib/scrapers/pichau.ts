// lib/scrapers/pichau.ts
import * as cheerio from "cheerio";
import { parseBRL } from "../price";
import { fetchWithRetry } from "../http";
import { parsePriceFromNextData, parsePriceFromAnyScript } from "./utils";

export async function scrapePichauPrice(url: string): Promise<{ price: number; currency?: string }> {
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

  const metaPrice = $("meta[itemprop='price']").attr("content")?.trim();
  const text =
    $(".product-price").first().text().trim() ||
    $(".finalPrice").first().text().trim() ||
    metaPrice;

  if (text) {
    const raw = metaPrice ? Number(text.replace(",", ".")) : parseBRL(text); // number | null
    const value = typeof raw === "number" ? raw : NaN;
    if (Number.isFinite(value)) return { price: value, currency: "BRL" };
  }

  throw new Error("price-not-found-pichau");
}

export default scrapePichauPrice;
