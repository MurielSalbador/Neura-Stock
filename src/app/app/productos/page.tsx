import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { crearProducto, eliminarProducto } from "./actions";
import { ConfirmButton } from "../confirm-button";

export default async function ProductosPage() {
  const user = await requireUser();
  const esAdmin = user.rol === "ADMIN";

  const productos = await prisma.producto.findMany({
    where: { empresaId: user.empresaId, activo: true },
    orderBy: { creadoEn: "desc" },
    include: { stock: { select: { cantidad: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Productos</h1>
        <p className="mt-0.5 text-sm text-fade">Tu catálogo de productos</p>
      </header>

      {/* Nuevo producto */}
      <div className="rounded-xl border border-rail bg-panel p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Nuevo producto</h2>
        <form action={crearProducto} className="grid gap-2.5 md:grid-cols-5">
          <input
            name="sku"
            placeholder="SKU / código"
            required
            className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
          />
          <input
            name="nombre"
            placeholder="Nombre"
            required
            className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors md:col-span-2"
          />
          <input
            name="codigoBarras"
            placeholder="Cód. barras (opc.)"
            className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
          />
          <input
            name="precioVenta"
            type="number"
            step="0.01"
            placeholder="Precio venta"
            className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
          />
          <input
            name="stockMinimo"
            type="number"
            step="0.001"
            placeholder="Stock mínimo"
            className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
          />
          <button className="rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25 md:col-span-2">
            + Agregar producto
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-rail bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rail bg-panel2">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                SKU
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Nombre
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Precio
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Stock total
              </th>
              {esAdmin && (
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-fade">
                  Acción
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {productos.map((p) => {
              const total = p.stock.reduce((acc, s) => acc + Number(s.cantidad), 0);
              return (
                <tr key={p.id} className="transition-colors hover:bg-panel2">
                  <td className="px-5 py-3 font-mono text-xs text-fade">{p.sku}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{p.nombre}</td>
                  <td className="px-5 py-3 text-ink">${Number(p.precioVenta).toFixed(2)}</td>
                  <td className="px-5 py-3 font-bold text-success">{total}</td>
                  {esAdmin && (
                    <td className="px-5 py-3 text-right">
                      <form action={eliminarProducto}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton
                          mensaje={`¿Eliminar el producto "${p.nombre}"? Se borrarán sus movimientos y stock asociados.`}
                          className="text-xs font-medium text-danger underline underline-offset-2 transition-colors hover:opacity-70"
                        >
                          Borrar
                        </ConfirmButton>
                      </form>
                    </td>
                  )}
                </tr>
              );
            })}
            {productos.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 5 : 4} className="px-5 py-12 text-center text-sm text-fade">
                  Todavía no cargaste productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
