import { z } from "zod";

export const ProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(90, { message: "El nombre no puede superar 90 caracteres" }),

  description: z
    .string()
    .trim()
    .max(240, { message: "La descripcion no puede superar 240 caracteres" })
    .optional()
    .or(z.literal("")),

  price: z.coerce
    .number({ message: "Ingresa un precio valido" })
    .int({ message: "El precio debe ser un numero entero" })
    .min(0, { message: "El precio no puede ser negativo" })
    .max(99999999, { message: "El precio es demasiado alto" }),

  quantity: z.coerce
    .number({ message: "Ingresa una cantidad valida" })
    .int({ message: "La cantidad debe ser un numero entero" })
    .min(0, { message: "La cantidad no puede ser negativa" })
    .max(999999, { message: "La cantidad es demasiado alta" }),

  minStock: z.coerce
    .number({ message: "Ingresa un stock minimo valido" })
    .int({ message: "El stock minimo debe ser un numero entero" })
    .min(0, { message: "El stock minimo no puede ser negativo" })
    .max(999999, { message: "El stock minimo es demasiado alto" }),

  sku: z
    .string()
    .trim()
    .max(40, { message: "El SKU no puede superar 40 caracteres" })
    .optional()
    .or(z.literal("")),

  isActive: z.boolean(),
});

export type ProductFormData = z.infer<typeof ProductSchema>;
export type ProductFieldErrors = Partial<Record<keyof ProductFormData, string[]>>;