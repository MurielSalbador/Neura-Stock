import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function StockPage() {
  const user = await requireUser();
  const empresaId = user.empresaId;

  const [sucursales, productos] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-xl font-bold text-ink">Stock por sucursal</h1>
        <p className="font-mono text-xs text-fade uppercase tracking-widest">
          // qué hay y dónde · en rojo, por debajo del mínimo
        </p>
      </header>

      <div className="overflow-x-auto border border-rail">
        <table className="w-full font-mono text-sm">
          <thead className="bg-panel2 text-left">
            <tr>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">
                Producto
              </th>
              {sucursales.map((s) => (
                <th key={s.id} className="px-4 py-3 text-right text-[10px] font-normal uppercase tracking-widest text-fade">
                  {s.nombre}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-normal uppercase tracking-widest text-fade">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {productos.map((p) => {
              const porSuc = new Map(p.stock.map((s) => [s.sucursalId, Number(s.cantidad)]));
              const total = [...porSuc.values()].reduce((a, b) => a + b, 0);
              const minimo = Number(p.stockMinimo);
              const bajo = total <= minimo;
              return (
                <tr key={p.id} className="transition-colors hover:bg-panel2">
                  <td className="px-4 py-2.5 font-bold text-ink">{p.nombre}</td>
                  {sucursales.map((s) => {
                    const c = porSuc.get(s.id) ?? 0;
                    return (
                      <td key={s.id} className="px-4 py-2.5 text-right text-fade">
                        {c}
                      </td>
                    );
                  })}
                  <td className={`px-4 py-2.5 text-right font-bold ${bajo ? "text-danger glow-danger" : "text-neon"}`}>
                    {total}
                  </td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td
                  colSpan={sucursales.length + 2}
                  className="px-4 py-8 text-center text-xs text-fade uppercase tracking-widest"
                >
                  // cargá productos y movimientos para ver el stock
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
