"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

import { ProductSchema, type ProductFieldErrors } from "../schemas/products.schema";

export type UpdateProductActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: ProductFieldErrors;
};

function productFormDataFrom(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    quantity: formData.get("quantity"),
    minStock: formData.get("minStock"),
    sku: formData.get("sku") ?? "",
    isActive: formData.get("isActive") === "on",
  };
}

function normalizeSku(value: string) {
  return value.trim().toUpperCase() || null;
}

export async function updateProductAction(
  id: string,
  _previousState: UpdateProductActionState,
  formData: FormData,
): Promise<UpdateProductActionState> {
  const { session, isAuth, isAdmin } = await requireAdmin();

  if (!isAuth || !session || !isAdmin) {
    return { status: "error", message: "No tienes permisos para editar productos" };
  }

  const result = ProductSchema.safeParse(productFormDataFrom(formData));

  if (!result.success) {
    return {
      status: "error",
      message: "Revisa los campos del producto",
      fieldErrors: result.error.flatten().fieldErrors,
    };
  }

  const sku = normalizeSku(result.data.sku ?? "");

  if (sku) {
    const existingSku = await prisma.product.findFirst({
      where: {
        sku,
        NOT: { id },
      },
      select: { id: true },
    });

    if (existingSku) {
      return {
        status: "error",
        message: "Ya existe un producto con ese SKU",
        fieldErrors: { sku: ["Usa un SKU diferente"] },
      };
    }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: result.data.name,
        description: result.data.description || null,
        price: result.data.price,
        quantity: result.data.quantity,
        minStock: result.data.minStock,
        sku,
        isActive: result.data.isActive,
      },
    });

    revalidatePath("/dashboard/inventario");
    revalidatePath(`/dashboard/inventario/${id}`);

    return { status: "success", message: "Producto actualizado correctamente" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: "No fue posible actualizar el producto" };
  }
}
