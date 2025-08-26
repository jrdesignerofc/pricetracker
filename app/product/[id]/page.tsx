// app/product/[id]/page.tsx
export const dynamic = "force-dynamic";

import { prisma } from "../../../lib/prisma";
import { notFound } from "next/navigation";
import PriceChart from "../../../components/PriceChart";

function formatBRL(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function Page({ params }: { params: { id: string } }) {
  // Produto
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound();
  }

  // Histórico (mais antigo -> mais novo)
  const history = await prisma.priceHistory.findMany({
    where: { productId: params.id },
    orderBy: { collectedAt: "asc" },
    take: 200,
  });

  const last = history.at(-1) ?? null;
  const lastPrice = last ? Number(last.priceDecimal) : null;

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          {product.name} — {product.store}
        </h1>
        <p className="text-neutral-700 break-all">{product.url}</p>

        <p className="text-sm text-neutral-600">
          Último preço: <strong>{formatBRL(lastPrice)}</strong>{" "}
          {last?.collectedAt
            ? `(coletado em ${new Date(last.collectedAt).toLocaleString("pt-BR")})`
            : "(sem histórico ainda)"}
        </p>
      </header>

      <section className="rounded-xl border bg-white p-4 space-y-4">
        {history.length === 0 ? (
          <p className="text-neutral-500">
            Ainda não há histórico para este produto. Rode o cron e atualize a
            página:
            <code className="ml-2 text-xs bg-neutral-100 px-1 py-0.5 rounded">
              /api/cron/fetch-prices
            </code>
          </p>
        ) : (
          <>
            {/* Gráfico */}
            <PriceChart
              points={history.map((h) => ({
                t: new Date(h.collectedAt).getTime(),
                v: Number(h.priceDecimal),
              }))}
            />

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Quando</th>
                    <th className="py-2">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b last:border-none">
                      <td className="py-2 pr-4">
                        {new Date(h.collectedAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2">
                        {formatBRL(Number(h.priceDecimal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-neutral-500">
              API: <code>/api/price-history?productId={product.id}</code>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
