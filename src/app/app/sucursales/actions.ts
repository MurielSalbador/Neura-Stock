"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const schema = z.object({
  nombre: z.string().min(2, "Nombre muy corto"),
  tipo: z.enum(["LOCAL", "DEPOSITO"]),
  direccion: z.string().optional(),
});

export type SucursalState = { error?: string; ok?: boolean };

export async function crearSucursal(
  _prev: SucursalState,
  formData: FormData,
): Promise<SucursalState> {
  const user = await requireAdmin();
  const parsed = schema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    direccion: formData.get("direccion") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.sucursal.create({
      data: { ...parsed.data, empresaId: user.empresaId },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo crear la sucursal" };
  }

  revalidatePath("/app/sucursales");
  return { ok: true };
}

export async function alternarSucursal(formData: FormData) {
  const user = await requireAdmin();
  const id = String(formData.get("id"));

  // Garantiza que la sucursal sea de la empresa del usuario (tenant).
  const suc = await prisma.sucursal.findFirst({
    where: { id, empresaId: user.empresaId },
  });
  if (!suc) return;

  await prisma.sucursal.update({
    where: { id: suc.id },
    data: { activo: !suc.activo },
  });
  revalidatePath("/app/sucursales");
}
