"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const schema = z.object({
  sku: z.string().min(1, "Falta el SKU"),
  nombre: z.string().min(2, "Nombre muy corto"),
  codigoBarras: z.string().optional(),
  precioVenta: z.coerce.number().min(0),
  stockMinimo: z.coerce.number().min(0),
});

export async function crearProducto(formData: FormData) {
  const user = await requireUser();
  const parsed = schema.safeParse({
    sku: formData.get("sku"),
    nombre: formData.get("nombre"),
    codigoBarras: formData.get("codigoBarras") || undefined,
    precioVenta: formData.get("precioVenta") || 0,
    stockMinimo: formData.get("stockMinimo") || 0,
  });
  if (!parsed.success) return;

  await prisma.producto.create({
    data: { ...parsed.data, empresaId: user.empresaId },
  });
  revalidatePath("/app/productos");
}
