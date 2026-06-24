import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { alternarUsuario, eliminarUsuario, limpiarMovimientos, limpiarTodo, asignarSucursalesEncargado, asignarSucursalesVendedor } from "./actions";
import { RoleSelect } from "./role-select";
import { AddUserForm } from "./add-user-form";
import { SucursalSelector } from "../sucursal-selector";
import { ConfirmButton } from "../confirm-button";
import { EncargadoBranchPicker } from "./encargado-branch-picker";
import { EditUserDialog } from "./edit-user-dialog";

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

  const misIds = user.sucursalesIds;

  const sucursalEfectiva =
    user.rol === "ENCARGADO" && !sucursalFiltro
      ? (misIds.length === 1 ? misIds[0] : undefined)
      : sucursalFiltro;

  const [todosUsuarios, sucursales] = await Promise.all([
    prisma.usuario.findMany({
      where: { empresaId: user.empresaId },
      include: {
        sucursal: { select: { nombre: true, id: true } },
        sucursalesEncargado: { select: { sucursalId: true, sucursal: { select: { nombre: true } } } },
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
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-ink">Equipo</h1>
          <p className="mt-0.5 text-sm text-fade">No tenés una sucursal asignada. Contactá a tu administrador.</p>
        </header>
      </div>
    );
  }

  const usuariosFiltradosPorRol = esAdmin
    ? todosUsuarios
    : todosUsuarios.filter((u) => u.rol !== "ADMIN");

  // Helper: check if a user belongs to a given branch (via sucursalId or SucursalEncargado)
  const userInBranch = (u: typeof todosUsuarios[0], branchId: string) =>
    u.sucursalId === branchId || u.sucursalesEncargado.some((se) => se.sucursalId === branchId);

  let usuarios;
  if (sucursalEfectiva) {
    usuarios = usuariosFiltradosPorRol.filter((u) => userInBranch(u, sucursalEfectiva));
  } else if (!esAdmin && misIds.length > 0) {
    usuarios = usuariosFiltradosPorRol.filter(
      (u) => misIds.some((mid) => userInBranch(u, mid)),
    );
  } else {
    usuarios = usuariosFiltradosPorRol;
  }

  const totalActivos   = usuarios.filter((u) => u.activo).length;
  const totalInactivos = usuarios.filter((u) => !u.activo).length;

  const sucursalNombre = sucursalEfectiva
    ? sucursales.find((s) => s.id === sucursalEfectiva)?.nombre
    : null;

  const sucursalesVisibles = esAdmin
    ? sucursales
    : sucursales.filter((s) => misIds.includes(s.id));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Equipo</h1>
        <p className="mt-0.5 text-sm text-fade">Todos los usuarios de la empresa</p>
      </header>

      {sucursalesVisibles.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rail bg-panel px-5 py-3">
          <p className="text-xs font-medium text-fade">
            {sucursalNombre ? `Sucursal: ${sucursalNombre}` : "Todas las sucursales"}
          </p>
          <SucursalSelector sucursales={sucursalesVisibles} current={sucursalFiltro ?? ""} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",     valor: usuarios.length,  color: "text-ink" },
          { label: "Activos",   valor: totalActivos,     color: "text-success" },
          { label: "Inactivos", valor: totalInactivos,   color: "text-fade" },
        ].map(({ label, valor, color }) => (
          <div key={label} className="rounded-xl border border-rail bg-panel p-4">
            <p className="text-xs text-fade">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{valor}</p>
          </div>
        ))}
      </div>

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
                Sucursales
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
              const esYo          = u.id === user.id;
              const esAdminGlobal = u.rol === "ADMIN";
              const enMiSucursal  = esAdmin || (misIds.length > 0 && misIds.some((mid) => userInBranch(u, mid)));
              // ENCARGADO solo puede modificar VENDEDORs; ADMIN puede modificar cualquier no-ADMIN
              const puedeModificar = !esYo && !esAdminGlobal && enMiSucursal &&
                (esAdmin || u.rol === "VENDEDOR");
              const inicial = (u.nombre ?? u.email).charAt(0).toUpperCase();

              // Branches for the multi-column picker
              const sucursalesDeEsteEncargado = u.sucursalesEncargado.map((se) => ({
                id: se.sucursalId,
                nombre: se.sucursal.nombre,
              }));

              // For VENDEDOR: show SucursalEncargado entries, fall back to primary branch
              const sucursalesDeEsteVendedor =
                u.sucursalesEncargado.length > 0
                  ? u.sucursalesEncargado.map((se) => ({
                      id: se.sucursalId,
                      nombre: se.sucursal.nombre,
                    }))
                  : u.sucursal
                  ? [{ id: u.sucursal.id, nombre: u.sucursal.nombre }]
                  : [];

              // Current branch IDs for the edit dialog
              const sucursalesActualesIds =
                u.sucursalesEncargado.length > 0
                  ? u.sucursalesEncargado.map((se) => se.sucursalId)
                  : u.sucursalId
                  ? [u.sucursalId]
                  : [];

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

                  {/* Primary branch */}
                  <td className="px-5 py-3 text-sm text-fade">
                    {u.sucursal?.nombre ?? <span className="text-ghost">—</span>}
                  </td>

                  {/* Multi-branch picker */}
                  <td className="px-5 py-3">
                    {u.rol === "ENCARGADO" && esAdmin ? (
                      <EncargadoBranchPicker
                        usuarioId={u.id}
                        todasSucursales={sucursales}
                        asignadas={sucursalesDeEsteEncargado}
                        action={asignarSucursalesEncargado}
                      />
                    ) : u.rol === "VENDEDOR" && puedeModificar ? (
                      <EncargadoBranchPicker
                        usuarioId={u.id}
                        todasSucursales={sucursalesVisibles}
                        asignadas={sucursalesDeEsteVendedor}
                        action={asignarSucursalesVendedor}
                      />
                    ) : (
                      <span className="text-ghost">—</span>
                    )}
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
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/app/admin/${u.id}`}
                        className="text-xs font-medium text-neon hover:underline"
                      >
                        Actividad
                      </Link>
                      {puedeModificar && (
                        <EditUserDialog
                          usuario={{
                            id: u.id,
                            nombre: u.nombre,
                            email: u.email,
                            rol: u.rol,
                            sucursalId: u.sucursalId,
                          }}
                          sucursalesDisponibles={sucursalesVisibles}
                          sucursalesActuales={sucursalesActualesIds}
                          esAdmin={esAdmin}
                        />
                      )}
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
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-fade">
                  {sucursalNombre ? `No hay usuarios en ${sucursalNombre}` : "No hay usuarios todavía"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-rail bg-panel p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Agregar usuario</h2>
        <AddUserForm
          sucursales={sucursalesVisibles}
          esAdmin={esAdmin}
          sucursalFijaNombre={
            !esAdmin
              ? (misIds.length === 1
                  ? sucursales.find((s) => s.id === misIds[0])?.nombre
                  : undefined)
              : undefined
          }
        />
      </div>

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
