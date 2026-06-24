import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.empresaId) redirect("/login");

  // Re-fetch desde la DB para obtener rol y estado activo frescos.
  // El JWT puede quedar stale si el rol o activo cambia mientras la sesión está abierta.
  const dbUser = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { activo: true, rol: true, sucursalId: true },
  });
  if (!dbUser || !dbUser.activo) redirect("/login");

  return {
    ...session.user,
    rol: dbUser.rol,
    sucursalId: dbUser.sucursalId,
  };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.rol !== "ADMIN") redirect("/app");
  return user;
}
