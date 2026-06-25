import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MovForm } from "./mov-form";
import { eliminarMovimiento } from "./actions";
import { SucursalSelector } from "../sucursal-selector";
import { ConfirmButton } from "../confirm-button";

const ETIQUETA: Record<string, string> = {
  ENTRADA:       "ENTRADA",
  SALIDA:        "SALIDA",
  TRANSFERENCIA: "TRANSFER",
  AJUSTE:        "AJUSTE",
};

const ETIQUETA_COLOR: Record<string, string> = {
  ENTRADA:       "bg-success/15 text-success border border-success/20",
  SALIDA:        "bg-danger/15 text-danger border border-danger/20",
  TRANSFERENCIA: "bg-warn/15 text-warn border border-warn/20",
  AJUSTE:        "bg-ghost/15 text-fade border border-ghost/20",
};

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  iconBg: string;
}) {
  return (
    <div className="card-hover flex items-center gap-4 rounded-xl border border-rail bg-panel p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-fade">{sub}</p>
      </div>
    </div>
  );
}

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
    ? sucursales.find((s) => s.id === sucursalEfectiva)?.nombre
    : null;

  const entradas       = movimientos.filter((m) => m.tipo === "ENTRADA").length;
  const salidas        = movimientos.filter((m) => m.tipo === "SALIDA").length;
  const transferencias = movimientos.filter((m) => m.tipo === "TRANSFERENCIA").length;
  const total          = movimientos.length;

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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
              {/* Sparkles */}
              <svg
                className="animate-sparkle absolute -top-1 right-2"
                width="14" height="14" viewBox="0 0 24 24" fill="#a78bfa"
              >
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <svg
                className="animate-sparkle absolute bottom-0 -left-2 delay-300"
                width="9" height="9" viewBox="0 0 24 24" fill="#7c3aed" opacity="0.7"
              >
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <svg
                className="animate-sparkle absolute top-4 -left-1 delay-150"
                width="7" height="7" viewBox="0 0 24 24" fill="#c4b5fd" opacity="0.5"
              >
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>

              {/* 3D isometric box */}
              <svg className="animate-float relative" width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Shadow */}
                <ellipse cx="60" cy="100" rx="28" ry="6" fill="#8b5cf6" opacity="0.12" />
                {/* Bottom-left face */}
                <path d="M20 58 L60 80 L60 100 L20 78 Z" fill="#4c1d95" />
                <path d="M20 58 L60 80 L60 100 L20 78 Z" stroke="#6d28d9" strokeWidth="0.5" />
                {/* Bottom-right face */}
                <path d="M60 80 L100 58 L100 78 L60 100 Z" fill="#5b21b6" />
                <path d="M60 80 L100 58 L100 78 L60 100 Z" stroke="#7c3aed" strokeWidth="0.5" />
                {/* Top face */}
                <path d="M20 58 L60 36 L100 58 L60 80 Z" fill="#7c3aed" />
                <path d="M20 58 L60 36 L100 58 L60 80 Z" stroke="#8b5cf6" strokeWidth="0.5" />
                {/* Left face */}
                <path d="M20 38 L60 16 L60 36 L20 58 Z" fill="#6d28d9" />
                <path d="M20 38 L60 16 L60 36 L20 58 Z" stroke="#7c3aed" strokeWidth="0.5" />
                {/* Right face */}
                <path d="M60 36 L100 58 L100 38 L60 16 Z" fill="#8b5cf6" />
                <path d="M60 36 L100 58 L100 38 L60 16 Z" stroke="#a78bfa" strokeWidth="0.5" />
                {/* Top face (bright) */}
                <path d="M20 38 L60 16 L100 38 L60 60 Z" fill="#a78bfa" />
                <path d="M20 38 L60 16 L100 38 L60 60 Z" stroke="#c4b5fd" strokeWidth="0.5" />
                {/* Highlight strip on right face */}
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

      {/* ── History section ── */}
      <div className="animate-fade-in-up delay-200 overflow-hidden rounded-xl border border-rail bg-panel">
        {/* Section header */}
        <div className="flex flex-wrap items-center gap-3 border-b border-rail px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-panel2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-ink">Historial de movimientos</h2>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <label className="relative flex items-center">
              <svg className="pointer-events-none absolute left-3" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Buscar movimiento..."
                className="w-48 rounded-lg border border-rail bg-panel2 py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ghost transition-colors focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon/20"
              />
            </label>
            {/* Filter button */}
            <button className="flex items-center gap-1.5 rounded-lg border border-rail bg-panel2 px-3 py-2 text-xs font-medium text-fade transition-colors hover:border-neon/30 hover:bg-panel hover:text-ink">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="11" y2="6" /><line x1="4" y1="12" x2="16" y2="12" /><line x1="4" y1="18" x2="21" y2="18" />
              </svg>
              Filtros
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rail bg-panel2/60">
              <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-fade">Fecha</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-fade">Tipo</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-fade">Producto</th>
              <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-fade">Cant.</th>
              {!esVendedor && (
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-fade">Usuario</th>
              )}
              <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest text-fade">Sucursal / Detalle</th>
              {esAdmin && (
                <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-widest text-fade">Acción</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {movimientos.map((m) => (
              <tr key={m.id} className="group transition-colors duration-150 hover:bg-panel2/70">
                <td className="px-5 py-3.5 text-xs text-fade">
                  {m.creadoEn.toLocaleDateString("es-AR")}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ETIQUETA_COLOR[m.tipo] ?? "bg-ghost/15 text-fade border border-ghost/20"}`}>
                    {ETIQUETA[m.tipo]}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-medium text-ink">{m.producto.nombre}</td>
                <td className="px-5 py-3.5 font-bold text-success">{Number(m.cantidad)}</td>
                {!esVendedor && (
                  <td className="px-5 py-3.5 text-xs text-fade">
                    {m.usuario?.nombre ?? <span className="text-ghost">—</span>}
                  </td>
                )}
                <td className="px-5 py-3.5 text-xs text-fade">
                  {m.sucursalOrigen?.nombre && (
                    <span className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] font-medium text-fade">
                      {m.sucursalOrigen.nombre}
                    </span>
                  )}
                  {m.sucursalOrigen && m.sucursalDestino && (
                    <span className="mx-1 text-ghost">→</span>
                  )}
                  {m.sucursalDestino?.nombre && (
                    <span className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] font-medium text-fade">
                      {m.sucursalDestino.nombre}
                    </span>
                  )}
                  {m.motivo && <span className="ml-1 text-ghost">· {m.motivo}</span>}
                </td>
                {esAdmin && (
                  <td className="px-5 py-3.5 text-right">
                    <form action={eliminarMovimiento}>
                      <input type="hidden" name="id" value={m.id} />
                      <ConfirmButton
                        mensaje="¿Eliminar este movimiento? El stock se revertirá automáticamente."
                        className="text-xs font-medium text-danger underline underline-offset-2 transition-opacity hover:opacity-70"
                      >
                        Borrar
                      </ConfirmButton>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {movimientos.length === 0 && (
          <div className="flex flex-col items-center py-16 animate-fade-in-up">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rail bg-panel2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-ink">
              {sucursalNombre
                ? `Sin movimientos en ${sucursalNombre}`
                : "No hay movimientos registrados"}
            </h3>
            <p className="mb-5 text-xs text-fade">Los movimientos que registres aparecerán aquí.</p>
            <button
              onClick={undefined}
              className="rounded-lg border border-neon/30 bg-neon/10 px-5 py-2.5 text-sm font-medium text-neon transition-colors hover:bg-neon/20 hover:border-neon/50"
            >
              Registrar tu primer movimiento
            </button>
          </div>
        )}
      </div>

      {/* ── Stats cards ── */}
      <div className="animate-fade-in-up delay-300 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          iconBg="bg-neon/15"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4 4 4" />
            </svg>
          }
          value={entradas}
          label="Entradas"
          sub="Total ingresos"
        />
        <StatCard
          iconBg="bg-success/15"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14m-7-7 7 7 7-7" />
            </svg>
          }
          value={salidas}
          label="Salidas"
          sub="Total egresos"
        />
        <StatCard
          iconBg="bg-warn/15"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e3b341" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4 4 4" />
              <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
            </svg>
          }
          value={transferencias}
          label="Transferencias"
          sub="Entre sucursales"
        />
        <StatCard
          iconBg="bg-info/15"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
          value={total}
          label="Total movimientos"
          sub="Este mes"
        />
      </div>

    </div>
  );
}
