export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PriceChart from "./PriceChart";

type PageProps = { params: { id: string } };

export default async function Page({ params }: PageProps) {
  // Produto
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) notFound();

  // Histórico (mais antigo -> mais novo)
  const history = await prisma.priceHistory.findMany({
    where: { productId: params.id },
    orderBy: { collectedAt: "asc" },
    take: 500,
  });

  // Prepara dados do gráfico
  const chartLabels = history.map((h) =>
    new Date(h.collectedAt).toLocaleString("pt-BR")
  );
  const chartValues = history.map((h) => Number(h.price));

  // Último preço (se existir)
  const last = history.at(-1);

  return (
    <main className="space-y-6">
      <div className="text-sm">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Voltar
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          {product.name} — {product.store}
        </h1>
        {last ? (
          <p className="text-neutral-700">
            Último preço:{" "}
            <strong>
              {last.price.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>{" "}
            <span className="text-neutral-500">
              (coletado em{" "}
              {new Date(last.collectedAt).toLocaleString("pt-BR")})
            </span>
          </p>
        ) : (
          <p className="text-neutral-500">Ainda sem histórico para este item.</p>
        )}
        <p className="text-neutral-700 break-all">
          URL:{" "}
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            {product.url}
          </a>
        </p>
      </header>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">Histórico de preço</h2>

        {history.length === 0 ? (
          <p className="text-neutral-500">
            Nada para exibir ainda. Rode o cron e atualize esta página.
          </p>
        ) : (
          <PriceChart
            labels={chartLabels}
            values={chartValues}
            currency="BRL"
          />
        )}

        <p className="text-xs text-neutral-500 mt-3">
          API:{" "}
          <code className="bg-neutral-100 px-1 py-0.5 rounded">
            /api/price-history?productId={product.id}
          </code>
        </p>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold">Tabela (detalhe)</h3>

        {history.length === 0 ? (
          <p className="text-neutral-500">Sem registros.</p>
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
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-none">
                    <td className="py-2 pr-4">
                      {new Date(h.collectedAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2">
                      {h.price.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
