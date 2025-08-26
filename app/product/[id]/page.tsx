export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound();
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">
        {product.name} - {product.store}
      </h1>
      <p className="text-neutral-700 break-all">{product.url}</p>

      <div className="rounded-xl border bg-white p-4">
        <p>Gráfico e histórico (Chart.js) vão aqui depois.</p>
      </div>
    </main>
  );
}
