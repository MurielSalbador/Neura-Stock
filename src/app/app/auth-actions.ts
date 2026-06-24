"use server";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function loginComoEmpleadoAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") return { error: "Sin permiso" };

  const usuarioId = formData.get("usuarioId") as string;
  const password  = (formData.get("password") as string) || "";

  if (!password) return { error: "Ingresá la contraseña" };

  const target = await prisma.usuario.findFirst({
    where: { id: usuarioId, empresaId: admin.empresaId, activo: true },
    select: { id: true, email: true, passwordHash: true, rol: true, sucursalId: true },
  });
  if (!target)               return { error: "Usuario no encontrado" };
  if (target.rol === "ADMIN") return { error: "Sin permiso" };
  if (target.id === admin.id) return { error: "Ya estás usando esta cuenta" };

  if (admin.rol === "ENCARGADO") {
    if (target.rol !== "VENDEDOR") return { error: "Sin permiso" };
    if (!target.sucursalId || !admin.sucursalesIds.includes(target.sucursalId))
      return { error: "Sin permiso" };
  }

  if (!target.passwordHash) return { error: "Este usuario no tiene contraseña configurada" };
  const ok = await bcrypt.compare(password, target.passwordHash);
  if (!ok) return { error: "Contraseña incorrecta" };

  await signIn("credentials", { email: target.email, password, redirectTo: "/app" });
  return {};
}
