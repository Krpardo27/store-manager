import { prisma } from "@/lib/prisma";
import Link from "next/link";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function InventarioPage() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
  });

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
        </div>

        <div className="overflow-hidden md:overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="hidden bg-zinc-50 text-xs uppercase tracking-[0.16em] text-zinc-500 md:table-header-group">
              <tr>
                <th className="px-5 py-3 font-semibold">Producto</th>
                <th className="px-5 py-3 font-semibold">SKU</th>
                <th className="px-5 py-3 font-semibold">Precio</th>
                <th className="px-5 py-3 font-semibold">Cantidad</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-zinc-100 md:table-row-group">
              {products.map((product) => {
                const lowStock = product.quantity <= product.minStock;

                return (
                  <tr
                    key={product.id}
                    className="grid gap-3 px-5 py-4 text-zinc-700 md:table-row md:px-0 md:py-0"
                  >
                    <td className="md:px-5 md:py-4">
                      <p className="font-medium text-zinc-900">{product.name}</p>
                      {product.description && <p className="mt-1 text-xs text-zinc-500">{product.description}</p>}
                    </td>
                    <td className="flex items-center justify-between gap-4 md:table-cell md:px-5 md:py-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">SKU</span>
                      <span>{product.sku ?? "-"}</span>
                    </td>
                    <td className="flex items-center justify-between gap-4 md:table-cell md:px-5 md:py-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Precio</span>
                      <span>{formatCurrency(product.price)}</span>
                    </td>
                    <td className="flex items-center justify-between gap-4 md:table-cell md:px-5 md:py-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Cantidad</span>
                      <span className={lowStock ? "font-semibold text-amber-700" : "text-zinc-700"}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="flex items-center justify-between gap-4 md:table-cell md:px-5 md:py-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Estado</span>
                      <span className={product.isActive ? "text-emerald-700" : "text-zinc-500"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="flex items-center justify-between gap-4 md:table-cell md:px-5 md:py-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Acciones</span>
                      <Link
                        href={`/dashboard/inventario/${product.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr className="block md:table-row">
                  <td colSpan={6} className="block px-5 py-8 text-center text-sm text-zinc-500 md:table-cell">
                    Aun no hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
