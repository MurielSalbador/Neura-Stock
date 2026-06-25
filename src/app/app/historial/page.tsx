import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DateFilter } from "./date-filter";
import { ExportButton, type ExportRow } from "./export-button";
import { HistorialTable, type TableRow } from "./historial-table";

const TIPO_LABEL: Record<string, string> = {
  ENTRADA:       "Entrada",
  SALIDA:        "Salida",
  TRANSFERENCIA: "Transferencia",
  AJUSTE:        "Ajuste",
};

const ROL_LABEL: Record<string, string> = {
  ADMIN:     "Admin",
  ENCARGADO: "Jefe",
  VENDEDOR:  "Vendedor",
};

/* ── Stat card definitions ── */
const STAT_CONFIG = [
  {
    tipo:    "TOTAL",
    label:   "Total registros",
    sub:     "Movimientos en total",
    iconBg:  "bg-neon/20",
    color:   "#8b5cf6",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    tipo:    "ENTRADA",
    label:   "Entradas",
    sub:     "Total ingresos",
    iconBg:  "bg-success/20",
    color:   "#3fb950",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    tipo:    "SALIDA",
    label:   "Salidas",
    sub:     "Total egresos",
    iconBg:  "bg-warn/20",
    color:   "#e3b341",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    tipo:    "TRANSFERENCIA",
    label:   "Transferencias",
    sub:     "Entre sucursales",
    iconBg:  "bg-info/20",
    color:   "#58a6ff",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    tipo:    "AJUSTE",
    label:   "Ajustes",
    sub:     "Ajustes de inventario",
    iconBg:  "bg-ghost/20",
    color:   "#8b949e",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
];

/* ── Donut chart (pure SVG, server-renderable) ── */
function DonutChart({
  data,
}: {
  data: { tipo: string; count: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const r     = 55;
  const cx    = 80;
  const cy    = 80;
  const circ  = 2 * Math.PI * r;

  let accumulated = 0;

  return (
    <svg viewBox="0 0 160 160" width="160" height="160" className="mx-auto">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1c2233" strokeWidth="18" />

      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth="18" />
      ) : (
        data.map((d) => {
          if (d.count === 0) return null;
          const portion = d.count / total;
          const dashLen = portion * circ;
          const rotDeg  = (accumulated / total) * 360;
          accumulated  += d.count;
          return (
            <circle
              key={d.tipo}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${dashLen} ${circ}`}
              strokeDashoffset={circ / 4}
              style={{
                transform:       `rotate(${rotDeg}deg)`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
          );
        })
      )}

      {/* Center label */}
      <text x={cx} y={cy - 9} textAnchor="middle" dominantBaseline="middle" fill="#e6edf3" fontSize="22" fontWeight="700" fontFamily="system-ui">
        {total}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" dominantBaseline="middle" fill="#8b949e" fontSize="11" fontFamily="system-ui">
        Total
      </text>
    </svg>
  );
}

/* ── Page ── */
export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const user = await requireUser();
  if (user.rol === "VENDEDOR") redirect("/app");

  const { rango = "30" } = await searchParams;
  const empresaId = user.empresaId;

  // Date range
  const dateCondition: { creadoEn?: { gte: Date } } = {};
  if (rango !== "all") {
    const days = parseInt(rango, 10);
    if (!isNaN(days)) {
      const desde = new Date();
      desde.setDate(desde.getDate() - days);
      dateCondition.creadoEn = { gte: desde };
    }
  }

  // Base where (scoped by role/sucursal)
  const baseWhere =
    user.rol === "ENCARGADO"
      ? user.sucursalId
        ? {
            empresaId,
            OR: [
              { sucursalOrigenId: user.sucursalId },
              { sucursalDestinoId: user.sucursalId },
            ],
          }
        : { empresaId, usuarioId: user.id }
      : { empresaId };

  const where = { ...baseWhere, ...dateCondition };

  const [movimientos, conteoPorTipo] = await Promise.all([
    prisma.movimiento.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      take: 200,
      include: {
        producto:        { select: { nombre: true } },
        sucursalOrigen:  { select: { nombre: true } },
        sucursalDestino: { select: { nombre: true } },
        usuario:         { select: { nombre: true, rol: true } },
      },
    }),
    prisma.movimiento.groupBy({
      by:    ["tipo"],
      where,
      _count: { tipo: true },
    }),
  ]);

  const totalMovimientos = conteoPorTipo.reduce((acc, c) => acc + c._count.tipo, 0);

  const countByTipo: Record<string, number> = {};
  for (const c of conteoPorTipo) countByTipo[c.tipo] = c._count.tipo;

  // Serialize for client components
  const tableRows: TableRow[] = movimientos.map((m) => ({
    id:             m.id,
    fecha:          m.creadoEn.toLocaleDateString("es-AR"),
    hora:           m.creadoEn.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    tipo:           m.tipo,
    producto:       m.producto.nombre,
    cantidad:       Number(m.cantidad),
    usuarioNombre:  m.usuario?.nombre ?? null,
    usuarioRol:     m.usuario ? (ROL_LABEL[m.usuario.rol] ?? m.usuario.rol) : null,
    usuarioInicial: m.usuario?.nombre ? m.usuario.nombre.charAt(0).toUpperCase() : null,
    detalle: [
      m.sucursalOrigen?.nombre  ? `desde ${m.sucursalOrigen.nombre}` : "",
      m.sucursalOrigen && m.sucursalDestino ? "→" : "",
      m.sucursalDestino?.nombre ?? "",
      m.motivo                  ? `· ${m.motivo}` : "",
    ].filter(Boolean).join(" ").trim(),
  }));

  const exportRows: ExportRow[] = tableRows.map((r) => ({
    fecha:    `${r.fecha} ${r.hora}`,
    tipo:     TIPO_LABEL[r.tipo] ?? r.tipo,
    producto: r.producto,
    cantidad: r.cantidad,
    usuario:  r.usuarioNombre ?? "—",
    rol:      r.usuarioRol     ?? "—",
    detalle:  r.detalle        || "—",
  }));

  const donutData = [
    { tipo: "ENTRADA",       label: "Entradas",        count: countByTipo["ENTRADA"]       ?? 0, color: "#3fb950" },
    { tipo: "SALIDA",        label: "Salidas",          count: countByTipo["SALIDA"]        ?? 0, color: "#e3b341" },
    { tipo: "TRANSFERENCIA", label: "Transferencias",   count: countByTipo["TRANSFERENCIA"] ?? 0, color: "#58a6ff" },
    { tipo: "AJUSTE",        label: "Ajustes",          count: countByTipo["AJUSTE"]        ?? 0, color: "#8b5cf6" },
  ];

  const stagger = ["", "delay-50", "delay-100", "delay-150", "delay-200"];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Historial de actividad</h1>
            <p className="text-xs text-fade">Todos los movimientos de la empresa</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <DateFilter current={rango} />
          <ExportButton data={exportRows} />
        </div>
      </div>

      {/* ── Stat cards — 5 in one row on xl, 2+3 on smaller ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        {STAT_CONFIG.map(({ tipo, label, sub, iconBg, color, icon }, i) => {
          const count = tipo === "TOTAL" ? totalMovimientos : (countByTipo[tipo] ?? 0);
          return (
            <div
              key={tipo}
              className={`card-hover flex items-center gap-3.5 rounded-xl border border-rail bg-panel p-4 animate-fade-in-up ${stagger[i]}`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                style={{ color }}
              >
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-tight text-ink">{count}</p>
                <p className="truncate text-xs font-medium text-ink">{label}</p>
                <p className="truncate text-[11px] text-fade">{sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table + Resumen rápido ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">

        {/* Table */}
        <div className="min-w-0 flex-1">
          <HistorialTable rows={tableRows} />
        </div>

        {/* Resumen rápido */}
        <div className="w-full shrink-0 lg:w-72 animate-slide-in-right delay-300">
          <div className="rounded-xl border border-rail bg-panel p-5">

            {/* Title */}
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/15">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-ink">Resumen rápido</h3>
            </div>

            {/* Donut */}
            <DonutChart data={donutData} />

            {/* Legend */}
            <div className="mt-5 space-y-3">
              {donutData.map((d) => {
                const pct = totalMovimientos > 0 ? Math.round((d.count / totalMovimientos) * 100) : 0;
                return (
                  <div key={d.tipo} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-fade">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-ink">{d.count}</span>
                      <span className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] font-medium text-ghost">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA — shows full history (removes date filter) */}
            <Link
              href="/app/historial?rango=all"
              className="mt-5 flex w-full items-center justify-between rounded-lg bg-neon/10 px-4 py-2.5 text-sm font-medium text-neon transition-colors hover:bg-neon/15"
            >
              Ver reporte detallado
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
