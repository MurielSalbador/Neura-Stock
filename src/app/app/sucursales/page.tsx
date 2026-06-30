import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { alternarSucursal } from "./actions";
import { SucursalForm } from "./sucursal-form";

export default async function SucursalesPage() {
  const user = await requireUser();
  if (user.rol !== "ADMIN") redirect("/app");
  const esAdmin = true;

  // ADMIN ve todas (incluye inactivas para poder reactivarlas).
  // Otros roles solo ven las activas.
  const sucursales = await prisma.sucursal.findMany({
    where: { empresaId: user.empresaId, ...(esAdmin ? {} : { activo: true }) },
    orderBy: { creadoEn: "asc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Sucursales y depósitos</h1>
        <p className="mt-0.5 text-sm text-fade">
          Cada local o depósito donde controlás stock
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-rail bg-panel">
        {/* Mobile card list */}
        <div className="divide-y divide-rail sm:hidden">
          {sucursales.map((s) => (
            <div key={s.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{s.nombre}</p>
                  <p className="text-xs text-fade">{s.tipo === "LOCAL" ? "Local" : "Depósito"}</p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    s.activo ? "bg-success/15 text-success" : "bg-ghost/15 text-ghost"
                  }`}
                >
                  {s.activo ? "Activa" : "Inactiva"}
                </span>
              </div>
              {s.direccion && <p className="mt-1.5 text-xs text-ghost">{s.direccion}</p>}
              {esAdmin && (
                <form action={alternarSucursal} className="mt-2">
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs font-medium text-fade underline underline-offset-2 transition-colors hover:text-neon">
                    {s.activo ? "Desactivar" : "Activar"}
                  </button>
                </form>
              )}
            </div>
          ))}
          {sucursales.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-fade">No hay sucursales todavía</p>
          )}
        </div>

        <table className="hidden w-full text-sm sm:table">
          <thead>
            <tr className="border-b border-rail bg-panel2">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Nombre
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Tipo
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Dirección
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Estado
              </th>
              {esAdmin && <th className="px-5 py-3.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {sucursales.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-panel2">
                <td className="px-5 py-3 font-semibold text-ink">{s.nombre}</td>
                <td className="px-5 py-3 text-fade">
                  {s.tipo === "LOCAL" ? "Local" : "Depósito"}
                </td>
                <td className="px-5 py-3 text-xs text-ghost">{s.direccion ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      s.activo
                        ? "bg-success/15 text-success"
                        : "bg-ghost/15 text-ghost"
                    }`}
                  >
                    {s.activo ? "Activa" : "Inactiva"}
                  </span>
                </td>
                {esAdmin && (
                  <td className="px-5 py-3 text-right">
                    <form action={alternarSucursal}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-xs font-medium text-fade underline underline-offset-2 transition-colors hover:text-neon">
                        {s.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            {sucursales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-fade">
                  No hay sucursales todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {esAdmin && (
        <div className="rounded-xl border border-rail bg-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Nueva sucursal</h2>
          <SucursalForm />
        </div>
      )}
    </div>
  );
}
