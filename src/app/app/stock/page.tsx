import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { InventarioCliente } from "./inventario-cliente";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const user = await requireUser();
  const esAdmin = user.rol === "ADMIN";
  const { sucursal: sucursalFiltro } = await searchParams;
  const empresaId = user.empresaId;
  const misIds = user.sucursalesIds;

  // Resolve effective branch filter per role
  let sucursalEfectiva: string | undefined;
  if (user.rol === "VENDEDOR") {
    if (misIds.length > 1) {
      sucursalEfectiva =
        sucursalFiltro && misIds.includes(sucursalFiltro)
          ? sucursalFiltro
          : misIds[0];
    } else {
      sucursalEfectiva = user.sucursalId ?? undefined;
    }
  } else if (user.rol === "ENCARGADO") {
    sucursalEfectiva =
      sucursalFiltro && misIds.includes(sucursalFiltro)
        ? sucursalFiltro
        : misIds.length === 1
          ? misIds[0]
          : sucursalFiltro;
  } else {
    sucursalEfectiva = sucursalFiltro;
  }

  const [todasSucursales, productos] = await Promise.all([
    prisma.sucursal.findMany({
      where: {
        empresaId,
        activo: true,
        ...(user.rol === "ENCARGADO" ||
        (user.rol === "VENDEDOR" && misIds.length > 0)
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

  // Columns to show in the table
  const columnas = sucursalEfectiva
    ? todasSucursales.filter((s) => s.id === sucursalEfectiva)
    : todasSucursales;

  // When a branch is selected: only show products that have stock there
  const productosMostrados = sucursalEfectiva
    ? productos.filter((p) => p.stock.some((s) => Number(s.cantidad) > 0))
    : productos;

  // Serialize Decimals → numbers for the client component
  const productosCliente = productosMostrados.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    sku: p.sku,
    stockMinimo: Number(p.stockMinimo),
    stockPorSucursal: p.stock.map((s) => ({
      sucursalId: s.sucursalId,
      cantidad: Number(s.cantidad),
    })),
  }));

  const puedeFiltraSucursal =
    esAdmin ||
    ((user.rol === "ENCARGADO" || user.rol === "VENDEDOR") &&
      todasSucursales.length > 1);

  return (
    <div className="space-y-6">
      <header className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-ink">Inventario</h1>
        <p className="mt-0.5 text-sm text-fade">
          Stock por sucursal · en rojo cuando está por debajo del mínimo
        </p>
      </header>

      <InventarioCliente
        productos={productosCliente}
        columnas={columnas}
        todasSucursales={todasSucursales}
        sucursalFiltro={sucursalEfectiva}
        esAdmin={esAdmin}
        puedeFiltraSucursal={puedeFiltraSucursal}
      />
    </div>
  );
}
