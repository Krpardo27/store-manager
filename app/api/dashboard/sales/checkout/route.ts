import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

type CheckoutRequest = {
  paymentMethod?: string;
  items?: CheckoutItem[];
};

export const dynamic = "force-dynamic";

function isValidCheckoutItem(item: CheckoutItem | undefined): item is CheckoutItem {
  if (!item) return false;
  if (!item.productId || typeof item.productId !== "string") return false;
  if (!Number.isInteger(item.quantity) || item.quantity <= 0) return false;
  return true;
}

export async function POST(request: Request) {
  const { isAuth, isAdmin } = await requireAdmin();

  if (!isAuth) {
    return Response.json({ ok: false, message: "Sesion expirada. Inicia sesion nuevamente." }, { status: 401 });
  }

  if (!isAdmin) {
    return Response.json({ ok: false, message: "No tienes permisos para cerrar ventas." }, { status: 403 });
  }

  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return Response.json({ ok: false, message: "Payload invalido." }, { status: 400 });
  }

  const items = body.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ ok: false, message: "No hay items para cerrar la venta." }, { status: 400 });
  }

  const invalid = items.some((item) => !isValidCheckoutItem(item));
  if (invalid) {
    return Response.json({ ok: false, message: "Items invalidos en la venta." }, { status: 400 });
  }

  const mergedByProduct = new Map<string, number>();
  for (const item of items) {
    const current = mergedByProduct.get(item.productId) ?? 0;
    mergedByProduct.set(item.productId, current + item.quantity);
  }

  const mergedItems = Array.from(mergedByProduct.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  try {
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        mergedItems.map(async (line) => {
          const updated = await tx.product.updateMany({
            where: {
              id: line.productId,
              isActive: true,
              quantity: {
                gte: line.quantity,
              },
            },
            data: {
              quantity: {
                decrement: line.quantity,
              },
            },
          });

          if (updated.count === 0) {
            const product = await tx.product.findUnique({
              where: { id: line.productId },
              select: { name: true, quantity: true, isActive: true },
            });

            if (!product) {
              throw new Error("Uno de los productos ya no existe.");
            }

            if (!product.isActive) {
              throw new Error(`El producto ${product.name} esta inactivo.`);
            }

            throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.quantity}.`);
          }
        })
      );
    });

    return Response.json({
      ok: true,
      message: "Venta cerrada y stock actualizado.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos cerrar la venta.";
    return Response.json({ ok: false, message }, { status: 409 });
  }
}
