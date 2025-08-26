// app/api/price-history/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";            // <= relativo
import { priceHistoryQuerySchema } from "../../../lib/validation"; // <= relativo

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * GET /api/price-history?productId=...&days=30
 * Retorna histórico do produto (mais antigo -> mais novo)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const daysParam = url.searchParams.get("days");

    // validação com zod (schema do projeto)
    const parsed = priceHistoryQuerySchema.safeParse({
      productId,
      days: daysParam ? Number(daysParam) : undefined,
    });
    if (!parsed.success) {
      return json({ ok: false, error: "invalid-query", details: parsed.error.flatten() }, 400);
    }
    const { days } = parsed.data;

    const where: any = { productId: productId! };
    if (days && Number.isFinite(days) && days > 0) {
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      where.collectedAt = { gte: from };
    }

    const rows = await prisma.priceHistory.findMany({
      where,
      orderBy: { collectedAt: "asc" },
      take: 200,
    });

    // normaliza para o cliente
    const points = rows.map((r) => ({
      t: new Date(r.collectedAt).getTime(),
      v: Number(r.priceDecimal),
      currency: r.currency || "BRL",
      id: r.id,
    }));

    return json({ ok: true, productId, count: points.length, points }, 200);
  } catch (err: any) {
    console.error("price-history GET failed:", err);
    return json({ ok: false, error: String(err?.message ?? err) }, 500);
  }
}
