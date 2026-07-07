"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export type ActivateProductActionResult = {
  success?: true;
  message?: string;
  error?: string;
};

export async function activateProductAction(
  productId: string,
): Promise<ActivateProductActionResult> {
  const { session, isAuth, isAdmin } = await requireAdmin();

  if (!isAuth || !session || !isAdmin) {
    return { error: "No tienes permisos para activar productos" };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      return { error: "Producto no encontrado" };
    }

    if (!product.isActive) {
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: true },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventario");
    revalidatePath(`/dashboard/inventario/${productId}`);

    return {
      success: true,
      message: "Producto activado correctamente.",
    };
  } catch (error) {
    console.error(error);
    return { error: "No fue posible activar el producto" };
  }
}
