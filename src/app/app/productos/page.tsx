import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { crearProducto } from "./actions";

export default async function ProductosPage() {
  const user = await requireUser();

  const productos = await prisma.producto.findMany({
    where: { empresaId: user.empresaId, activo: true },
    orderBy: { creadoEn: "desc" },
    include: { stock: { select: { cantidad: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-xl font-bold text-ink">Productos</h1>
        <p className="font-mono text-xs text-fade uppercase tracking-widest">
          // tu catálogo
        </p>
      </header>

      {/* Formulario nuevo producto */}
      <section className="border border-rail bg-panel p-4 space-y-3">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fade">
          Nuevo producto
        </h2>
        <form action={crearProducto} className="grid gap-2 md:grid-cols-5">
          <input
            name="sku"
            placeholder="SKU / código"
            required
            className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
          />
          <input
            name="nombre"
            placeholder="Nombre"
            required
            className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors md:col-span-2"
          />
          <input
            name="codigoBarras"
            placeholder="Cód. barras (opc.)"
            className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
          />
          <input
            name="precioVenta"
            type="number"
            step="0.01"
            placeholder="Precio venta"
            className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
          />
          <input
            name="stockMinimo"
            type="number"
            step="0.001"
            placeholder="Stock mínimo"
            className="border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
          />
          <button className="border border-neon/60 bg-neon/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-neon transition-colors hover:bg-neon/20 md:col-span-2">
            + Agregar producto
          </button>
        </form>
      </section>

      {/* Tabla */}
      <div className="overflow-hidden border border-rail">
        <table className="w-full font-mono text-sm">
          <thead className="bg-panel2 text-left">
            <tr>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">SKU</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Nombre</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Precio</th>
              <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-widest text-fade">Stock total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {productos.map((p) => {
              const total = p.stock.reduce((acc, s) => acc + Number(s.cantidad), 0);
              return (
                <tr key={p.id} className="transition-colors hover:bg-panel2">
                  <td className="px-4 py-2.5 text-xs text-fade">{p.sku}</td>
                  <td className="px-4 py-2.5 font-bold text-ink">{p.nombre}</td>
                  <td className="px-4 py-2.5 text-ink">${Number(p.precioVenta).toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-bold text-neon">{total}</td>
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-xs text-fade uppercase tracking-widest">
                  // todavía no cargaste productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
