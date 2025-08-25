// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StoreEnum = z.enum(["KABUM", "TERABYTE", "PICHAU"]);

const createProductSchema = z.object({
  name: z.string().min(2),
  store: StoreEnum,
  url: z.string().url().min(10),
  sku: z.string().min(1).max(64).optional(),
  isActive: z.boolean().optional().default(true),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, data: products });
  } catch (err) {
    console.error("GET /api/products erro:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
    }

    const parsed = createProductSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, store, url, sku, isActive } = parsed.data;

    const created = await prisma.product.upsert({
      where: { url },
      update: { name, store, sku, isActive },
      create: { name, store, url, sku, isActive },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/products erro:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
