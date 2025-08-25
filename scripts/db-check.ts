// scripts/db-check.ts
import { prisma } from "../lib/prisma";

async function run() {
  try {
    const products = await prisma.product.findMany({
      include: { priceHistory: true },
      take: 10,
    });

    console.log("Conectado ao Postgres. Produtos encontrados:", products.length);
    for (const p of products) {
      console.log(`- ${p.name} (${p.store}) — histórico: ${p.priceHistory.length} registros`);
    }
  } catch (err) {
    console.error("Falha ao consultar o banco:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
