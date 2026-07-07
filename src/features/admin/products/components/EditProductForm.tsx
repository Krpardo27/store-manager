"use client";

import { useActionState, useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  updateProductAction,
  type UpdateProductActionState,
} from "../actions/update-product-action";

type EditableProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  minStock: number;
  sku: string | null;
  isActive: boolean;
};

const initialUpdateProductActionState: UpdateProductActionState = {
  status: "idle",
  message: "",
};

function fieldError(state: UpdateProductActionState, field: string) {
  return state.fieldErrors?.[field as keyof NonNullable<UpdateProductActionState["fieldErrors"]>]?.[0];
}

function textValue(formData: FormData, field: string) {
  return formData.get(field)?.toString().trim() ?? "";
}

function numberValue(formData: FormData, field: string) {
  return Number(formData.get(field));
}

function hasChanges(formData: FormData, product: EditableProduct) {
  return (
    textValue(formData, "name") !== product.name ||
    textValue(formData, "description") !== (product.description ?? "") ||
    textValue(formData, "sku").toUpperCase() !== (product.sku ?? "") ||
    numberValue(formData, "price") !== product.price ||
    numberValue(formData, "quantity") !== product.quantity ||
    numberValue(formData, "minStock") !== product.minStock ||
    formData.get("isActive") === "on" !== product.isActive
  );
}

export default function EditProductForm({
  product,
}: {
  product: EditableProduct;
}) {
  const router = useRouter();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();
  const [state, formAction, isActionPending] = useActionState(
    updateProductAction.bind(null, product.id),
    initialUpdateProductActionState,
  );
  const isPending = isActionPending || isTransitionPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    if (!hasChanges(formData, product)) {
      return;
    }

    const result = await Swal.fire({
      title: "Actualizar producto",
      text: "Se guardaran los cambios de este producto.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Guardar cambios",
      cancelButtonText: "Volver",
      confirmButtonColor: "#18181b",
      cancelButtonColor: "#71717a",
    });

    if (!result.isConfirmed) {
      return;
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.status === "success") {
      Swal.fire({
        title: "Producto actualizado",
        text: state.message,
        icon: "success",
        confirmButtonText: "Ver inventario",
        confirmButtonColor: "#18181b",
      }).then(() => {
        router.push("/dashboard/inventario");
      });

      return;
    }

    if (state.status === "error") {
      Swal.fire({
        title: "No se pudo actualizar",
        text: state.message,
        icon: "error",
        confirmButtonText: "Revisar",
        confirmButtonColor: "#18181b",
      });
    }
  }, [router, state.message, state.status]);

  return (
    <form
      onSubmit={handleSubmit}
      onChange={(event) => {
        setHasPendingChanges(hasChanges(new FormData(event.currentTarget), product));
      }}
      noValidate
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Inventario
        </p>
        <h3 className="mt-2 text-xl font-semibold text-zinc-900">Editar producto</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Actualiza precio, stock y disponibilidad del producto seleccionado.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Nombre
          <input
            name="name"
            minLength={2}
            defaultValue={product.name}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "name") && <p className="text-xs text-red-600">{fieldError(state, "name")}</p>}
        </label>

        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          SKU
          <input
            name="sku"
            defaultValue={product.sku ?? ""}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm uppercase text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "sku") && <p className="text-xs text-red-600">{fieldError(state, "sku")}</p>}
        </label>

        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Precio
          <input
            name="price"
            type="number"
            min={0}
            step={100}
            defaultValue={product.price}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "price") && <p className="text-xs text-red-600">{fieldError(state, "price")}</p>}
        </label>

        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Cantidad
          <input
            name="quantity"
            type="number"
            min={0}
            step={1}
            defaultValue={product.quantity}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "quantity") && <p className="text-xs text-red-600">{fieldError(state, "quantity")}</p>}
        </label>

        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Stock minimo
          <input
            name="minStock"
            type="number"
            min={0}
            step={1}
            defaultValue={product.minStock}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "minStock") && <p className="text-xs text-red-600">{fieldError(state, "minStock")}</p>}
        </label>

        <label className="flex items-center gap-2 self-end rounded-xl border border-zinc-200 px-3 py-3 text-sm font-medium text-zinc-700">
          <input name="isActive" type="checkbox" defaultChecked={product.isActive} className="h-4 w-4 accent-zinc-900" />
          Activo
        </label>
      </div>

      <label className="mt-4 block space-y-1.5 text-sm font-medium text-zinc-700">
        Descripcion
        <textarea
          name="description"
          rows={3}
          defaultValue={product.description ?? ""}
          className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
        />
        {fieldError(state, "description") && <p className="text-xs text-red-600">{fieldError(state, "description")}</p>}
      </label>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            state.status === "error"
              ? "text-sm text-red-600"
              : hasPendingChanges
                ? "text-sm text-emerald-700"
                : "text-sm text-zinc-500"
          }
          aria-live="polite"
        >
          {state.message || (!hasPendingChanges ? "Modifica algun campo para guardar cambios." : "")}
        </p>

        <button
          type="submit"
          disabled={isPending || !hasPendingChanges}
          className="inline-flex cursor-pointer h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : hasPendingChanges ? "Guardar cambios" : "Sin cambios"}
        </button>
      </div>
    </form>
  );
}
