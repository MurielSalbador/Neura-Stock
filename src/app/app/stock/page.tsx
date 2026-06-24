import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SucursalSelector } from "../sucursal-selector";
import { ConfirmButton } from "../confirm-button";
import { eliminarProducto } from "../productos/actions";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const user = await requireUser();
  const esAdmin = user.rol === "ADMIN";
  const { sucursal: sucursalFiltro } = await searchParams;
  const empresaId = user.empresaId;

  // Sucursales que puede ver según su rol
  const misIds = user.sucursalesIds;

  // ADMIN: todas, filtro opcional por URL.
  // ENCARGADO: sus sucursales, filtro por URL dentro de sus sucursales.
  // VENDEDOR single-branch: solo su sucursal (fija).
  // VENDEDOR multi-branch: sus sucursales, filtro por URL.
  let sucursalEfectiva: string | undefined;
  if (user.rol === "VENDEDOR") {
    if (misIds.length > 1) {
      sucursalEfectiva = sucursalFiltro && misIds.includes(sucursalFiltro)
        ? sucursalFiltro
        : misIds[0];
    } else {
      sucursalEfectiva = user.sucursalId ?? undefined;
    }
  } else if (user.rol === "ENCARGADO") {
    sucursalEfectiva = sucursalFiltro && misIds.includes(sucursalFiltro)
      ? sucursalFiltro
      : (misIds.length === 1 ? misIds[0] : sucursalFiltro);
  } else {
    sucursalEfectiva = sucursalFiltro;
  }

  const [todasSucursales, productos] = await Promise.all([
    prisma.sucursal.findMany({
      where: {
        empresaId,
        activo: true,
        ...((user.rol === "ENCARGADO" || (user.rol === "VENDEDOR" && misIds.length > 0))
          ? { id: { in: misIds } }
          : {}),
      },
      orderBy: { creadoEn: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.producto.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
      include: {
        stock: {
          where: sucursalEfectiva ? { sucursalId: sucursalEfectiva } : undefined,
          select: { sucursalId: true, cantidad: true },
        },
      },
    }),
  ]);

  // Columnas de sucursales a mostrar
  const sucursales = sucursalEfectiva
    ? todasSucursales.filter((s) => s.id === sucursalEfectiva)
    : todasSucursales;

  // Cuando hay filtro de sucursal: mostrar solo productos que tienen stock ahí
  const productosMostrados = sucursalEfectiva
    ? productos.filter((p) => p.stock.some((s) => Number(s.cantidad) > 0))
    : productos;

  const sucursalNombre = sucursalEfectiva
    ? todasSucursales.find((s) => s.id === sucursalEfectiva)?.nombre
    : null;

  // El selector lo ven: ADMIN, ENCARGADO con múltiples sucursales, VENDEDOR con múltiples sucursales
  const puedeFiltraSucursal =
    esAdmin ||
    ((user.rol === "ENCARGADO" || user.rol === "VENDEDOR") && todasSucursales.length > 1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Inventario</h1>
        <p className="mt-0.5 text-sm text-fade">
          Stock por sucursal · en rojo cuando está por debajo del mínimo
        </p>
      </header>

      {/* Branch filter */}
      {puedeFiltraSucursal && todasSucursales.length > 1 && (
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
              {!sucursalEfectiva && sucursales.length > 1 && (
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-fade">
                  Total
                </th>
              )}
              {esAdmin && <th className="w-10 px-3 py-3.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {productosMostrados.map((p) => {
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
                  {!sucursalEfectiva && sucursales.length > 1 && (
                    <td className={`px-5 py-3 text-right font-bold ${bajo ? "text-danger" : "text-success"}`}>
                      {total}
                    </td>
                  )}
                  {esAdmin && (
                    <td className="px-3 py-3 text-right">
                      <form action={eliminarProducto}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton
                          mensaje={`¿Eliminar "${p.nombre}"? Se borrarán todos sus movimientos y stock.`}
                          className="text-ghost transition-colors hover:text-danger"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </ConfirmButton>
                      </form>
                    </td>
                  )}
                </tr>
              );
            })}
            {productosMostrados.length === 0 && (
              <tr>
                <td
                  colSpan={sucursales.length + ((!sucursalEfectiva && sucursales.length > 1) ? 1 : 0) + (esAdmin ? 1 : 0) + 1}
                  className="px-5 py-12 text-center text-sm text-fade"
                >
                  {sucursalNombre
                    ? `No hay productos con stock en ${sucursalNombre}`
                    : "Cargá productos y movimientos para ver el stock"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
