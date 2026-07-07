import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { isAuth, isAdmin } = await requireAdmin();

  if (!isAuth) {
    return Response.json(
      { ok: false, message: "Sesion expirada. Inicia sesion nuevamente." },
      { status: 401 },
    );
  }

  if (!isAdmin) {
    return Response.json(
      { ok: false, message: "No tienes permisos para consultar productos." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q") ?? "";
  const query = rawQuery.trim();

  if (!query) {
    return Response.json(
      { ok: false, message: "Debes ingresar un codigo o nombre." },
      { status: 400 },
    );
  }

  const normalizedSku = query.toUpperCase();

  const exactSkuProduct = await prisma.product.findFirst({
    where: {
      sku: {
        equals: normalizedSku,
      },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      quantity: true,
      isActive: true,
    },
  });

  if (exactSkuProduct) {
    if (!exactSkuProduct.isActive) {
      return Response.json(
        { ok: false, message: "El producto esta inactivo." },
        { status: 409 },
      );
    }

    if (exactSkuProduct.quantity <= 0) {
      return Response.json(
        { ok: false, message: "Producto sin stock." },
        { status: 409 },
      );
    }

    return Response.json({
      ok: true,
      product: {
        id: exactSkuProduct.id,
        name: exactSkuProduct.name,
        sku: exactSkuProduct.sku,
        price: exactSkuProduct.price,
        quantity: exactSkuProduct.quantity,
      },
      matchType: "exact_sku",
    });
  }

  const fuzzyProduct = await prisma.product.findFirst({
    where: {
      isActive: true,
      quantity: {
        gt: 0,
      },
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      quantity: true,
    },
  });

  if (!fuzzyProduct) {
    return Response.json(
      { ok: false, message: "No encontramos un producto activo con stock para ese codigo." },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    product: fuzzyProduct,
    matchType: "fuzzy",
  });
}
