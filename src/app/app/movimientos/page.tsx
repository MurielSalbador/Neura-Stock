import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MovForm } from "./mov-form";
import { eliminarMovimiento } from "./actions";

const ETIQUETA: Record<string, string> = {
  ENTRADA:       "ENTRADA",
  SALIDA:        "SALIDA",
  TRANSFERENCIA: "TRANSFER",
  AJUSTE:        "AJUSTE",
};

const ETIQUETA_COLOR: Record<string, string> = {
  ENTRADA:       "bg-success/15 text-success",
  SALIDA:        "bg-danger/15 text-danger",
  TRANSFERENCIA: "bg-warn/15 text-warn",
  AJUSTE:        "bg-ghost/15 text-fade",
};

export default async function MovimientosPage() {
  const user = await requireUser();
  const empresaId = user.empresaId;
  const esVendedor = user.rol === "VENDEDOR";
  const esAdmin = user.rol === "ADMIN";

  const movWhere =
    user.rol === "VENDEDOR"
      ? { empresaId, usuarioId: user.id }
      : { empresaId };

  const [productos, sucursales, movimientos] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, sku: true },
    }),
    prisma.sucursal.findMany({
      where: { empresaId, activo: true },
      orderBy: { creadoEn: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.movimiento.findMany({
      where: movWhere,
      orderBy: { creadoEn: "desc" },
      take: 50,
      include: {
        producto:        { select: { nombre: true } },
        sucursalOrigen:  { select: { nombre: true } },
        sucursalDestino: { select: { nombre: true } },
        usuario:         { select: { nombre: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Movimientos</h1>
        <p className="mt-0.5 text-sm text-fade">
          {esVendedor
            ? "Tus movimientos registrados"
            : "Cada movimiento actualiza el stock · fuente de verdad"}
        </p>
      </header>

      {productos.length === 0 || sucursales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rail bg-panel p-8 text-center">
          <p className="text-sm text-fade">
            Necesitás al menos un producto y una sucursal para registrar movimientos
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-rail bg-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Nuevo movimiento</h2>
          <MovForm productos={productos} sucursales={sucursales} />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-rail bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rail bg-panel2">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Fecha
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Tipo
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Producto
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Cant.
              </th>
              {!esVendedor && (
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                  Usuario
                </th>
              )}
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Detalle
              </th>
              {esAdmin && (
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-fade">
                  Acción
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {movimientos.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-panel2">
                <td className="px-5 py-3 text-xs text-fade">
                  {m.creadoEn.toLocaleDateString("es-AR")}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ETIQUETA_COLOR[m.tipo] ?? "bg-ghost/15 text-fade"}`}
                  >
                    {ETIQUETA[m.tipo]}
                  </span>
                </td>
                <td className="px-5 py-3 font-semibold text-ink">{m.producto.nombre}</td>
                <td className="px-5 py-3 font-bold text-success">{Number(m.cantidad)}</td>
                {!esVendedor && (
                  <td className="px-5 py-3 text-xs text-fade">
                    {m.usuario?.nombre ?? <span className="text-ghost">—</span>}
                  </td>
                )}
                <td className="px-5 py-3 text-xs text-fade">
                  {m.sucursalOrigen?.nombre && `desde ${m.sucursalOrigen.nombre} `}
                  {m.sucursalDestino?.nombre && `→ ${m.sucursalDestino.nombre}`}
                  {m.motivo && ` · ${m.motivo}`}
                </td>
                {esAdmin && (
                  <td className="px-5 py-3 text-right">
                    <form action={eliminarMovimiento}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-xs font-medium text-danger underline underline-offset-2 transition-colors hover:opacity-70">
                        Borrar
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={esVendedor ? 5 : esAdmin ? 7 : 6} className="px-5 py-12 text-center text-sm text-fade">
                  Sin movimientos todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
