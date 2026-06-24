"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { registrarMovimiento } from "@/lib/stock";

const schema = z.object({
  sku: z.string().min(1, "Falta el SKU"),
  nombre: z.string().min(2, "Nombre muy corto"),
  codigoBarras: z.string().optional(),
  precioVenta: z.coerce.number().min(0),
  stockMinimo: z.coerce.number().min(0),
  stockInicial: z.coerce.number().min(0).optional(),
  sucursalId: z.string().optional(),
});

export async function eliminarProducto(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.rol !== "ADMIN") return;

  const id = formData.get("id") as string;
  if (!id) return;

  const prod = await prisma.producto.findFirst({
    where: { id, empresaId: user.empresaId },
  });
  if (!prod) return;

  await prisma.$transaction(async (tx) => {
    await tx.ventaItem.deleteMany({ where: { productoId: id } });
    await tx.compraItem.deleteMany({ where: { productoId: id } });
    await tx.movimiento.deleteMany({ where: { productoId: id } });
    await tx.stock.deleteMany({ where: { productoId: id } });
    await tx.producto.delete({ where: { id } });
  });

  revalidatePath("/app/productos");
  revalidatePath("/app/stock");
  revalidatePath("/app");
}

export async function crearProducto(formData: FormData) {
  const user = await requireUser();
  const parsed = schema.safeParse({
    sku: formData.get("sku"),
    nombre: formData.get("nombre"),
    codigoBarras: formData.get("codigoBarras") || undefined,
    precioVenta: formData.get("precioVenta") || 0,
    stockMinimo: formData.get("stockMinimo") || 0,
    stockInicial: formData.get("stockInicial") || 0,
    sucursalId: formData.get("sucursalId") || undefined,
  });
  if (!parsed.success) return;

  const { stockInicial, sucursalId, ...productoData } = parsed.data;

  try {
    const producto = await prisma.producto.create({
      data: { ...productoData, empresaId: user.empresaId },
    });

    if (stockInicial && stockInicial > 0 && sucursalId) {
      await registrarMovimiento({
        empresaId: user.empresaId,
        productoId: producto.id,
        tipo: "ENTRADA",
        cantidad: stockInicial,
        sucursalDestinoId: sucursalId,
        motivo: "Stock inicial",
        usuarioId: user.id,
      });
    }
  } catch {
    return;
  }

  revalidatePath("/app/productos");
  revalidatePath("/app/stock");
}
