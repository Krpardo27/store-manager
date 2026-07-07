import type { CartItem } from "./types";
import { formatCurrency } from "./formatters";

type SaleCartTableProps = {
  cart: CartItem[];
  increaseQty: (itemId: string) => void;
  decreaseQty: (itemId: string) => void | Promise<void>;
  removeItem: (itemId: string) => void | Promise<void>;
};

export default function SaleCartTable({
  cart,
  increaseQty,
  decreaseQty,
  removeItem,
}: SaleCartTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-[0.16em] text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Producto</th>
            <th className="px-4 py-3 font-semibold">Precio</th>
            <th className="px-4 py-3 font-semibold">Cantidad</th>
            <th className="px-4 py-3 font-semibold">Subtotal</th>
            <th className="px-4 py-3 font-semibold">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {cart.map((item) => (
            <tr key={item.id} className="text-zinc-700">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{item.name}</p>
                <p className="text-xs text-zinc-500">SKU: {item.sku ?? "-"} · Stock: {item.stock}</p>
              </td>
              <td className="px-4 py-3">{formatCurrency(item.price)}</td>
              <td className="px-4 py-3">
                <div className="inline-flex items-center rounded-lg border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => {
                      void decreaseQty(item.id);
                    }}
                    className="h-8 w-8 text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    -
                  </button>
                  <span className="inline-flex min-w-10 justify-center text-sm font-semibold text-zinc-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => increaseQty(item.id)}
                    className="h-8 w-8 text-zinc-700 transition-colors hover:bg-zinc-100"
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 font-semibold text-zinc-900">
                {formatCurrency(item.price * item.quantity)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    void removeItem(item.id);
                  }}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100"
                >
                  Quitar
                </button>
              </td>
            </tr>
          ))}

          {cart.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                No hay productos en esta venta.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
