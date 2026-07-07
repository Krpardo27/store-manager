"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { deleteProductAction } from "../actions/delete-product-action";

type DeleteProductButtonProps = {
  productId: string;
  productName: string;
  productQuantity: number;
};

export default function DeleteProductButton({
  productId,
  productName,
  productQuantity,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const disabled = isPending || isDeleting;

  async function handleDelete() {
    const hasStock = productQuantity > 0;

    const result = await Swal.fire({
      title: hasStock ? "Desactivar producto" : "Eliminar producto",
      text: hasStock
        ? `\"${productName}\" tiene stock disponible. Se marcara como inactivo para evitar ventas nuevas.`
        : `Se eliminara \"${productName}\" del inventario. Esta accion no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: hasStock ? "Desactivar" : "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#71717a",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsDeleting(true);

    startTransition(async () => {
      const actionResult = await deleteProductAction(productId);
      setIsDeleting(false);

      if (actionResult.error) {
        await Swal.fire({
          title: "No se pudo eliminar",
          text: actionResult.error,
          icon: "error",
          confirmButtonText: "Revisar",
          confirmButtonColor: "#18181b",
        });
        return;
      }

      await Swal.fire({
        title:
          actionResult.mode === "deactivated"
            ? "Producto desactivado"
            : "Producto eliminado",
        text:
          actionResult.message ??
          (actionResult.mode === "deactivated"
            ? `\"${productName}\" fue desactivado porque tiene stock.`
            : `\"${productName}\" fue eliminado correctamente.`),
        icon: "success",
        confirmButtonText: "Continuar",
        confirmButtonColor: "#18181b",
      });

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={disabled}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {disabled ? "Procesando..." : "Eliminar"}
    </button>
  );
}
