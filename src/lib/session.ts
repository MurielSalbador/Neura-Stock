import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// cache() deduplicates calls within the same request — layout + page only hit the DB once
export const requireUser = cache(async function requireUserImpl() {
  const session = await auth();
  if (!session?.user?.empresaId) redirect("/login");

  // Re-fetch desde la DB para obtener rol y estado activo frescos.
  const dbUser = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      activo: true,
      rol: true,
      sucursalId: true,
      sucursalesEncargado: { select: { sucursalId: true } },
    },
  });
  if (!dbUser || !dbUser.activo) redirect("/login");

  // Arma la lista de sucursales que maneja el encargado (incluyendo la principal).
  const sucursalesIds: string[] = [];
  if (dbUser.sucursalId) sucursalesIds.push(dbUser.sucursalId);
  for (const se of dbUser.sucursalesEncargado) {
    if (!sucursalesIds.includes(se.sucursalId)) sucursalesIds.push(se.sucursalId);
  }

  return {
    ...session.user,
    rol: dbUser.rol,
    sucursalId: dbUser.sucursalId,
    sucursalesIds,
  };
});

export const getOptionalUser = cache(async function getOptionalUserImpl() {
  const session = await auth();
  if (!session?.user?.empresaId) return null;

  const dbUser = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      activo: true,
      rol: true,
      sucursalId: true,
      sucursalesEncargado: { select: { sucursalId: true } },
    },
  });
  if (!dbUser || !dbUser.activo) return null;

  const sucursalesIds: string[] = [];
  if (dbUser.sucursalId) sucursalesIds.push(dbUser.sucursalId);
  for (const se of dbUser.sucursalesEncargado) {
    if (!sucursalesIds.includes(se.sucursalId)) sucursalesIds.push(se.sucursalId);
  }

  return {
    ...session.user,
    rol: dbUser.rol,
    sucursalId: dbUser.sucursalId,
    sucursalesIds,
  };
});

export async function requireAdmin() {
  const user = await requireUser();
  if (user.rol !== "ADMIN") redirect("/app");
  return user;
}
