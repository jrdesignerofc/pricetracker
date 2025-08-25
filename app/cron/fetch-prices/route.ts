// app/api/cron/fetch-prices/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeKabumPrice } from "@/lib/scrapers/kabum";

// Respeito básico a limites:
// - delay mínimo entre requisições (por domínio)
// - só KaBuM nesta etapa; Terabyte/Pichau virão depois
const MIN_DELAY_MS = Number(process.env.SCRAPE_MIN_DELAY_MS ?? 12000);

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const results: Array<{ productId: string; ok: boolean; price?: number; error?: string }> = [];

  try {
    const items = await prisma.product.findMany({
      where: { isActive: true, store: "KABUM" },
      orderBy: { createdAt: "asc" },
      take: 20, // limite de segurança
    });

    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const t0 = Date.now();
      try {
        const { price, currency } = await scrapeKabumPrice(p.url);

        // evita duplicar no mesmo timestamp (schema tem unique productId+collectedAt)
        await prisma.priceHistory.create({
          data: {
            productId: p.id,
            priceDecimal: price,
            currency,
            collectedAt: new Date(),
          },
        });

        results.push({ productId: p.id, ok: true, price });

      } catch (err: any) {
        console.error(`Falha ao coletar ${p.name} (${p.url}):`, err?.message ?? err);
        results.push({ productId: p.id, ok: false, error: String(err?.message ?? err) });
      } finally {
        // delay entre requisições p/ respeitar ToS/robots (ajuste via env)
        const elapsed = Date.now() - t0;
        if (i < items.length - 1 && elapsed < MIN_DELAY_MS) {
          await sleep(MIN_DELAY_MS - elapsed);
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
