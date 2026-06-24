"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { registrarMovimiento } from "@/lib/stock";

export async function eliminarMovimiento(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.rol !== "ADMIN") return;

  const id = formData.get("id") as string;
  if (!id) return;

  await prisma.$transaction(async (tx) => {
    const mov = await tx.movimiento.findFirst({
      where: { id, empresaId: user.empresaId },
    });
    if (!mov) return;

    const revertir = async (sucursalId: string, delta: number) => {
      await tx.stock.upsert({
        where: { productoId_sucursalId: { productoId: mov.productoId, sucursalId } },
        create: { empresaId: user.empresaId, productoId: mov.productoId, sucursalId, cantidad: delta },
        update: { cantidad: { increment: delta } },
      });
    };

    const cant = Number(mov.cantidad);
    switch (mov.tipo) {
      case "ENTRADA":
        if (mov.sucursalDestinoId) await revertir(mov.sucursalDestinoId, -cant);
        break;
      case "SALIDA":
        if (mov.sucursalOrigenId) await revertir(mov.sucursalOrigenId, cant);
        break;
      case "TRANSFERENCIA":
        if (mov.sucursalOrigenId) await revertir(mov.sucursalOrigenId, cant);
        if (mov.sucursalDestinoId) await revertir(mov.sucursalDestinoId, -cant);
        break;
      case "AJUSTE":
        // cantidad siempre positiva en DB; revertimos como fue aplicado (positivo)
        if (mov.sucursalOrigenId) await revertir(mov.sucursalOrigenId, -cant);
        break;
    }

    await tx.movimiento.delete({ where: { id } });
  });

  revalidatePath("/app/movimientos");
  revalidatePath("/app/stock");
  revalidatePath("/app");
}

const schema = z.object({
  productoId: z.string().min(1),
  tipo: z.enum(["ENTRADA", "SALIDA", "TRANSFERENCIA", "AJUSTE"]),
  cantidad: z.coerce.number().refine((n) => n !== 0, "Cantidad inválida"),
  sucursalOrigenId: z.string().optional(),
  sucursalDestinoId: z.string().optional(),
  motivo: z.string().optional(),
});

export type MovState = { error?: string; ok?: boolean };

export async function nuevoMovimiento(
  _prev: MovState,
  formData: FormData,
): Promise<MovState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = parsed.data;

  // Verifica que producto y sucursales pertenezcan a la empresa (tenant).
  const prod = await prisma.producto.findFirst({
    where: { id: d.productoId, empresaId: user.empresaId },
  });
  if (!prod) return { error: "Producto inválido" };

  try {
    await registrarMovimiento({
      empresaId: user.empresaId,
      productoId: d.productoId,
      tipo: d.tipo,
      cantidad: d.cantidad,
      sucursalOrigenId: d.sucursalOrigenId || null,
      sucursalDestinoId: d.sucursalDestinoId || null,
      motivo: d.motivo || null,
      usuarioId: user.id,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar" };
  }

  revalidatePath("/app/movimientos");
  revalidatePath("/app/stock");
  revalidatePath("/app");
  return { ok: true };
}
