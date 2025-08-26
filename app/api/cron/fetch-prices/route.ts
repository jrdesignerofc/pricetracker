// app/api/cron/fetch-prices/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Config
const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS ?? 15000); // 15s por domínio
const RETRIES = Number(process.env.SCRAPE_RETRIES ?? 3);
const ALLOW_DUPLICATE_MINUTES = Number(process.env.ALLOW_DUPLICATE_MINUTES ?? 60);

// Utils
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 500) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw lastErr;
}

// Detecta automaticamente a função exportada no módulo do scraper.
// Aceita várias convenções: scrapeKabumPrice, scrapePrice, scrape, getPrice, extractPrice.
function pickScraperFn(mod: any, candidates: string[]) {
  for (const name of candidates) {
    const fn = mod?.[name];
    if (typeof fn === "function") return fn;
  }
  // default export?
  if (typeof mod?.default === "function") return mod.default;
  return null;
}

async function callStoreScraper(store: string, url: string): Promise<{ price?: number | null; currency?: string | null }> {
  const candidates = ["scrapeKabumPrice", "scrapeTerabytePrice", "scrapePichauPrice", "scrapePrice", "scrape", "getPrice", "extractPrice"];

  switch (store.toUpperCase()) {
    case "KABUM": {
      const mod = await import("@/lib/scrapers/kabum");
      const fn = pickScraperFn(mod, candidates);
      if (!fn) throw new Error("kabum scraper export not found");
      return await fn(url);
    }
    case "TERABYTE": {
      const mod = await import("@/lib/scrapers/terabyte");
      const fn = pickScraperFn(mod, candidates);
      if (!fn) throw new Error("terabyte scraper export not found");
      return await fn(url);
    }
    case "PICHAU": {
      const mod = await import("@/lib/scrapers/pichau");
      const fn = pickScraperFn(mod, candidates);
      if (!fn) throw new Error("pichau scraper export not found");
      return await fn(url);
    }
    default:
      throw new Error(`store not supported: ${store}`);
  }
}

type Result = {
  productId: string;
  ok: boolean;
  inserted?: boolean;
  skipped?: boolean;
  reason?: string;
};

export async function GET() {
  try {
    const products = await prisma.product.findMany({ where: { isActive: true } });

    const lastRequestPerDomain = new Map<string, number>();
    const results: Result[] = [];

    for (const product of products) {
      // valida URL
      let parsed: URL | null = null;
      try {
        parsed = new URL(product.url);
      } catch {
        results.push({ productId: product.id, ok: false, reason: "invalid-url" });
        continue;
      }

      // rate-limit por domínio
      const domain = parsed.hostname;
      const lastAt = lastRequestPerDomain.get(domain) ?? 0;
      const wait = RATE_LIMIT_MS - (Date.now() - lastAt);
      if (wait > 0) await sleep(wait);
      lastRequestPerDomain.set(domain, Date.now());

      // scrape com retry
      try {
        const scraped = await retry(
          () => callStoreScraper(String(product.store), product.url),
          RETRIES,
          500
        );

        const priceNumber =
          scraped && typeof scraped.price === "number" && !Number.isNaN(scraped.price)
            ? Number(scraped.price)
            : NaN;

        if (!Number.isFinite(priceNumber)) {
          results.push({ productId: product.id, ok: false, reason: "no-price-found" });
          continue;
        }

        // deduplicação: pular se mesmo preço e muito recente
        const lastRow = await prisma.priceHistory.findFirst({
          where: { productId: product.id },
          orderBy: { collectedAt: "desc" },
        });

        if (lastRow) {
          const lastPrice = Number(lastRow.priceDecimal);
          const minutesSince = (Date.now() - new Date(lastRow.collectedAt).getTime()) / 1000 / 60;
          if (lastPrice === priceNumber && minutesSince < ALLOW_DUPLICATE_MINUTES) {
            results.push({ productId: product.id, ok: true, skipped: true });
            continue;
          }
        }

        // inserir ponto novo
        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            priceDecimal: priceNumber,
            currency: scraped?.currency ?? "BRL",
            collectedAt: new Date(),
          },
        });

        results.push({ productId: product.id, ok: true, inserted: true });
      } catch (err: any) {
        console.error(`Error scraping product ${product.id}:`, err);
        results.push({ productId: product.id, ok: false, reason: String(err?.message ?? err) });
      }
    }

    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (err: any) {
    console.error("Cron fetch-prices failed:", err);
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
