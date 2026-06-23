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

export async function crearSucursal(formData: FormData) {
  const user = await requireAdmin();
  const parsed = schema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    direccion: formData.get("direccion") || undefined,
  });
  if (!parsed.success) return;

  await prisma.sucursal.create({
    data: { ...parsed.data, empresaId: user.empresaId },
  });
  revalidatePath("/app/sucursales");
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
