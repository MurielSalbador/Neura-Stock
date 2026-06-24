"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { Rol } from "@/generated/prisma/enums";

const ROL_VALIDOS = ["ADMIN", "ENCARGADO", "VENDEDOR"] as const;

export type AdminState = { error?: string; ok?: boolean };

export async function crearUsuario(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return { error: "Sin permiso" };

  const schema = z.object({
    email:    z.string().email("Email inválido").max(254),
    nombre:   z.string().min(2, "Nombre muy corto").max(100),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(128),
    rol:      z.enum(ROL_VALIDOS).default("VENDEDOR"),
    sucursalId: z.string().optional(),
  });

  const parsed = schema.safeParse({
    email:    (formData.get("email") as string)?.trim().toLowerCase(),
    nombre:   (formData.get("nombre") as string)?.trim(),
    password: formData.get("password") as string,
    rol:      (formData.get("rol") as string) || "VENDEDOR",
    sucursalId: (formData.get("sucursalId") as string) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { email, nombre, password, rol: rolInput } = parsed.data;
  let sucursalId = parsed.data.sucursalId ?? null;

  if (admin.rol === "ENCARGADO") {
    if (rolInput !== "VENDEDOR") return { error: "Solo podés crear vendedores" };
    sucursalId = admin.sucursalId ?? null;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.usuario.create({
      data: {
        empresaId: admin.empresaId,
        email,
        nombre,
        passwordHash,
        rol: rolInput as Rol,
        sucursalId: sucursalId || null,
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return { error: "Ya existe un usuario con ese email" };
    return { error: "No se pudo crear el usuario. Intentá de nuevo." };
  }

  revalidatePath("/app/admin");
  return { ok: true };
}

export async function cambiarRol(formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return;

  const usuarioId = formData.get("usuarioId") as string;
  const rolRaw    = formData.get("rol") as string;

  if (!ROL_VALIDOS.includes(rolRaw as Rol)) return;
  const nuevoRol = rolRaw as Rol;

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId },
  });
  if (!target) return;
  if (target.id === admin.id) return;

  if (admin.rol === "ENCARGADO") {
    if (!admin.sucursalId)                       return; // sin sucursal asignada no puede gestionar nadie
    if (nuevoRol === "ADMIN")                    return;
    if (target.rol === "ADMIN")                  return;
    if (target.sucursalId !== admin.sucursalId)  return;
  }

  try {
    await prisma.usuario.update({ where: { id: usuarioId }, data: { rol: nuevoRol } });
  } catch {
    return;
  }
  revalidatePath("/app/admin");
}

export async function alternarUsuario(formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return;

  const usuarioId = formData.get("usuarioId") as string;
  if (usuarioId === admin.id) return;

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId },
  });
  if (!target) return;

  if (admin.rol === "ENCARGADO") {
    if (!admin.sucursalId)                       return;
    if (target.rol === "ADMIN")                  return;
    if (target.sucursalId !== admin.sucursalId)  return;
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: !target.activo },
  });
  revalidatePath("/app/admin");
}

export async function eliminarUsuario(formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN") return;

  const usuarioId = formData.get("usuarioId") as string;
  if (usuarioId === admin.id) return;

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId },
  });
  if (!target) return;

  await prisma.usuario.delete({ where: { id: usuarioId } });
  revalidatePath("/app/admin");
}

export async function limpiarMovimientos(_formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN") return;

  await prisma.$transaction([
    prisma.stock.deleteMany({ where: { empresaId: admin.empresaId } }),
    prisma.movimiento.deleteMany({ where: { empresaId: admin.empresaId } }),
  ]);

  revalidatePath("/app");
  revalidatePath("/app/movimientos");
  revalidatePath("/app/stock");
}

export async function limpiarTodo(_formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN") return;

  await prisma.$transaction(async (tx) => {
    await tx.stock.deleteMany({ where: { empresaId: admin.empresaId } });
    await tx.movimiento.deleteMany({ where: { empresaId: admin.empresaId } });
    // Ventas y Compras primero para que sus items se eliminen por cascade
    // antes de borrar productos (FK Restrict en VentaItem/CompraItem → Producto)
    await tx.venta.deleteMany({ where: { empresaId: admin.empresaId } });
    await tx.compra.deleteMany({ where: { empresaId: admin.empresaId } });
    await tx.producto.deleteMany({ where: { empresaId: admin.empresaId } });
  });

  revalidatePath("/app");
  revalidatePath("/app/productos");
  revalidatePath("/app/movimientos");
  revalidatePath("/app/stock");
}
