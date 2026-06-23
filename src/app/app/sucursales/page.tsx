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
      <header className="space-y-1">
        <h1 className="font-mono text-xl font-bold text-ink">Sucursales y depósitos</h1>
        <p className="font-mono text-xs text-fade uppercase tracking-widest">
          // cada local o depósito donde controlás stock
        </p>
      </header>

      <div className="overflow-hidden border border-rail">
        <table className="w-full font-mono text-sm">
          <thead className="bg-panel2 text-left">
            <tr>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Nombre</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Tipo</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Dirección</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Estado</th>
              {esAdmin && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {sucursales.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-panel2">
                <td className="px-4 py-2.5 font-bold text-ink">{s.nombre}</td>
                <td className="px-4 py-2.5 text-fade">
                  {s.tipo === "LOCAL" ? "Local" : "Depósito"}
                </td>
                <td className="px-4 py-2.5 text-xs text-ghost">{s.direccion ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      s.activo
                        ? "border-neon/40 bg-neon/10 text-neon"
                        : "border-rail bg-panel2 text-ghost"
                    }`}
                  >
                    {s.activo ? "Activa" : "Inactiva"}
                  </span>
                </td>
                {esAdmin && (
                  <td className="px-4 py-2.5 text-right">
                    <form action={alternarSucursal}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="font-mono text-[11px] text-fade underline underline-offset-2 hover:text-neon transition-colors">
                        {s.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            {sucursales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-fade uppercase tracking-widest">
                  // no hay sucursales todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {esAdmin && (
        <section className="border border-rail bg-panel p-4 space-y-3">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fade">
            Nueva sucursal
          </h2>
          <form action={crearSucursal} className="grid gap-2 md:grid-cols-4">
            <input
              name="nombre"
              placeholder="Nombre"
              required
              className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
            />
            <select
              name="tipo"
              className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
            >
              <option value="LOCAL">Local</option>
              <option value="DEPOSITO">Depósito</option>
            </select>
            <input
              name="direccion"
              placeholder="Dirección (opcional)"
              className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
            />
            <button className="border border-neon/60 bg-neon/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-neon transition-colors hover:bg-neon/20">
              + Agregar
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
