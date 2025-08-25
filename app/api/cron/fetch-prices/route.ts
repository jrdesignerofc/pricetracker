// app/api/cron/fetch-prices/route.ts  (ATUALIZADO para 3 lojas)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeKabumPrice } from "@/lib/scrapers/kabum";
import { scrapeTerabytePrice } from "@/lib/scrapers/terabyte";
import { scrapePichauPrice } from "@/lib/scrapers/pichau";

const MIN_DELAY_MS = Number(process.env.SCRAPE_MIN_DELAY_MS ?? 12000);

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const results: Array<{ productId: string; ok: boolean; price?: number; error?: string }> = [];

  try {
    const items = await prisma.product.findMany({
      where: { isActive: true, store: { in: ["KABUM", "TERABYTE", "PICHAU"] } },
      orderBy: { createdAt: "asc" },
      take: 45, // limite de segurança
    });

    const groups = {
      KABUM: items.filter((p) => p.store === "KABUM"),
      TERABYTE: items.filter((p) => p.store === "TERABYTE"),
      PICHAU: items.filter((p) => p.store === "PICHAU"),
    };

    for (const store of Object.keys(groups) as Array<keyof typeof groups>) {
      const list = groups[store];
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const t0 = Date.now();
        try {
          let priceInfo: { price: number; currency: "BRL" };
          if (p.store === "KABUM") priceInfo = await scrapeKabumPrice(p.url);
          else if (p.store === "TERABYTE") priceInfo = await scrapeTerabytePrice(p.url);
          else if (p.store === "PICHAU") priceInfo = await scrapePichauPrice(p.url);
          else throw new Error("STORE_NOT_SUPPORTED");

          await prisma.priceHistory.create({
            data: {
              productId: p.id,
              priceDecimal: priceInfo.price,
              currency: priceInfo.currency,
              collectedAt: new Date(),
            },
          });

          results.push({ productId: p.id, ok: true, price: priceInfo.price });
        } catch (err: any) {
          console.error(`Falha ao coletar ${p.name} (${p.url}):`, err?.message ?? err);
          results.push({ productId: p.id, ok: false, error: String(err?.message ?? err) });
        } finally {
          const elapsed = Date.now() - t0;
          if (i < list.length - 1 && elapsed < MIN_DELAY_MS) {
            await sleep(MIN_DELAY_MS - elapsed);
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      count: results.length,
      tookMs: Date.now() - startedAt,
      results,
    });
  } catch (err) {
    console.error("CRON fetch-prices erro:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
