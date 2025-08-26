// app/product/[id]/page.tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PriceChart from "@/components/PriceChart";

/**
 * Lê o preço independente do nome do campo no banco.
 * Em alguns ambientes o campo está como `price`, em outros como `priceDecimal` (Decimal).
 */
const getPrice = (h: any) => (h?.price ?? h?.priceDecimal);

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  // Produto
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) notFound();

  // Histórico (mais antigo -> mais novo)
  const history = await prisma.priceHistory.findMany({
    where: { productId: params.id },
    orderBy: { collectedAt: "asc" },
    take: 200,
  });

  // Último preço (como number) — lida com Decimal via Number()
  const lastRaw = history.at(-1);
  const lastPrice =
    lastRaw != null ? Number(getPrice(lastRaw)) : null;

  // Pontos para o gráfico (timestamp em ms + valor numérico)
  const points = history.map((h) => ({
    t: new Date(h.collectedAt).getTime(),
    v: Number(getPrice(h)),
  }));

  const dateFrom = history[0]?.collectedAt ?? new Date();
  const dateTo = history.at(-1)?.collectedAt ?? new Date();

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          {product.name} — {product.store}
        </h1>

        <a
          href={product.url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {product.url}
        </a>

        <p className="text-sm text-neutral-600">
          Último preço:{" "}
          <strong>
            {lastPrice != null && Number.isFinite(lastPrice)
              ? lastPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "—"}
          </strong>{" "}
          {lastRaw && (
            <span className="text-neutral-500">
              (coletado em{" "}
              {new Date(lastRaw.collectedAt).toLocaleString("pt-BR")}
              )
            </span>
          )}
        </p>
      </header>

      <section className="rounded-xl border bg-white p-4">
        {/* Gráfico (client component) */}
        <PriceChart points={points} dateFrom={dateFrom} dateTo={dateTo} />
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <p className="text-sm text-neutral-600">
          Histórico coletado pelo cron. Total: {history.length}
        </p>

        {history.length === 0 ? (
          <p className="text-neutral-500">
            Ainda não há histórico. Rode o cron novamente e atualize.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[520px] text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Quando</th>
                  <th className="py-2">Preço</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const v = Number(getPrice(h));
                  return (
                    <tr key={h.id} className="border-b last:border-none">
                      <td className="py-2 pr-4">
                        {new Date(h.collectedAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2">
                        {Number.isFinite(v)
                          ? v.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-neutral-500">
          API:{" "}
          <code>/api/price-history?productId={product.id}</code>
        </p>
      </section>
    </main>
  );
}
