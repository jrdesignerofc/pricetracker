// app/api/price-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { priceHistoryQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") ?? "";
    const days = searchParams.get("days") ?? undefined;

    const parsed = priceHistoryQuerySchema.safeParse({ productId, days });
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const since = parsed.data.days
      ? new Date(Date.now() - parsed.data.days * 24 * 60 * 60 * 1000)
      : new Date(0);

    const rows = await prisma.priceHistory.findMany({
      where: {
        productId: parsed.data.productId,
        collectedAt: { gte: since },
      },
      orderBy: { collectedAt: "asc" },
      take: 2000,
    });

    // Normaliza payload para o Chart.js no futuro
    const data = rows.map((r) => ({
      collectedAt: r.collectedAt.toISOString(),
      price: Number(r.priceDecimal),
      currency: r.currency,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET /api/price-history erro:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
