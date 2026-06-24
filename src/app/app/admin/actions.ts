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

  const sucursalIdsForm = formData.getAll("sucursalIds") as string[];

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
  let extraBranches: string[] = [];

  if (admin.rol === "ENCARGADO") {
    if (rolInput !== "VENDEDOR") return { error: "Solo podés crear vendedores" };
    const misIds = admin.sucursalesIds;
    if (sucursalIdsForm.length > 0) {
      if (sucursalIdsForm.some((sid) => !misIds.includes(sid))) return { error: "Sucursal no válida" };
      sucursalId = sucursalIdsForm[0];
      extraBranches = sucursalIdsForm;
    } else if (misIds.length <= 1) {
      sucursalId = admin.sucursalId ?? null;
    } else if (sucursalId && !misIds.includes(sucursalId)) {
      return { error: "Sucursal no válida" };
    }
  } else if (sucursalIdsForm.length > 0 && rolInput === "VENDEDOR") {
    sucursalId = sucursalIdsForm[0];
    extraBranches = sucursalIdsForm;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.usuario.create({
        data: {
          empresaId: admin.empresaId,
          email,
          nombre,
          passwordHash,
          rol: rolInput as Rol,
          sucursalId: sucursalId || null,
        },
      });
      if (extraBranches.length > 1) {
        await tx.sucursalEncargado.createMany({
          data: extraBranches.map((sid) => ({ usuarioId: newUser.id, sucursalId: sid })),
          skipDuplicates: true,
        });
      }
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
    if (nuevoRol === "ADMIN")    return;
    if (target.rol !== "VENDEDOR") return;
    if (!target.sucursalId || !admin.sucursalesIds.includes(target.sucursalId)) return;
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
    if (target.rol !== "VENDEDOR") return;
    if (!target.sucursalId || !admin.sucursalesIds.includes(target.sucursalId)) return;
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

export async function asignarSucursalesEncargado(formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN") return;

  const usuarioId = formData.get("usuarioId") as string;
  const sucursalIds = formData.getAll("sucursalIds") as string[];

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId, rol: "ENCARGADO" },
  });
  if (!target) return;

  await prisma.$transaction([
    prisma.sucursalEncargado.deleteMany({ where: { usuarioId } }),
    ...(sucursalIds.length > 0
      ? [prisma.sucursalEncargado.createMany({
          data: sucursalIds.map((sid) => ({ usuarioId, sucursalId: sid })),
          skipDuplicates: true,
        })]
      : []),
  ]);

  revalidatePath("/app/admin");
}

export async function asignarSucursalesVendedor(formData: FormData): Promise<void> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return;

  const usuarioId = formData.get("usuarioId") as string;
  const sucursalIds = formData.getAll("sucursalIds") as string[];

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId, rol: "VENDEDOR" },
  });
  if (!target) return;

  if (admin.rol === "ENCARGADO") {
    if (!target.sucursalId || !admin.sucursalesIds.includes(target.sucursalId)) return;
    if (sucursalIds.some((sid) => !admin.sucursalesIds.includes(sid))) return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.sucursalEncargado.deleteMany({ where: { usuarioId } });
    if (sucursalIds.length > 0) {
      await tx.sucursalEncargado.createMany({
        data: sucursalIds.map((sid) => ({ usuarioId, sucursalId: sid })),
        skipDuplicates: true,
      });
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { sucursalId: sucursalIds[0] },
      });
    }
  });

  revalidatePath("/app/admin");
}

export async function editarUsuario(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return { error: "Sin permiso" };

  const usuarioId = formData.get("usuarioId") as string;
  const nombre    = (formData.get("nombre") as string)?.trim();
  const email     = (formData.get("email") as string)?.trim().toLowerCase();
  const password  = (formData.get("password") as string) || "";
  const sucursalId  = (formData.get("sucursalId") as string) || null;
  const sucursalIds = formData.getAll("sucursalIds") as string[];

  if (!nombre || nombre.length < 2) return { error: "Nombre muy corto" };
  if (!email || !email.includes("@")) return { error: "Email inválido" };
  if (password && password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres" };

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId },
  });
  if (!target) return { error: "Usuario no encontrado" };
  if (target.id === admin.id) return { error: "No podés editarte desde esta sección" };

  if (admin.rol === "ENCARGADO") {
    if (target.rol !== "VENDEDOR") return { error: "Sin permiso" };
    if (!target.sucursalId || !admin.sucursalesIds.includes(target.sucursalId))
      return { error: "Sin permiso" };
    if (sucursalIds.some((sid) => !admin.sucursalesIds.includes(sid)))
      return { error: "Sucursal no válida" };
  }

  const updateData: Record<string, unknown> = { nombre, email };
  if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      if (target.rol === "VENDEDOR" || target.rol === "ENCARGADO") {
        // Multi-branch via SucursalEncargado
        if (sucursalIds.length > 0) updateData.sucursalId = sucursalIds[0];
        await tx.usuario.update({ where: { id: usuarioId }, data: updateData });
        await tx.sucursalEncargado.deleteMany({ where: { usuarioId } });
        if (sucursalIds.length > 1) {
          await tx.sucursalEncargado.createMany({
            data: sucursalIds.map((sid) => ({ usuarioId, sucursalId: sid })),
            skipDuplicates: true,
          });
        }
      } else {
        if (admin.rol === "ADMIN") updateData.sucursalId = sucursalId || null;
        await tx.usuario.update({ where: { id: usuarioId }, data: updateData });
      }
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return { error: "Ya existe un usuario con ese email" };
    return { error: "No se pudo guardar. Intentá de nuevo." };
  }

  revalidatePath("/app/admin");
  return { ok: true };
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
