"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export type DeleteProductActionResult = {
  success?: true;
  mode?: "deleted" | "deactivated";
  message?: string;
  error?: string;
};

export async function deleteProductAction(
  productId: string,
): Promise<DeleteProductActionResult> {
  const { session, isAuth, isAdmin } = await requireAdmin();

  if (!isAuth || !session || !isAdmin) {
    return { error: "No tienes permisos para eliminar productos" };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, quantity: true, isActive: true },
    });

    if (!product) {
      return { error: "Producto no encontrado" };
    }

    if (product.quantity > 0) {
      if (product.isActive) {
        await prisma.product.update({
          where: { id: productId },
          data: { isActive: false },
        });
      }

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/inventario");
      revalidatePath(`/dashboard/inventario/${productId}`);

      return {
        success: true,
        mode: "deactivated",
        message: "El producto tiene stock y fue marcado como inactivo.",
      };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventario");

    return {
      success: true,
      mode: "deleted",
      message: "Producto eliminado correctamente.",
    };
  } catch (error) {
    console.error(error);
    return { error: "No fue posible eliminar el producto" };
  }
}
