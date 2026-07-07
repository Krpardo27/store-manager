import { formatCurrency } from "./formatters";

type SaleSummaryProps = {
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  totalItems: number;
  subtotal: number;
  isClosing: boolean;
  canClose: boolean;
  onCloseSale: () => void;
};

export default function SaleSummary({
  paymentMethod,
  onPaymentMethodChange,
  totalItems,
  subtotal,
  isClosing,
  canClose,
  onCloseSale,
}: SaleSummaryProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pago</span>
          <select
            value={paymentMethod}
            onChange={(event) => onPaymentMethodChange(event.target.value)}
            className="h-10 min-w-48 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          >
            <option value="efectivo">Efectivo</option>
            <option value="debito">Debito</option>
            <option value="credito">Credito</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
      </div>

      <div className="space-y-1 text-right">
        <p className="text-xs text-zinc-500">Items: {totalItems}</p>
        <p className="text-lg font-semibold text-zinc-900">Total: {formatCurrency(subtotal)}</p>
        <button
          type="button"
          onClick={onCloseSale}
          disabled={isClosing || !canClose}
          className="mt-2 inline-flex h-11 min-w-44 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-opacity hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClosing ? "Guardando..." : "Cerrar venta"}
        </button>
      </div>
    </div>
  );
}
