import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EquipoClient } from "./equipo-client";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const user = await requireUser();
  if (user.rol !== "ADMIN" && user.rol !== "ENCARGADO") redirect("/app");

  const { sucursal: sucursalFiltro } = await searchParams;
  const esAdmin = user.rol === "ADMIN";
  const misIds  = user.sucursalesIds;

  const sucursalEfectiva =
    user.rol === "ENCARGADO" && !sucursalFiltro
      ? misIds.length === 1 ? misIds[0] : undefined
      : sucursalFiltro;

  const [todosUsuarios, sucursales] = await Promise.all([
    prisma.usuario.findMany({
      where: { empresaId: user.empresaId },
      include: {
        sucursal: { select: { nombre: true, id: true } },
        sucursalesEncargado: {
          select: { sucursalId: true, sucursal: { select: { nombre: true } } },
        },
      },
      orderBy: [{ rol: "asc" }, { creadoEn: "asc" }],
    }),
    prisma.sucursal.findMany({
      where: { empresaId: user.empresaId, activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!esAdmin && misIds.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Equipo</h1>
        <p className="text-sm text-fade">
          No tenés una sucursal asignada. Contactá a tu administrador.
        </p>
      </div>
    );
  }

  const usuariosFiltradosPorRol = esAdmin
    ? todosUsuarios
    : todosUsuarios.filter((u) => u.rol !== "ADMIN");

  const userInBranch = (u: (typeof todosUsuarios)[0], branchId: string) =>
    u.sucursalId === branchId ||
    u.sucursalesEncargado.some((se) => se.sucursalId === branchId);

  let usuarios: typeof todosUsuarios;
  if (sucursalEfectiva) {
    usuarios = usuariosFiltradosPorRol.filter((u) => userInBranch(u, sucursalEfectiva));
  } else if (!esAdmin && misIds.length > 0) {
    usuarios = usuariosFiltradosPorRol.filter((u) =>
      misIds.some((mid) => userInBranch(u, mid)),
    );
  } else {
    usuarios = usuariosFiltradosPorRol;
  }

  const sucursalesVisibles = esAdmin
    ? sucursales
    : sucursales.filter((s) => misIds.includes(s.id));

  return (
    <EquipoClient
      usuarios={usuarios}
      sucursales={sucursales}
      sucursalesVisibles={sucursalesVisibles}
      sessionUser={{
        id: user.id,
        rol: user.rol,
        sucursalesIds: user.sucursalesIds,
      }}
      esAdmin={esAdmin}
      misIds={misIds}
      sucursalFiltro={sucursalFiltro ?? ""}
    />
  );
}
