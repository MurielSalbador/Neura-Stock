import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SucursalSelector } from "../sucursal-selector";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const user = await requireUser();
  const { sucursal: sucursalFiltro } = await searchParams;
  const empresaId = user.empresaId;

  // ENCARGADO defaults to their branch
  const sucursalEfectiva =
    user.rol === "ENCARGADO" && !sucursalFiltro
      ? (user.sucursalId ?? undefined)
      : sucursalFiltro;

  const [todasSucursales, productos] = await Promise.all([
    prisma.sucursal.findMany({
      where: { empresaId, activo: true },
      orderBy: { creadoEn: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.producto.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
      include: { stock: { select: { sucursalId: true, cantidad: true } } },
    }),
  ]);

  // Show only selected branch or all
  const sucursales = sucursalEfectiva
    ? todasSucursales.filter((s) => s.id === sucursalEfectiva)
    : todasSucursales;

  const sucursalNombre = sucursalEfectiva
    ? todasSucursales.find((s) => s.id === sucursalEfectiva)?.nombre
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Inventario</h1>
        <p className="mt-0.5 text-sm text-fade">
          Stock por sucursal · en rojo cuando está por debajo del mínimo
        </p>
      </header>

      {/* Branch filter */}
      {todasSucursales.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rail bg-panel px-5 py-3">
          <p className="text-xs font-medium text-fade">
            {sucursalNombre ? `Sucursal: ${sucursalNombre}` : "Todas las sucursales"}
          </p>
          <SucursalSelector sucursales={todasSucursales} current={sucursalFiltro ?? ""} />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-rail bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rail bg-panel2">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Producto
              </th>
              {sucursales.map((s) => (
                <th
                  key={s.id}
                  className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-fade"
                >
                  {s.nombre}
                </th>
              ))}
              {!sucursalEfectiva && (
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-fade">
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {productos.map((p) => {
              const porSuc = new Map(
                p.stock.map((s) => [s.sucursalId, Number(s.cantidad)]),
              );
              const total = sucursalEfectiva
                ? (porSuc.get(sucursalEfectiva) ?? 0)
                : [...porSuc.values()].reduce((a, b) => a + b, 0);
              const minimo = Number(p.stockMinimo);
              const bajo = total <= minimo;
              return (
                <tr key={p.id} className="transition-colors hover:bg-panel2">
                  <td className="px-5 py-3 font-semibold text-ink">{p.nombre}</td>
                  {sucursales.map((s) => {
                    const c = porSuc.get(s.id) ?? 0;
                    return (
                      <td key={s.id} className={`px-5 py-3 text-right ${c <= 0 ? "text-danger" : "text-fade"}`}>
                        {c}
                      </td>
                    );
                  })}
                  {!sucursalEfectiva && (
                    <td className={`px-5 py-3 text-right font-bold ${bajo ? "text-danger" : "text-success"}`}>
                      {total}
                    </td>
                  )}
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td
                  colSpan={sucursales.length + (sucursalEfectiva ? 1 : 2)}
                  className="px-5 py-12 text-center text-sm text-fade"
                >
                  Cargá productos y movimientos para ver el stock
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
