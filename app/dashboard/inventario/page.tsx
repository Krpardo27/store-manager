import { Suspense } from "react";
import Link from "next/link";
import ProductSearch from "@/features/admin/products/components/ProductSearch";
import ProductsTabel from "@/features/admin/products/components/ProductsTabel";

type InventarioPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

function ProductsTableLoader() {
  return (
    <div className="p-5">
      <div className="overflow-hidden rounded-xl border border-zinc-100">
        <div className="hidden grid-cols-6 gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3 md:grid">
          <span className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
          <span className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <span className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <span className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <span className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <span className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
        </div>

        <div className="divide-y divide-zinc-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-3 px-5 py-4 md:grid-cols-6 md:items-center"
            >
              <span className="h-4 w-40 animate-pulse rounded bg-zinc-200" />
              <span className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
              <span className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
              <span className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
              <span className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
              <span className="h-8 w-24 animate-pulse rounded-lg bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
        <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" />
        Cargando productos...
      </div>
    </div>
  );
}

export default async function InventarioPage({ searchParams }: InventarioPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const parsedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const itemsPerPage = 10;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">MVP Comercial</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Inventario</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Controla stock, alertas de reposicion y disponibilidad de productos clave.
            </p>
          </div>

          <Link
            href="/dashboard/inventario/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            Nuevo producto
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-5">
          <h3 className="text-lg font-semibold text-zinc-900">Productos registrados</h3>
          <p className="mt-1 text-sm text-zinc-600">Listado rapido del inventario actual.</p>
          <div className="mt-4">
            <Suspense>
              <ProductSearch
                autoFocus
                showScannerHint
                enableCameraScan
                placeholder="Escanea o escribe nombre, SKU o codigo..."
              />
            </Suspense>
          </div>
        </div>

        <Suspense key={`${query}-${currentPage}`} fallback={<ProductsTableLoader />}>
          <ProductsTabel
            query={query}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
        </Suspense>
      </div>
    </section>
  );
}
