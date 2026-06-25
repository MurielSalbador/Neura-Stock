import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProductoForm } from "./producto-form";
import { ProductosTablaCliente } from "./productos-tabla-cliente";

export default async function ProductosPage() {
  const user = await requireUser();
  const esAdmin = user.rol === "ADMIN";
  const puedeCrear = user.rol !== "VENDEDOR";
  const puedeEditar = user.rol !== "VENDEDOR";

  const [productos, sucursales] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId: user.empresaId, activo: true },
      orderBy: { creadoEn: "desc" },
      include: { stock: { select: { cantidad: true } } },
    }),
    prisma.sucursal.findMany({
      where: { empresaId: user.empresaId, activo: true },
      orderBy: { creadoEn: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  // Serialize Decimals → numbers for client components
  const productosCliente = productos.map((p) => ({
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    codigoBarras: p.codigoBarras,
    precioVenta: Number(p.precioVenta),
    stockMinimo: Number(p.stockMinimo),
    stockTotal: p.stock.reduce((acc, s) => acc + Number(s.cantidad), 0),
  }));

  const unidadesTotal = productosCliente.reduce((acc, p) => acc + p.stockTotal, 0);
  const bajoStock = productosCliente.filter((p) => p.stockTotal <= p.stockMinimo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4 animate-fade-in-up">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neon/20 animate-pulse-border">
          <svg
            className="h-5 w-5 text-neon"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Productos</h1>
          <p className="text-sm text-fade">Tu catálogo de productos</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-rail bg-panel px-5 py-4 card-hover animate-fade-in-up delay-50">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon/10">
            <svg className="h-5 w-5 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-fade">Total productos</p>
            <p className="text-2xl font-bold text-ink">{productos.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-rail bg-panel px-5 py-4 card-hover animate-fade-in-up delay-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info/10">
            <svg className="h-5 w-5 text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-fade">Unidades en stock</p>
            <p className="text-2xl font-bold text-ink">{unidadesTotal.toLocaleString("es-AR")}</p>
          </div>
        </div>

        <div className={`flex items-center gap-4 rounded-2xl border bg-panel px-5 py-4 card-hover animate-fade-in-up delay-150 ${bajoStock > 0 ? "border-warn/30" : "border-rail"}`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bajoStock > 0 ? "bg-warn/10" : "bg-success/10"}`}>
            <svg className={`h-5 w-5 ${bajoStock > 0 ? "text-warn" : "text-success"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-fade">Bajo stock mínimo</p>
            <p className={`text-2xl font-bold ${bajoStock > 0 ? "text-warn" : "text-ink"}`}>
              {bajoStock}
            </p>
          </div>
        </div>
      </div>

      {/* Create form */}
      {puedeCrear && <ProductoForm sucursales={sucursales} />}

      {/* Product table */}
      <ProductosTablaCliente
        productos={productosCliente}
        esAdmin={esAdmin}
        puedeEditar={puedeEditar}
      />
    </div>
  );
}
