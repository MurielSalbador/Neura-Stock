"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { Rol } from "@/generated/prisma/enums";

export type AdminState = { error?: string; ok?: boolean };

export async function crearUsuario(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return { error: "Sin permiso" };

  const email    = (formData.get("email")    as string)?.trim().toLowerCase();
  const nombre   = (formData.get("nombre")   as string)?.trim();
  const password = (formData.get("password") as string);
  const rolInput = (formData.get("rol")      as string) || "VENDEDOR";
  let sucursalId = (formData.get("sucursalId") as string) || null;

  if (!email || !nombre || !password) return { error: "Nombre, email y contraseña son requeridos" };
  if (password.length < 6)            return { error: "La contraseña debe tener al menos 6 caracteres" };

  // ENCARGADO: can only create VENDEDOR or ENCARGADO in their own sucursal
  if (admin.rol === "ENCARGADO") {
    if (rolInput === "ADMIN") return { error: "No podés crear administradores globales" };
    sucursalId = admin.sucursalId ?? null;
  }

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return { error: "Ya existe un usuario con ese email" };

  const passwordHash = await bcrypt.hash(password, 10);

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

  revalidatePath("/app/admin");
  return { ok: true };
}

export async function cambiarRol(formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return;

  const usuarioId = formData.get("usuarioId") as string;
  const nuevoRol  = formData.get("rol") as Rol;

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId },
  });
  if (!target) return;
  if (target.id === admin.id) return; // no self-role-change

  // ENCARGADO restrictions
  if (admin.rol === "ENCARGADO") {
    if (nuevoRol === "ADMIN")               return; // can't elevate to global admin
    if (target.rol === "ADMIN")             return; // can't touch existing global admins
    if (target.sucursalId !== admin.sucursalId) return; // only own branch
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { rol: nuevoRol } });
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
    if (target.rol === "ADMIN")             return;
    if (target.sucursalId !== admin.sucursalId) return;
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo: !target.activo },
  });
  revalidatePath("/app/admin");
}
