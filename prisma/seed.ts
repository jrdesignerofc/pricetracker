// prisma/seed.ts
import { Prisma, Store } from "@prisma/client";
import { prisma } from "../lib/prisma";

const toDecimal = (n: number) => new Prisma.Decimal(n.toFixed(2));

async function main() {
  const kabum = await prisma.product.upsert({
    where: { url: "https://www.kabum.com.br/produto/0001" },
    update: {},
    create: {
      name: "Placa de Vídeo XYZ",
      store: Store.KABUM,
      url: "https://www.kabum.com.br/produto/0001", // TODO: substituir por URL real
      sku: "XYZ-0001",
      isActive: true,
    },
  });

  const pichau = await prisma.product.upsert({
    where: { url: "https://www.pichau.com.br/produto/0002" },
    update: {},
    create: {
      name: "SSD 1TB ABC",
      store: Store.PICHAU,
      url: "https://www.pichau.com.br/produto/0002", // TODO: substituir por URL real
      sku: "ABC-0002",
      isActive: true,
    },
  });

  await prisma.priceHistory.createMany({
    data: [
      {
        productId: kabum.id,
        priceDecimal: toDecimal(1899.9),
        currency: "BRL",
        collectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      },
      {
        productId: kabum.id,
        priceDecimal: toDecimal(1850.0),
        currency: "BRL",
        collectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      {
        productId: pichau.id,
        priceDecimal: toDecimal(399.9),
        currency: "BRL",
        collectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      },
      {
        productId: pichau.id,
        priceDecimal: toDecimal(389.9),
        currency: "BRL",
        collectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed concluído ✅");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
