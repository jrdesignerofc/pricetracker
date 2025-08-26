// app/api/cron/fetch-prices/route.ts
export const dynamic = "force-dynamic"; // força execução no server (sem cache de página)

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma"; // 👈 trocado de "@/lib/prisma" para relativo

// ===== Config =====
const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS ?? 15000); // ≥15s por domínio
const RETRIES = Number(process.env.SCRAPE_RETRIES ?? 3);
const ALLOW_DUPLICATE_MINUTES = Number(process.env.ALLOW_DUPLICATE_MINUTES ?? 60);
const DEFAULT_BATCH_SIZE = Number(process.env.CRON_BATCH_SIZE ?? 10);

// ===== Utils =====
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(fn: () => Promise<T>, attempts = RETRIES, baseDelay = 500) {
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

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }, // evita X-Vercel-Cache: HIT
  });
}

// Detecta automaticamente a função exportada no módulo do scraper.
// Aceita: scrapeKabumPrice, scrapeTerabytePrice, scrapePichauPrice, scrapePrice, scrape, getPrice, extractPrice, default.
function pickScraperFn(mod: any, candidates: string[]) {
  for (const name of candidates) {
    const fn = mod?.[name];
    if (typeof fn === "function") return fn;
  }
  if (typeof mod?.default === "function") return mod.default;
  return null;
}

async function callStoreScraper(
  store: string,
  url: string
): Promise<{ price?: number | null; currency?: string | null }> {
  const candidates = [
    "scrapeKabumPrice",
    "scrapeTerabytePrice",
    "scrapePichauPrice",
    "scrapePrice",
    "scrape",
    "getPrice",
    "extractPrice",
  ];

  switch (store.toUpperCase()) {
    case "KABUM": {
      const mod = await import("../../../../lib/scrapers/kabum"); // 👈 relativo
      const fn = pickScraperFn(mod, candidates);
      if (!fn) throw new Error("kabum scraper export not found");
      return await fn(url);
    }
    case "TERABYTE": {
      const mod = await import("../../../../lib/scrapers/terabyte"); // 👈 relativo
      const fn = pickScraperFn(mod, candidates);
      if (!fn) throw new Error("terabyte scraper export not found");
      return await fn(url);
    }
    case "PICHAU": {
      const mod = await import("../../../../lib/scrapers/pichau"); // 👈 relativo
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

export async function GET(request: Request) {
  try {
    // 🔐 Auth simples: aceita header x-cron-key OU query ?key=
    const required = process.env.CRON_SECRET;
    if (required) {
      const url = new URL(request.url);
      const keyFromHeader = request.headers.get("x-cron-key");
      const keyFromQuery = url.searchParams.get("key");
      const key = keyFromHeader || keyFromQuery;
      if (!key || key !== required) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }
    }

    // -------- Paginação por lote (slot/slots/batchSize) --------
    const url = new URL(request.url);
    const slot = Number(url.searchParams.get("slot") ?? NaN);
    const slots = Number(url.searchParams.get("slots") ?? NaN);
    const batchSize = Math.max(1, Number(url.searchParams.get("batchSize") ?? DEFAULT_BATCH_SIZE));

    const whereActive = { isActive: true };
    const total = await prisma.product.count({ where: whereActive });

    if (total === 0) {
      return json({
        ok: true,
        batch: { total: 0, processed: 0, batchSize, slot: Number.isFinite(slot) ? slot : null, slots: Number.isFinite(slots) ? slots : null },
        results: [],
      });
    }

    let products =
      Number.isFinite(slot) && Number.isFinite(slots) && slots > 0
        ? await prisma.product.findMany({
            where: whereActive,
            orderBy: { updatedAt: "asc" }, // varredura estável
            skip: Math.min(((slot % slots + slots) % slots) * batchSize, Math.max(total - 1, 0)),
            take: batchSize,
          })
        : await prisma.product.findMany({
            where: whereActive,
            orderBy: { updatedAt: "asc" },
            take: batchSize,
          });
    // -----------------------------------------------------------

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

      // scrape com retry + backoff
      try {
        const scraped = await retry(() => callStoreScraper(String(product.store), product.url));

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

    return json(
      {
        ok: true,
        batch: {
          total,
          processed: products.length,
          batchSize,
          slot: Number.isFinite(slot) ? slot : null,
          slots: Number.isFinite(slots) ? slots : null,
        },
        results,
      },
      200
    );
  } catch (err: any) {
    console.error("Cron fetch-prices failed:", err);
    return json({ ok: false, error: String(err?.message ?? err) }, 500);
  }
}
