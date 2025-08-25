// app/product/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/format";

type Props = { params: { id: string } };

export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    // Não usar notFound(); renderizamos mensagem simples para não virar 404 do Next
    return (
      <section className="space-y-4">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Voltar</a>
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <p className="text-neutral-600">ID: {params.id}</p>
      </section>
    );
  }

  const last = await prisma.priceHistory.findFirst({
    where: { productId: product.id },
    orderBy: { collectedAt: "desc" },
  });

  return (
    <section className="space-y-4">
      <a href="/" className="text-sm text-blue-600 hover:underline">← Voltar</a>
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-neutral-700">
        Loja: <strong>{product.store}</strong>{" "}
        {last ? (
          <>
            | Último preço: <strong>{formatBRL(Number(last.priceDecimal))}</strong>{" "}
            <span className="text-neutral-500">
              (coletado em {new Date(last.collectedAt).toLocaleString("pt-BR")})
            </span>
          </>
        ) : (
          <>| Sem histórico ainda</>
        )}
      </p>
      <div className="rounded-xl border bg-white p-4">
        <p className="text-neutral-600">
          Em breve: gráfico (Chart.js) usando <code>/api/price-history?productId={product.id}</code>.
        </p>
      </div>
    </section>
  );
}
