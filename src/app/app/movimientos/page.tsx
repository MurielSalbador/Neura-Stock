import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MovForm } from "./mov-form";
import { SucursalSelector } from "../sucursal-selector";
import { HistorialMovimientos } from "./historial-movimientos";

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const user = await requireUser();
  const { sucursal: sucursalFiltro } = await searchParams;
  const empresaId = user.empresaId;
  const esVendedor = user.rol === "VENDEDOR";
  const esAdmin = user.rol === "ADMIN";

  const sucursalEfectiva =
    user.rol === "ENCARGADO" && !sucursalFiltro
      ? (user.sucursalId ?? undefined)
      : sucursalFiltro;

  const encargadoSinSucursal = user.rol === "ENCARGADO" && !user.sucursalId;

  const movWhere: Record<string, unknown> = esVendedor || encargadoSinSucursal
    ? { empresaId, usuarioId: user.id }
    : {
        empresaId,
        ...(sucursalEfectiva
          ? { OR: [{ sucursalOrigenId: sucursalEfectiva }, { sucursalDestinoId: sucursalEfectiva }] }
          : {}),
      };

  const [productos, sucursales, movimientos] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, sku: true },
    }),
    prisma.sucursal.findMany({
      where: {
        empresaId,
        activo: true,
        ...(user.rol === "VENDEDOR" && user.sucursalId ? { id: user.sucursalId } : {}),
      },
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

  const sucursalNombre = sucursalEfectiva
    ? sucursales.find((s) => s.id === sucursalEfectiva)?.nombre ?? null
    : null;

  // Serialize Prisma Decimal and Date values before passing to client component
  const movSerialized = movimientos.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    cantidad: Number(m.cantidad),
    creadoEn: m.creadoEn.toISOString(),
    motivo: m.motivo,
    producto: { nombre: m.producto.nombre },
    sucursalOrigen: m.sucursalOrigen ? { nombre: m.sucursalOrigen.nombre } : null,
    sucursalDestino: m.sucursalDestino ? { nombre: m.sucursalDestino.nombre } : null,
    usuario: m.usuario ? { nombre: m.usuario.nombre } : null,
  }));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <header className="animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon/15 ring-1 ring-neon/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4 4 4" />
              <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Movimientos</h1>
            <p className="mt-0.5 text-sm text-fade">
              {esVendedor
                ? "Tus movimientos registrados"
                : "Cada movimiento actualiza el stock · fuente de verdad"}
            </p>
          </div>
        </div>
      </header>

      {/* ── Branch filter ── */}
      {esAdmin && sucursales.length > 1 && (
        <div className="animate-fade-in-up delay-50 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rail bg-panel px-5 py-3">
          <p className="text-xs font-medium text-fade">
            {sucursalNombre ? `Sucursal: ${sucursalNombre}` : "Todas las sucursales"}
          </p>
          <SucursalSelector sucursales={sucursales} current={sucursalFiltro ?? ""} />
        </div>
      )}

      {/* ── Form + Info card ── */}
      {productos.length === 0 || sucursales.length === 0 ? (
        <div className="animate-fade-in-up delay-100 rounded-xl border border-dashed border-rail bg-panel p-8 text-center">
          <p className="text-sm text-fade">
            Necesitás al menos un producto y una sucursal para registrar movimientos
          </p>
        </div>
      ) : (
        <div id="mov-form" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Form card */}
          <div className="animate-fade-in-up delay-100 lg:col-span-2 rounded-xl border border-rail bg-panel p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/15">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-ink">Nuevo movimiento</h2>
            </div>
            <MovForm productos={productos} sucursales={sucursales} esVendedor={esVendedor} />
          </div>

          {/* Info card */}
          <div className="animate-slide-in-right delay-200 flex flex-col items-center rounded-xl border border-rail bg-panel p-6 text-center">
            {/* 3D box illustration */}
            <div className="relative mb-5 flex h-36 w-36 items-center justify-center">
              <div className="absolute inset-4 rounded-full bg-neon/10 blur-2xl" />
              <svg className="animate-sparkle absolute -top-1 right-2" width="14" height="14" viewBox="0 0 24 24" fill="#a78bfa">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <svg className="animate-sparkle absolute bottom-0 -left-2 delay-300" width="9" height="9" viewBox="0 0 24 24" fill="#7c3aed" opacity="0.7">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <svg className="animate-sparkle absolute top-4 -left-1 delay-150" width="7" height="7" viewBox="0 0 24 24" fill="#c4b5fd" opacity="0.5">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <svg className="animate-float relative" width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="60" cy="100" rx="28" ry="6" fill="#8b5cf6" opacity="0.12" />
                <path d="M20 58 L60 80 L60 100 L20 78 Z" fill="#4c1d95" />
                <path d="M20 58 L60 80 L60 100 L20 78 Z" stroke="#6d28d9" strokeWidth="0.5" />
                <path d="M60 80 L100 58 L100 78 L60 100 Z" fill="#5b21b6" />
                <path d="M60 80 L100 58 L100 78 L60 100 Z" stroke="#7c3aed" strokeWidth="0.5" />
                <path d="M20 58 L60 36 L100 58 L60 80 Z" fill="#7c3aed" />
                <path d="M20 58 L60 36 L100 58 L60 80 Z" stroke="#8b5cf6" strokeWidth="0.5" />
                <path d="M20 38 L60 16 L60 36 L20 58 Z" fill="#6d28d9" />
                <path d="M20 38 L60 16 L60 36 L20 58 Z" stroke="#7c3aed" strokeWidth="0.5" />
                <path d="M60 36 L100 58 L100 38 L60 16 Z" fill="#8b5cf6" />
                <path d="M60 36 L100 58 L100 38 L60 16 Z" stroke="#a78bfa" strokeWidth="0.5" />
                <path d="M20 38 L60 16 L100 38 L60 60 Z" fill="#a78bfa" />
                <path d="M20 38 L60 16 L100 38 L60 60 Z" stroke="#c4b5fd" strokeWidth="0.5" />
                <path d="M80 27 L100 38 L100 48 L80 37 Z" fill="#c4b5fd" opacity="0.3" />
              </svg>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-ink">Gestioná tus movimientos</h3>
            <p className="mb-5 text-xs leading-relaxed text-fade">
              Registrá entradas, salidas y otros movimientos para mantener tu inventario siempre actualizado.
            </p>
            <div className="w-full rounded-lg border border-neon/20 bg-neon/5 px-4 py-3 text-left">
              <p className="text-xs leading-relaxed text-fade">
                <span className="font-semibold text-neon">💡 Tip:</span>{" "}
                Todos los movimientos afectan automáticamente el stock disponible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── History + Stats (client component) ── */}
      <HistorialMovimientos
        movimientos={movSerialized}
        esVendedor={esVendedor}
        esAdmin={esAdmin}
        sucursalNombre={sucursalNombre ?? null}
      />

    </div>
  );
}
