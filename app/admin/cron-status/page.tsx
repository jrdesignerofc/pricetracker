// app/admin/cron-status/page.tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function Page() {
  const rows = await prisma.priceHistory.findMany({
    orderBy: { collectedAt: "desc" },
    take: 50,
    include: {
      product: {
        select: { id: true, name: true, store: true, url: true },
      },
    },
  });

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Status das Coletas (últimas 50)</h1>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Quando</th>
              <th className="py-2 pr-4">Produto</th>
              <th className="py-2 pr-4">Loja</th>
              <th className="py-2 pr-4">Preço</th>
              <th className="py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-none">
                <td className="py-2 pr-4">
                  {new Date(r.collectedAt).toLocaleString("pt-BR")}
                </td>
                <td className="py-2 pr-4">
                  <a
                    href={`/product/${r.productId}`}
                    className="underline text-blue-600"
                  >
                    {r.product?.name ?? r.productId}
                  </a>
                </td>
                <td className="py-2 pr-4">{r.product?.store}</td>
                <td className="py-2 pr-4">
                  {Number(r.priceDecimal).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: r.currency || "BRL",
                  })}
                </td>
                <td className="py-2">
                  <a
                    href={r.product?.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-blue-600 break-all"
                  >
                    {r.product?.url ?? "—"}
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-neutral-500">
                  Sem dados ainda. Rode o cron manualmente:{" "}
                  <code className="bg-neutral-100 px-1 py-0.5 rounded">
                    /api/cron/fetch-prices
                  </code>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">
        Dica: ajuste a frequência no <code>vercel.json</code> ou no painel da Vercel
        (Project &rarr; Settings &rarr; Cron Jobs).
      </p>
    </main>
  );
}
