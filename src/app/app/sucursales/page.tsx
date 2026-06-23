import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { crearSucursal, alternarSucursal } from "./actions";

export default async function SucursalesPage() {
  const user = await requireUser();
  const esAdmin = user.rol === "ADMIN";

  const sucursales = await prisma.sucursal.findMany({
    where: { empresaId: user.empresaId },
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
        <table className="w-full text-sm">
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
          <form action={crearSucursal} className="grid gap-2.5 md:grid-cols-4">
            <input
              name="nombre"
              placeholder="Nombre"
              required
              className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
            />
            <select
              name="tipo"
              className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
            >
              <option value="LOCAL">Local</option>
              <option value="DEPOSITO">Depósito</option>
            </select>
            <input
              name="direccion"
              placeholder="Dirección (opcional)"
              className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
            />
            <button className="rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25">
              + Agregar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
