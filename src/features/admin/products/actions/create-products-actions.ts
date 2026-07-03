"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

import { ProductSchema, type ProductFieldErrors } from "../schemas/products.schema";

export type ProductActionState = {
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

export async function createProductAction(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { session, isAuth, isAdmin } = await requireAdmin();

  if (!isAuth || !session || !isAdmin) {
    return { status: "error", message: "No tienes permisos para crear productos" };
  }

  const parsed = ProductSchema.safeParse(productFormDataFrom(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos del producto",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const sku = normalizeSku(parsed.data.sku ?? "");

  if (sku) {
    const existingSku = await prisma.product.findUnique({
      where: { sku },
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
    await prisma.product.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        quantity: parsed.data.quantity,
        minStock: parsed.data.minStock,
        sku,
        isActive: parsed.data.isActive,
      },
    });

    revalidatePath("/auth/inventario");

    return { status: "success", message: "Producto creado correctamente" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: "No fue posible crear el producto" };
  }
}