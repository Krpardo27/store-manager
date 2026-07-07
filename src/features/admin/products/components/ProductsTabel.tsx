import Link from "next/link";

import { prisma } from "@/lib/prisma";
import ActivateProductButton from "./ActivateProductButton";
import DeleteProductButton from "./DeleteProductButton";
import Pagination from "./Pagination";

type ProductsTabelProps = {
  query: string;
  currentPage: number;
  itemsPerPage: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProductsTabel({
  query,
  currentPage,
  itemsPerPage,
}: ProductsTabelProps) {
  const exactSku = query.trim().toUpperCase();

  const where = query
    ? {
        OR: [
          { sku: { equals: exactSku } },
          { name: { contains: query, mode: "insensitive" as const } },
          { sku: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const totalItems = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const skip = (safePage - 1) * itemsPerPage;

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: itemsPerPage,
  });

  return (
    <>
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
                    <div className="flex items-center gap-2">
                      <span className={product.isActive ? "text-emerald-700" : "text-zinc-500"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <span
                        className={
                          lowStock
                            ? "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                            : "rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                        }
                      >
                        {lowStock ? "Stock bajo" : "Con stock"}
                      </span>
                    </div>
                  </td>
                  <td className="flex items-center justify-between gap-4 md:table-cell md:px-5 md:py-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">Acciones</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/inventario/${product.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        Editar
                      </Link>
                      {product.isActive ? (
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                          productQuantity={product.quantity}
                        />
                      ) : (
                        <ActivateProductButton
                          productId={product.id}
                          productName={product.name}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {products.length === 0 && (
              <tr className="block md:table-row">
                <td colSpan={6} className="block px-5 py-8 text-center text-sm text-zinc-500 md:table-cell">
                  {query
                    ? `No se encontraron productos para \"${query}\".`
                    : "Aun no hay productos registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-zinc-100 p-5">
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          itemLabel="productos"
        />
      </div>
    </>
  );
}
