import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SucursalSelector } from "./sucursal-selector";

const TIPO_LABEL: Record<string, string> = {
  ENTRADA:       "Entrada de stock",
  SALIDA:        "Salida de stock",
  TRANSFERENCIA: "Transferencia",
  AJUSTE:        "Ajuste",
};

const TIPO_STYLE: Record<string, { bg: string; text: string }> = {
  ENTRADA:       { bg: "bg-success/15", text: "text-success" },
  SALIDA:        { bg: "bg-danger/15",  text: "text-danger" },
  TRANSFERENCIA: { bg: "bg-warn/15",    text: "text-warn" },
  AJUSTE:        { bg: "bg-ghost/15",   text: "text-fade" },
};

const BRANCH_COLORS = [
  { from: "#6d28d9", to: "#8b5cf6", accent: "#a78bfa", iconBg: "rgba(109,40,217,0.18)", border: "rgba(139,92,246,0.22)" },
  { from: "#c2410c", to: "#f97316", accent: "#fb923c", iconBg: "rgba(234,88,12,0.18)",  border: "rgba(249,115,22,0.22)"  },
  { from: "#0e7490", to: "#06b6d4", accent: "#22d3ee", iconBg: "rgba(14,116,144,0.18)", border: "rgba(6,182,212,0.22)"   },
  { from: "#15803d", to: "#22c55e", accent: "#4ade80", iconBg: "rgba(21,128,61,0.18)",  border: "rgba(34,197,94,0.22)"   },
];

function formatFecha(date: Date): string {
  const ahora = new Date();
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  const hora = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === ahora.toDateString()) return `Hoy, ${hora}`;
  if (date.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
  return date.toLocaleDateString("es-AR");
}

/** Group items by day-index into a 7-element array (index 0 = 6 days ago, index 6 = today) */
function groupByDay(items: { creadoEn: Date }[]): number[] {
  const buckets = new Array(7).fill(0);
  const now = Date.now();
  for (const item of items) {
    const diffDays = Math.floor((now - item.creadoEn.getTime()) / 86_400_000);
    if (diffDays >= 0 && diffDays < 7) buckets[6 - diffDays]++;
  }
  return buckets;
}

