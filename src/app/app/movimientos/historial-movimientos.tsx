"use client";

import { useState, useMemo } from "react";
import { ConfirmButton } from "../confirm-button";
import { eliminarMovimiento } from "./actions";

const ETIQUETA: Record<string, string> = {
  ENTRADA: "ENTRADA",
  SALIDA: "SALIDA",
  TRANSFERENCIA: "TRANSFER",
  AJUSTE: "AJUSTE",
};

const ETIQUETA_COLOR: Record<string, string> = {
  ENTRADA: "bg-success/15 text-success border border-success/20",
  SALIDA: "bg-danger/15 text-danger border border-danger/20",
  TRANSFERENCIA: "bg-warn/15 text-warn border border-warn/20",
  AJUSTE: "bg-ghost/15 text-fade border border-ghost/20",
};

const TIPOS = ["ALL", "ENTRADA", "SALIDA", "TRANSFERENCIA", "AJUSTE"] as const;
const TIPO_LABEL: Record<string, string> = {
  ALL:           "Todos",
  ENTRADA:       "Entrada",
  SALIDA:        "Salida",
  TRANSFERENCIA: "Transferencia",
  AJUSTE:        "Ajuste",
};
const TIPO_CHIP_COLOR: Record<string, string> = {
  ALL:           "border-neon/40 bg-neon/10 text-neon",
  ENTRADA:       "border-success/40 bg-success/10 text-success",
  SALIDA:        "border-danger/40 bg-danger/10 text-danger",
  TRANSFERENCIA: "border-warn/40 bg-warn/10 text-warn",
  AJUSTE:        "border-ghost/40 bg-ghost/10 text-fade",
};

export type MovimientoSerial = {
  id: string;
  tipo: string;
  cantidad: number;
  creadoEn: string;
  motivo: string | null;
  producto: { nombre: string };
  sucursalOrigen: { nombre: string } | null;
  sucursalDestino: { nombre: string } | null;
  usuario: { nombre: string | null } | null;
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

export function HistorialMovimientos({
  movimientos,
  esVendedor,
  esAdmin,
  sucursalNombre,
}: {
  movimientos: MovimientoSerial[];
  esVendedor: boolean;
  esAdmin: boolean;
  sucursalNombre: string | null;
}) {
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("ALL");

  const filtrados = useMemo(() => {
    let result = movimientos;
    if (tipoFiltro !== "ALL") {
      result = result.filter((m) => m.tipo === tipoFiltro);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.producto.nombre.toLowerCase().includes(q) ||
          m.usuario?.nombre?.toLowerCase().includes(q) ||
          m.motivo?.toLowerCase().includes(q) ||
          m.sucursalOrigen?.nombre.toLowerCase().includes(q) ||
          m.sucursalDestino?.nombre.toLowerCase().includes(q)
      );
    }
    return result;
  }, [movimientos, search, tipoFiltro]);

  const entradas = movimientos.filter((m) => m.tipo === "ENTRADA").length;
  const salidas = movimientos.filter((m) => m.tipo === "SALIDA").length;
  const transferencias = movimientos.filter((m) => m.tipo === "TRANSFERENCIA").length;
  const total = movimientos.length;

  return (
    <>
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
            {total > 0 && (
              <span className="rounded-full border border-rail bg-panel2 px-2 py-0.5 text-[10px] font-medium text-fade">
                {total}
              </span>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Search */}
            <label className="relative flex items-center">
              <svg className="pointer-events-none absolute left-3" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar movimiento..."
                className="w-48 rounded-lg border border-rail bg-panel2 py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ghost transition-colors focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon/20"
              />
            </label>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoFiltro(t)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                    tipoFiltro === t
                      ? TIPO_CHIP_COLOR[t]
                      : "border-rail bg-panel2 text-fade hover:border-rail/70 hover:text-ink"
                  }`}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="max-h-[480px] overflow-y-auto">
          {filtrados.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 z-[1] border-b border-rail bg-panel2/95 backdrop-blur-sm">
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
                {filtrados.map((m) => (
                  <tr key={m.id} className="group transition-colors duration-150 hover:bg-panel2/70">
                    <td className="px-5 py-3.5 text-xs text-fade">
                      {new Date(m.creadoEn).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ETIQUETA_COLOR[m.tipo] ?? "bg-ghost/15 text-fade border border-ghost/20"}`}>
                        {ETIQUETA[m.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">{m.producto.nombre}</td>
                    <td className="px-5 py-3.5 font-bold text-success">{m.cantidad}</td>
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
          )}

          {/* Empty state: no movements at all */}
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
                {sucursalNombre ? `Sin movimientos en ${sucursalNombre}` : "No hay movimientos registrados"}
              </h3>
              <p className="mb-5 text-xs text-fade">Los movimientos que registres aparecerán aquí.</p>
              <a
                href="#mov-form"
                className="rounded-lg border border-neon/30 bg-neon/10 px-5 py-2.5 text-sm font-medium text-neon transition-colors hover:border-neon/50 hover:bg-neon/20"
              >
                Registrar tu primer movimiento
              </a>
            </div>
          )}

          {/* Empty state: no results for current filter/search */}
          {movimientos.length > 0 && filtrados.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <p className="mb-3 text-sm text-fade">Sin resultados para tu búsqueda</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setTipoFiltro("ALL"); }}
                className="text-xs font-medium text-neon underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
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
          sub="Registrados"
        />
      </div>
    </>
  );
}
