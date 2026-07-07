"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import { formatCurrency } from "../components/formatters";
import type { CartItem, ProductLookupSuccess } from "../components/types";

type UseSaleCartParams = {
  playSaleSuccessSound: (mode: "item" | "checkout") => Promise<void>;
  setMessage: (msg: string | null) => void;
  setError: (err: string | null) => void;
};

export function useSaleCart({ playSaleSuccessSound, setMessage, setError }: UseSaleCartParams) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [isClosing, setIsClosing] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const addProductToCart = (incoming: ProductLookupSuccess["product"]) => {
    setCart((current) => {
      const index = current.findIndex((item) => item.id === incoming.id);

      if (index === -1) {
        return [
          {
            id: incoming.id,
            name: incoming.name,
            sku: incoming.sku,
            price: incoming.price,
            stock: incoming.quantity,
            quantity: 1,
          },
          ...current,
        ];
      }

      const target = current[index];
      if (!target || target.quantity >= target.stock) {
        setError(`No hay mas stock disponible para ${incoming.name}.`);
        return current;
      }

      const next = [...current];
      next[index] = {
        ...target,
        quantity: target.quantity + 1,
      };
      return next;
    });
  };

  const increaseQty = (itemId: string) => {
    setCart((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;

        if (item.quantity >= item.stock) {
          setError(`No hay mas stock disponible para ${item.name}.`);
          return item;
        }

        return { ...item, quantity: item.quantity + 1 };
      }),
    );
  };

  const decreaseQty = async (itemId: string) => {
    const item = cart.find((line) => line.id === itemId);
    if (!item) {
      return;
    }

    if (item.quantity === 1) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Quitar producto",
        text: `"${item.name}" quedara fuera de la venta.`,
        showCancelButton: true,
        confirmButtonText: "Si, quitar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#3f3f46",
        reverseButtons: true,
      });

      if (!confirm.isConfirmed) {
        return;
      }
    }

    setCart((current) =>
      current
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = async (itemId: string) => {
    const item = cart.find((line) => line.id === itemId);
    if (!item) {
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Quitar producto",
      text: `"${item.name}" se quitara del carrito.`,
      showCancelButton: true,
      confirmButtonText: "Si, quitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#3f3f46",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setCart((current) => current.filter((i) => i.id !== itemId));
  };

  const closeSale = async () => {
    if (!cart.length) {
      setError("No hay productos para cerrar la venta.");
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "Confirmar cierre de venta",
      text: `Se descontaran ${totalItems} item(s) del inventario por ${formatCurrency(subtotal)}.`,
      showCancelButton: true,
      confirmButtonText: "Si, cerrar venta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#3f3f46",
      reverseButtons: true,
      allowOutsideClick: false,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setIsClosing(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/dashboard/sales/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.message || "No pudimos cerrar la venta. Verifica stock y permisos.");
        await Swal.fire({
          icon: "error",
          title: "No se pudo cerrar la venta",
          text: data.message || "Verifica stock y permisos.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#dc2626",
        });
        return;
      }

      const total = formatCurrency(subtotal);
      const items = totalItems;
      setCart([]);
      setMessage(`Venta registrada en modo rapido (${items} items, total ${total}, ${paymentMethod}).`);
      void playSaleSuccessSound("checkout");

      await Swal.fire({
        icon: "success",
        title: "Venta cerrada",
        text: `Inventario actualizado correctamente (${items} item(s)).`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch {
      setError("Error inesperado al cerrar la venta.");
      await Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo completar el cierre de venta. Intenta nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsClosing(false);
    }
  };

  return {
    cart,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    totalItems,
    isClosing,
    addProductToCart,
    increaseQty,
    decreaseQty,
    removeItem,
    closeSale,
  };
}