/** Convert a values array into an SVG polyline path within a 120×40 viewBox. */
function buildSparkPath(values: number[]): string {
  const allZero = values.every((v) => v === 0);
  if (allZero) return "M0,36 L120,36";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = values.length <= 1 ? 60 : (i / (values.length - 1)) * 120;
      const y = 36 - ((v - min) / range) * 28;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const user = await requireUser();
  const { sucursal: sucursalFiltro } = await searchParams;
  const empresaId = user.empresaId;
  const misIds = user.sucursalesIds; // branches del encargado (vacío para ADMIN/VENDEDOR)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Scope base de movimientos según el rol
  const movWhere =
    user.rol === "VENDEDOR"
      ? { empresaId, usuarioId: user.id }
      : { empresaId };

  // Sucursales propias para ENCARGADO y VENDEDOR multi-branch
  const rolSucursalIds =
    (user.rol === "ENCARGADO" || user.rol === "VENDEDOR") && misIds.length > 0 ? misIds : null;

  // Para ENCARGADO: filtrar solo por sus sucursales cuando no hay filtro manual
  const encargadoSucursalIds =
    user.rol === "ENCARGADO" && misIds.length > 0 ? misIds : null;

  // Sucursal efectiva para filtrar el panel de detalle
  let sucursalEfectiva: string | undefined;
  if (sucursalFiltro) {
    sucursalEfectiva = sucursalFiltro;
  } else if (user.rol === "ENCARGADO" && misIds.length === 1) {
    sucursalEfectiva = misIds[0];
  }

  // Recent movements where clause — adds branch filter when selected
  const movRecientesWhere = {
    ...movWhere,
    ...(sucursalEfectiva
      ? { OR: [{ sucursalOrigenId: sucursalEfectiva }, { sucursalDestinoId: sucursalEfectiva }] }
      : encargadoSucursalIds
      ? { OR: [
          { sucursalOrigenId: { in: encargadoSucursalIds } },
          { sucursalDestinoId: { in: encargadoSucursalIds } },
        ] }
      : {}),
  };

  const [
    sucursalesList,
    productosCount,
    movimientosCount,
    lineasStock,
    movimientosRecientes,
    movsLast7,
    productosLast7,
  ] = await Promise.all([
    prisma.sucursal.findMany({
      where: {
        empresaId,
        activo: true,
        ...(rolSucursalIds ? { id: { in: rolSucursalIds } } : {}),
      },
      select: { id: true, nombre: true },
      orderBy: { creadoEn: "asc" },
    }),
    prisma.producto.count({ where: { empresaId, activo: true } }),
    prisma.movimiento.count({ where: movWhere }),
    prisma.stock.findMany({
      where: {
        empresaId,
        ...(rolSucursalIds ? { sucursalId: { in: rolSucursalIds } } : {}),
      },
      include: { producto: { select: { nombre: true, stockMinimo: true } } },
      take: 500,
    }),
    prisma.movimiento.findMany({
      where: movRecientesWhere,
      orderBy: { creadoEn: "desc" },
      take: 5,
      include: {
        producto:        { select: { nombre: true } },
        sucursalOrigen:  { select: { nombre: true } },
        sucursalDestino: { select: { nombre: true } },
        usuario:         { select: { nombre: true, rol: true } },
      },
    }),
    prisma.movimiento.findMany({
      where: { ...movWhere, creadoEn: { gte: sevenDaysAgo } },
      select: { creadoEn: true },
    }),
    prisma.producto.findMany({
      where: { empresaId, activo: true, creadoEn: { gte: sevenDaysAgo } },
      select: { creadoEn: true },
    }),
  ]);

  // ── Aggregate stock by product (general — for KPI alert card) ──────────────
  const prodMapGeneral = new Map<string, { nombre: string; stockMinimo: number; total: number }>();
  for (const s of lineasStock) {
    const entry = prodMapGeneral.get(s.productoId);
    if (entry) entry.total += Number(s.cantidad);
    else prodMapGeneral.set(s.productoId, {
      nombre: s.producto.nombre,
      stockMinimo: Number(s.producto.stockMinimo),
      total: Number(s.cantidad),
    });
  }
  const bajosGeneral = [...prodMapGeneral.values()].filter((p) => p.total <= p.stockMinimo);

  // ── Aggregate stock filtered by sucursal (for the panel) ──────────────────
  const lineasParaPanel = sucursalFiltro
    ? lineasStock.filter((s) => s.sucursalId === sucursalFiltro)
    : lineasStock;

  const prodMapPanel = new Map<string, { nombre: string; stockMinimo: number; total: number }>();
  for (const s of lineasParaPanel) {
    const entry = prodMapPanel.get(s.productoId);
    if (entry) entry.total += Number(s.cantidad);
    else prodMapPanel.set(s.productoId, {
      nombre: s.producto.nombre,
      stockMinimo: Number(s.producto.stockMinimo),
      total: Number(s.cantidad),
    });
  }
  const bajosFiltrados = [...prodMapPanel.values()]
    .filter((p) => p.total <= p.stockMinimo)
    .sort((a, b) => a.total / Math.max(a.stockMinimo, 1) - b.total / Math.max(b.stockMinimo, 1));

  // ── Stock per branch ────────────────────────────────────────────────────────
  const stockPorSucursal = sucursalesList.map((suc) => ({
    nombre: suc.nombre,
    total: lineasStock
      .filter((s) => s.sucursalId === suc.id)
      .reduce((sum, s) => sum + Number(s.cantidad), 0),
  }));

  // ── Sparkline data ─────────────────────────────────────────────────────────
  const movsSparkData      = groupByDay(movsLast7);
  const productosSparkData = groupByDay(productosLast7);
  const sucursalesFlat     = new Array(7).fill(sucursalesList.length);
  // Línea plana con el valor actual — no tenemos historial de alertas todavía.
  const alertasData = new Array(7).fill(bajosGeneral.length);

  const movsEstaSemanana      = movsLast7.length;
  const productosEstaSemanana = productosLast7.length;

  const sucursalNombre = sucursalEfectiva
    ? sucursalesList.find((s) => s.id === sucursalEfectiva)?.nombre
    : null;

  // ADMIN, ENCARGADO y VENDEDOR con múltiples sucursales pueden elegir cuál ver
  const mostrarSelectorSucursal =
    sucursalesList.length > 1 &&
    (user.rol === "ADMIN" || misIds.length > 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-0.5 text-sm text-fade">Resumen general del negocio</p>
      </header>

      {/* KPI Cards — always general */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          titulo="Productos"
          valor={productosCount}
          href="/app/productos"
          iconBg="bg-neon/20"
          iconColor="#8b5cf6"
          icon="box"
          sparkPath={buildSparkPath(productosSparkData)}
          sparkColor="#8b5cf6"
          subLabel={productosEstaSemanana > 0 ? `+${productosEstaSemanana} esta semana` : "activos"}
        />
        <KpiCard
          titulo="Sucursales"
          valor={sucursalesList.length}
          href="/app/sucursales"
          iconBg="bg-info/20"
          iconColor="#58a6ff"
          icon="building"
          sparkPath={buildSparkPath(sucursalesFlat)}
          sparkColor="#58a6ff"
          subLabel="activas"
        />
        <KpiCard
          titulo="Movimientos"
          valor={movimientosCount}
          href="/app/movimientos"
          iconBg="bg-success/20"
          iconColor="#3fb950"
          icon="arrows"
          sparkPath={buildSparkPath(movsSparkData)}
          sparkColor="#3fb950"
          subLabel={`${movsEstaSemanana} esta semana`}
        />
        <KpiCard
          titulo="Alertas stock"
          valor={bajosGeneral.length}
          iconBg={bajosGeneral.length > 0 ? "bg-warn/20" : "bg-success/20"}
          iconColor={bajosGeneral.length > 0 ? "#e3b341" : "#3fb950"}
          icon="alert"
          sparkPath={buildSparkPath(alertasData)}
          sparkColor={bajosGeneral.length > 0 ? "#e3b341" : "#3fb950"}
          alerta={bajosGeneral.length > 0}
        />
      </div>

      {/* Mis sucursales — hero section for ENCARGADO and VENDEDOR */}
      {user.rol !== "ADMIN" && sucursalesList.length > 0 && (
        <div className="rounded-xl border border-rail bg-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-semibold text-ink">Mis sucursales</h2>
            <span className="rounded-full bg-neon/10 px-2 py-0.5 text-xs font-medium text-neon">
              {sucursalesList.length}
            </span>
          </div>
          <div className={`grid gap-3 ${sucursalesList.length === 1 ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {sucursalesList.map((suc, i) => {
              const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
              const total = stockPorSucursal.find((s) => s.nombre === suc.nombre)?.total ?? 0;
              return (
                <div
                  key={suc.id}
                  className="relative overflow-hidden rounded-xl border p-5"
                  style={{ borderColor: c.border }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.04]"
                    style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                  />
                  <div className="relative flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: c.iconBg }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fade">{suc.nombre}</p>
                      <p className="text-5xl font-black leading-none" style={{ color: c.accent }}>
                        {total}
                      </p>
                      <p className="mt-1 text-xs text-fade">unidades en stock</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Branch filter bar — visible para ADMIN y ENCARGADO con múltiples sucursales */}
      {mostrarSelectorSucursal && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rail bg-panel px-5 py-3">
          <p className="text-xs font-medium text-fade">
            {sucursalNombre ? `Mostrando: ${sucursalNombre}` : "Detalle de todas las sucursales"}
          </p>
          <SucursalSelector sucursales={sucursalesList} current={sucursalEfectiva ?? ""} />
        </div>
      )}

      {/* Mid section: low stock + recent movements */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Productos con stock bajo */}
        <div className="rounded-xl border border-rail bg-panel">
          <div className="flex items-center justify-between border-b border-rail px-5 py-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e3b341" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h2 className="font-semibold text-ink">Productos con stock bajo</h2>
            </div>
            <Link href="/app/stock" className="text-xs font-medium text-neon hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-rail">
            {bajosFiltrados.slice(0, 5).map((p) => {
              const critico = p.total <= p.stockMinimo * 0.3;
              return (
                <div key={p.nombre} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${critico ? "bg-danger/15 text-danger" : "bg-warn/15 text-warn"}`}>
                    {p.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{p.nombre}</p>
                    <p className={`text-xs ${critico ? "text-danger" : "text-warn"}`}>
                      Stock actual: {p.total}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-fade">Mín: {p.stockMinimo}</p>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${critico ? "bg-danger/15 text-danger" : "bg-warn/15 text-warn"}`}>
                    {critico ? "Crítico" : "Bajo"}
                  </span>
                  <Link
                    href="/app/movimientos"
                    className="shrink-0 rounded-lg bg-neon/10 px-3 py-1.5 text-xs font-medium text-neon transition-colors hover:bg-neon/20"
                  >
                    Reponer
                  </Link>
                </div>
              );
            })}
            {bajosFiltrados.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-fade">
                Todo el stock está en orden ✓
              </p>
            )}
          </div>
        </div>

        {/* Últimos movimientos */}
        <div className="rounded-xl border border-rail bg-panel">
          <div className="flex items-center justify-between border-b border-rail px-5 py-4">
            <h2 className="font-semibold text-ink">Últimos movimientos</h2>
            <Link href="/app/movimientos" className="text-xs font-medium text-neon hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-rail">
            {movimientosRecientes.map((m) => {
              const style = TIPO_STYLE[m.tipo] ?? { bg: "bg-ghost/15", text: "text-fade" };
              const signo = m.tipo === "ENTRADA" ? "+" : m.tipo === "SALIDA" ? "-" : "";
              const sucursal = m.sucursalDestino?.nombre ?? m.sucursalOrigen?.nombre ?? "—";
              const performerInicial = (m.usuario?.nombre ?? "?").charAt(0).toUpperCase();
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                    {m.tipo === "ENTRADA" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={style.text}>
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    ) : m.tipo === "SALIDA" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={style.text}>
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={style.text}>
                        <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{TIPO_LABEL[m.tipo]}</p>
                    <p className="text-xs text-fade">{sucursal}</p>
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-sm text-ink">{m.producto.nombre}</p>
                    <p className={`text-xs font-medium ${style.text}`}>
                      {signo}{Number(m.cantidad)} unidades
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-fade">{formatFecha(m.creadoEn)}</p>
                    <p className="text-[10px] text-ghost">{m.usuario?.nombre ?? "—"}</p>
                  </div>
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neon text-[11px] font-bold text-canvas"
                    title={m.usuario?.nombre ?? "desconocido"}
                  >
                    {performerInicial}
                  </div>
                </div>
              );
            })}
            {movimientosRecientes.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-fade">
                Sin movimientos{sucursalNombre ? ` en ${sucursalNombre}` : " todavía"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stock por sucursal — bar chart */}
      {stockPorSucursal.length > 0 && (
        <div className="rounded-xl border border-rail bg-panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">Stock por sucursal</h2>
              <p className="mt-0.5 text-xs text-fade">Unidades totales en cada depósito</p>
            </div>
            <Link href="/app/stock" className="text-xs font-medium text-neon hover:underline">
              Ver detalle →
            </Link>
          </div>
          <StockBarChart data={stockPorSucursal} />
        </div>
      )}

      {/* Empty state CTA */}
      {productosCount === 0 && (
        <div className="rounded-xl border border-dashed border-rail bg-panel p-8 text-center space-y-3">
          <p className="text-base font-semibold text-ink">Todavía no cargaste productos</p>
          <p className="text-sm text-fade">
            Empezá agregando tu catálogo para controlar el stock por sucursal.
          </p>
          <Link
            href="/app/productos"
            className="inline-block rounded-lg bg-neon/15 px-5 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25"
          >
            Cargar productos →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Stock Bar Chart ─────────────────────────────────────────────────────── */

function StockBarChart({ data }: { data: { nombre: string; total: number }[] }) {
  const totalGeneral = data.reduce((sum, d) => sum + d.total, 0);
  const displayData = data.map((d) => ({ ...d, display: Math.max(d.total, 0) }));
  const maxVal = Math.max(...displayData.map((d) => d.display), 1);

  const H = 180;
  const chartW = 520;
  const labelPad = 42;
  const innerW = chartW - labelPad;
  const nBars = data.length;
  const slotW = nBars > 0 ? innerW / nBars : innerW;
  const barW = Math.min(slotW * 0.55, 90);

  const tickStep = Math.max(Math.ceil(maxVal / 4), 1);
  const ticks = [0, tickStep, tickStep * 2, tickStep * 3, tickStep * 4].filter(
    (t) => t <= maxVal + tickStep,
  );

  return (
    <div>
      {/* Branch summary cards */}
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {data.map((d, i) => {
          const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
          return (
            <div
              key={d.nombre}
              className="flex items-center gap-3 rounded-xl border bg-canvas px-4 py-4"
              style={{ borderColor: c.border }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: c.iconBg }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-fade">{d.nombre}</p>
                <p className="mt-0.5 text-2xl font-bold text-ink">{d.total}</p>
                <p className="text-xs text-fade">unidades</p>
              </div>
            </div>
          );
        })}
        {/* Total general */}
        <div className="flex items-center gap-3 rounded-xl border border-neon/20 bg-canvas px-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-fade">Total general</p>
            <p className="mt-0.5 text-2xl font-bold text-neon">{totalGeneral}</p>
            <p className="text-xs text-fade">unidades</p>
          </div>
        </div>
      </div>

      {/* Y-axis label */}
      <p className="mb-1 text-xs text-fade">Unidades</p>

      {/* SVG chart */}
      <svg viewBox={`0 0 ${chartW} ${H + 46}`} className="w-full">
        <defs>
          {displayData.map((d, i) => {
            const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
            return (
              <linearGradient key={d.nombre} id={`bgrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.from} stopOpacity="0.9" />
                <stop offset="100%" stopColor={c.to} stopOpacity="0.55" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Grid lines */}
        {ticks.map((tick) => {
          const y = H - (tick / maxVal) * H;
          return (
            <g key={tick}>
              <line x1={labelPad} y1={y} x2={chartW} y2={y} stroke="#21262d" strokeWidth="1" strokeDasharray={tick === 0 ? "0" : "4 3"} />
              <text x={labelPad - 6} y={y + 4} fill="#484f58" fontSize="10" textAnchor="end">{tick}</text>
            </g>
          );
        })}

        {/* Bars */}
        {displayData.map((d, i) => {
          const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
          const barH = d.display > 0 ? Math.max((d.display / maxVal) * H, 6) : 0;
          const cx = labelPad + slotW * i + slotW / 2;
          const x = cx - barW / 2;
          const y = H - barH;

          return (
            <g key={d.nombre}>
              {barH > 0 && (
                <rect x={x} y={y} width={barW} height={barH} rx="6" fill={`url(#bgrad-${i})`} />
              )}
              <text x={cx} y={barH > 0 ? y - 8 : H - 14} fill={c.accent} fontSize="15" fontWeight="700" textAnchor="middle">
                {d.total}
              </text>
              <text x={cx} y={H + 18} fill="#8b949e" fontSize="11" textAnchor="middle">
                {d.nombre.length > 14 ? d.nombre.slice(0, 13) + "…" : d.nombre}
              </text>
              <circle cx={cx} cy={H + 32} r="3.5" fill={c.accent} />
            </g>
          );
        })}

        <line x1={labelPad} y1={H} x2={chartW} y2={H} stroke="#21262d" strokeWidth="1" />
      </svg>

      {/* Footer info */}
      <div className="mt-4 flex items-center gap-2 text-xs text-fade">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>Los valores representan las unidades totales disponibles en cada sucursal.</span>
      </div>
    </div>
  );
}

/* ── KPI Card ──────────────────────────────────────────────────────────────── */

function KpiCard({
  titulo,
  valor,
  href,
  iconBg,
  iconColor,
  icon,
  sparkPath,
  sparkColor,
  alerta,
  subLabel,
}: {
  titulo: string;
  valor: number;
  href?: string;
  iconBg: string;
  iconColor: string;
  icon: "box" | "building" | "arrows" | "alert";
  sparkPath: string;
  sparkColor: string;
  alerta?: boolean;
  subLabel?: string;
}) {
  const inner = (
    <div className={`rounded-xl border bg-panel p-5 transition-colors hover:border-neon/30 ${alerta && valor > 0 ? "border-warn/40" : "border-rail"}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <KpiIcon name={icon} color={iconColor} />
        </div>
      </div>
      <p className="text-sm text-fade">{titulo}</p>
      <p className={`mt-0.5 text-3xl font-bold ${alerta && valor > 0 ? "text-warn" : "text-ink"}`}>
        {valor.toLocaleString("es-AR")}
      </p>
      {alerta && valor > 0 ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-warn">
          <span>⚠</span> Requieren atención
        </p>
      ) : (
        <p className="mt-1 text-xs text-fade">{subLabel ?? "activos"}</p>
      )}
      <div className="mt-4 h-10">
        <svg viewBox="0 0 120 40" className="h-full w-full" preserveAspectRatio="none">
          <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.5" opacity="0.7" />
        </svg>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function KpiIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case "box":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
        </svg>
      );
    case "building":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
        </svg>
      );
    case "arrows":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
        </svg>
      );
    case "alert":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return null;
  }
}
