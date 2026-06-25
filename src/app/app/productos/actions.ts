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

const schemaEditar = z.object({
  id: z.string().min(1),
  sku: z.string().min(1, "Falta el SKU"),
  nombre: z.string().min(2, "Nombre muy corto"),
  codigoBarras: z.string().optional(),
  precioVenta: z.coerce.number().min(0),
  stockMinimo: z.coerce.number().min(0),
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

export type ProductoState = { error?: string; ok?: boolean };

export async function crearProducto(
  _prev: ProductoState,
  formData: FormData,
): Promise<ProductoState> {
  const user = await requireUser();
  if (user.rol === "VENDEDOR") return { error: "Sin permiso para crear productos" };
  const parsed = schema.safeParse({
    sku: formData.get("sku"),
    nombre: formData.get("nombre"),
    codigoBarras: formData.get("codigoBarras") || undefined,
    precioVenta: formData.get("precioVenta") || 0,
    stockMinimo: formData.get("stockMinimo") || 0,
    stockInicial: formData.get("stockInicial") || undefined,
    sucursalId: formData.get("sucursalId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

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
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo crear el producto" };
  }

  revalidatePath("/app/productos");
  revalidatePath("/app/stock");
  return { ok: true };
}

export async function editarProducto(
  _prev: ProductoState,
  formData: FormData,
): Promise<ProductoState> {
  const user = await requireUser();
  if (user.rol === "VENDEDOR") return { error: "Sin permiso para editar productos" };

  const parsed = schemaEditar.safeParse({
    id: formData.get("id"),
    sku: formData.get("sku"),
    nombre: formData.get("nombre"),
    codigoBarras: formData.get("codigoBarras") || undefined,
    precioVenta: formData.get("precioVenta") || 0,
    stockMinimo: formData.get("stockMinimo") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { id, ...data } = parsed.data;

  const prod = await prisma.producto.findFirst({
    where: { id, empresaId: user.empresaId },
  });
  if (!prod) return { error: "Producto no encontrado" };

  try {
    await prisma.producto.update({ where: { id }, data });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo actualizar" };
  }

  revalidatePath("/app/productos");
  revalidatePath("/app/stock");
  revalidatePath("/app");
  return { ok: true };
}
