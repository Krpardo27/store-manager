"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { activateProductAction } from "../actions/activate-product-action";

type ActivateProductButtonProps = {
  productId: string;
  productName: string;
};

export default function ActivateProductButton({
  productId,
  productName,
}: ActivateProductButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isActivating, setIsActivating] = useState(false);

  const disabled = isPending || isActivating;

  async function handleActivate() {
    const result = await Swal.fire({
      title: "Activar producto",
      text: `\"${productName}\" volvera a estar disponible en inventario activo.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Activar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#166534",
      cancelButtonColor: "#71717a",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsActivating(true);

    startTransition(async () => {
      const actionResult = await activateProductAction(productId);
      setIsActivating(false);

      if (actionResult.error) {
        await Swal.fire({
          title: "No se pudo activar",
          text: actionResult.error,
          icon: "error",
          confirmButtonText: "Revisar",
          confirmButtonColor: "#18181b",
        });
        return;
      }

      await Swal.fire({
        title: "Producto activado",
        text: actionResult.message ?? `\"${productName}\" fue activado correctamente.`,
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
      onClick={handleActivate}
      disabled={disabled}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {disabled ? "Activando..." : "Activar"}
    </button>
  );
}
