import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { alternarUsuario, eliminarUsuario, limpiarMovimientos, limpiarTodo } from "./actions";
import { RoleSelect } from "./role-select";
import { AddUserForm } from "./add-user-form";
import { SucursalSelector } from "../sucursal-selector";
import { ConfirmButton } from "../confirm-button";

const ROL_LABEL: Record<string, string> = {
  ADMIN:     "Admin global",
  ENCARGADO: "Encargado",
  VENDEDOR:  "Vendedor",
};

const ROL_COLOR: Record<string, string> = {
  ADMIN:     "bg-neon/15 text-neon",
  ENCARGADO: "bg-info/15 text-info",
  VENDEDOR:  "bg-ghost/15 text-fade",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const user = await requireUser();
  if (user.rol !== "ADMIN" && user.rol !== "ENCARGADO") redirect("/app");

  const { sucursal: sucursalFiltro } = await searchParams;
  const esAdmin = user.rol === "ADMIN";

  // ENCARGADO defaults to their own branch
  const sucursalEfectiva =
    user.rol === "ENCARGADO" && !sucursalFiltro
      ? (user.sucursalId ?? undefined)
      : sucursalFiltro;

  const [todosUsuarios, sucursales] = await Promise.all([
    prisma.usuario.findMany({
      where: { empresaId: user.empresaId },
      include: { sucursal: { select: { nombre: true, id: true } } },
      orderBy: [{ rol: "asc" }, { creadoEn: "asc" }],
    }),
    esAdmin
      ? prisma.sucursal.findMany({
          where: { empresaId: user.empresaId, activo: true },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        })
      : prisma.sucursal.findMany({
          where: { empresaId: user.empresaId, activo: true },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        }),
  ]);

  // Apply branch filter to users list; ENCARGADO never sees ADMINs
  const usuariosFiltradosPorRol = esAdmin
    ? todosUsuarios
    : todosUsuarios.filter((u) => u.rol !== "ADMIN");

  const usuarios = sucursalEfectiva
    ? usuariosFiltradosPorRol.filter((u) => u.sucursalId === sucursalEfectiva)
    : usuariosFiltradosPorRol;

  const totalActivos   = usuarios.filter((u) => u.activo).length;
  const totalInactivos = usuarios.filter((u) => !u.activo).length;

  const sucursalNombre = sucursalEfectiva
    ? sucursales.find((s) => s.id === sucursalEfectiva)?.nombre
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Equipo</h1>
        <p className="mt-0.5 text-sm text-fade">Todos los usuarios de la empresa</p>
      </header>

      {/* Branch filter */}
      {sucursales.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rail bg-panel px-5 py-3">
          <p className="text-xs font-medium text-fade">
            {sucursalNombre ? `Sucursal: ${sucursalNombre}` : "Todas las sucursales"}
          </p>
          <SucursalSelector sucursales={sucursales} current={sucursalFiltro ?? ""} />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",    valor: usuarios.length,  color: "text-ink" },
          { label: "Activos",  valor: totalActivos,     color: "text-success" },
          { label: "Inactivos", valor: totalInactivos,  color: "text-fade" },
        ].map(({ label, valor, color }) => (
          <div key={label} className="rounded-xl border border-rail bg-panel p-4">
            <p className="text-xs text-fade">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{valor}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-rail bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rail bg-panel2">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Usuario
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Rol
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Sucursal
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Estado
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-fade">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {usuarios.map((u) => {
              const esYo            = u.id === user.id;
              const esAdminGlobal   = u.rol === "ADMIN";
              const enMiSucursal    = esAdmin || (!!user.sucursalId && u.sucursalId === user.sucursalId);
              const puedeModificar  = !esYo && !esAdminGlobal && enMiSucursal;
              const inicial = (u.nombre ?? u.email).charAt(0).toUpperCase();

              return (
                <tr key={u.id} className="transition-colors hover:bg-panel2">
                  {/* User */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          esAdminGlobal ? "bg-neon/20 text-neon" : "bg-ghost/20 text-fade"
                        }`}
                      >
                        {inicial}
                      </div>
                      <div>
                        <p className="font-medium text-ink">
                          {u.nombre ?? "—"}
                          {esYo && (
                            <span className="ml-2 rounded bg-panel2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ghost">
                              Vos
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-fade">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-3">
                    {puedeModificar ? (
                      <RoleSelect usuarioId={u.id} currentRol={u.rol} esAdmin={esAdmin} />
                    ) : (
                      <span
                        className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${ROL_COLOR[u.rol] ?? "bg-ghost/15 text-fade"}`}
                      >
                        {ROL_LABEL[u.rol]}
                      </span>
                    )}
                  </td>

                  {/* Branch */}
                  <td className="px-5 py-3 text-sm text-fade">
                    {u.sucursal?.nombre ?? <span className="text-ghost">—</span>}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        u.activo ? "bg-success/15 text-success" : "bg-ghost/15 text-ghost"
                      }`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/app/admin/${u.id}`}
                        className="text-xs font-medium text-neon hover:underline"
                      >
                        Ver actividad
                      </Link>
                      {puedeModificar && (
                        <form action={alternarUsuario}>
                          <input type="hidden" name="usuarioId" value={u.id} />
                          <button className="text-xs font-medium text-fade underline underline-offset-2 transition-colors hover:text-ink">
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                      )}
                      {esAdmin && !esYo && (
                        <form action={eliminarUsuario}>
                          <input type="hidden" name="usuarioId" value={u.id} />
                          <ConfirmButton
                            mensaje={`¿Eliminar al usuario "${u.nombre ?? u.email}"? Esta acción es irreversible.`}
                            className="text-xs font-medium text-danger underline underline-offset-2 transition-colors hover:opacity-70"
                          >
                            Eliminar
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-fade">
                  {sucursalNombre ? `No hay usuarios en ${sucursalNombre}` : "No hay usuarios todavía"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add user */}
      <div className="rounded-xl border border-rail bg-panel p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Agregar usuario</h2>
        <AddUserForm
          sucursales={sucursales}
          esAdmin={esAdmin}
          sucursalFijaNombre={!esAdmin ? (todosUsuarios.find((u) => u.id === user.id)?.sucursal?.nombre ?? undefined) : undefined}
        />
      </div>

      {/* Limpieza de datos — solo ADMIN */}
      {esAdmin && (
        <div className="rounded-xl border border-danger/30 bg-panel p-5">
          <h2 className="mb-1 text-sm font-semibold text-danger">Limpieza de datos</h2>
          <p className="mb-5 text-xs text-fade">
            Estas acciones son irreversibles. Los usuarios y sucursales no se eliminan.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={limpiarMovimientos}>
              <ConfirmButton
                mensaje="¿Borrar TODOS los movimientos y el stock? Esta acción es irreversible."
                className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
              >
                Borrar movimientos y stock
              </ConfirmButton>
            </form>
            <form action={limpiarTodo}>
              <ConfirmButton
                mensaje="¿Borrar TODO (productos, movimientos, ventas, compras)? Esta acción es COMPLETAMENTE irreversible."
                className="rounded-lg bg-danger/15 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/25"
              >
                Borrar todo (productos, movimientos, ventas, compras)
              </ConfirmButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
