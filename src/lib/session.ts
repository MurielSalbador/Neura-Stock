import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Devuelve el usuario logueado (con empresaId/rol) o redirige a /login.
 * Usar en Server Components y Server Actions del panel.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.empresaId) redirect("/login");
  return session.user;
}

/** Lanza si el usuario no es ADMIN. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.rol !== "ADMIN") redirect("/app");
  return user;
}
