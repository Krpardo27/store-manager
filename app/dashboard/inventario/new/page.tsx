import Link from "next/link";

import AddProductForm from "@/features/admin/products/components/AddProductForm";

type NewProductPageProps = {
  searchParams: Promise<{
    sku?: string;
  }>;
};

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const params = await searchParams;
  const initialSku = (params.sku ?? "").trim();

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Inventario
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Nuevo producto</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Ingresa los datos del producto para agregarlo al inventario.
            </p>
          </div>

          <Link
            href="/dashboard/inventario"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Ver productos
          </Link>
        </div>
      </div>

      <AddProductForm initialSku={initialSku} />
    </section>
  );
}