"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { registrarMovimiento } from "@/lib/stock";

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
