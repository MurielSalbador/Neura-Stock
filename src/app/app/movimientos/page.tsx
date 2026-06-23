import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MovForm } from "./mov-form";

const ETIQUETA: Record<string, string> = {
  ENTRADA:       "ENTRADA",
  SALIDA:        "SALIDA",
  TRANSFERENCIA: "TRANSFER",
  AJUSTE:        "AJUSTE",
};

const ETIQUETA_COLOR: Record<string, string> = {
  ENTRADA:       "border-neon/40 bg-neon/10 text-neon",
  SALIDA:        "border-danger/40 bg-danger/10 text-danger",
  TRANSFERENCIA: "border-warn/40 bg-warn/10 text-warn",
  AJUSTE:        "border-fade/40 bg-fade/10 text-fade",
};

export default async function MovimientosPage() {
  const user = await requireUser();
  const empresaId = user.empresaId;

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
      where: { empresaId },
      orderBy: { creadoEn: "desc" },
      take: 20,
      include: {
        producto: { select: { nombre: true } },
        sucursalOrigen: { select: { nombre: true } },
        sucursalDestino: { select: { nombre: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-xl font-bold text-ink">Movimientos</h1>
        <p className="font-mono text-xs text-fade uppercase tracking-widest">
          // cada movimiento actualiza el stock · fuente de verdad
        </p>
      </header>

      {productos.length === 0 || sucursales.length === 0 ? (
        <p className="border border-dashed border-rail bg-panel p-6 text-center font-mono text-xs text-fade uppercase tracking-widest">
          // necesitás al menos un producto y una sucursal para registrar movimientos
        </p>
      ) : (
        <section className="border border-rail bg-panel p-4 space-y-3">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fade">
            Nuevo movimiento
          </h2>
          <MovForm productos={productos} sucursales={sucursales} />
        </section>
      )}

      <div className="overflow-hidden border border-rail">
        <table className="w-full font-mono text-sm">
          <thead className="bg-panel2 text-left">
            <tr>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Fecha</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Tipo</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Producto</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Cant.</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {movimientos.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-panel2">
                <td className="px-4 py-2.5 text-xs text-fade">
                  {m.creadoEn.toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${ETIQUETA_COLOR[m.tipo] ?? "border-rail text-fade"}`}>
                    {ETIQUETA[m.tipo]}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-bold text-ink">{m.producto.nombre}</td>
                <td className="px-4 py-2.5 text-neon font-bold">{Number(m.cantidad)}</td>
                <td className="px-4 py-2.5 text-xs text-fade">
                  {m.sucursalOrigen?.nombre && `desde ${m.sucursalOrigen.nombre} `}
                  {m.sucursalDestino?.nombre && `→ ${m.sucursalDestino.nombre}`}
                  {m.motivo && ` · ${m.motivo}`}
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-fade uppercase tracking-widest">
                  // sin movimientos todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
