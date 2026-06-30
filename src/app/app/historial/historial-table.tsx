"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";

const TIPO_LABEL: Record<string, string> = {
  ENTRADA:       "Entrada",
  SALIDA:        "Salida",
  TRANSFERENCIA: "Transferencia",
  AJUSTE:        "Ajuste",
};

const TIPO_COLOR: Record<string, string> = {
  ENTRADA:       "bg-success/15 text-success",
  SALIDA:        "bg-danger/15 text-danger",
  TRANSFERENCIA: "bg-warn/15 text-warn",
  AJUSTE:        "bg-ghost/15 text-fade",
};

const TIPO_FILTERS = [
  { value: "ALL",           label: "Todos los tipos" },
  { value: "ENTRADA",       label: "Entradas" },
  { value: "SALIDA",        label: "Salidas" },
  { value: "TRANSFERENCIA", label: "Transferencias" },
  { value: "AJUSTE",        label: "Ajustes" },
];

export type TableRow = {
  id: string;
  fecha: string;
  hora: string;
  tipo: string;
  producto: string;
  cantidad: number;
  usuarioNombre: string | null;
  usuarioRol: string | null;
  usuarioInicial: string | null;
  detalle: string;
};

const PAGE_SIZE = 20;

export function HistorialTable({ rows }: { rows: TableRow[] }) {
  const [search, setSearch]         = useState("");
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [page, setPage]             = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef                   = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function onDown(e: MouseEvent) {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (tipoFilter !== "ALL" && r.tipo !== tipoFilter) return false;
      if (!q) return true;
      return (
        r.producto.toLowerCase().includes(q) ||
        (r.usuarioNombre?.toLowerCase().includes(q) ?? false) ||
        r.detalle.toLowerCase().includes(q) ||
        (TIPO_LABEL[r.tipo]?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, search, tipoFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows    = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v);      setPage(1); }
  function handleTipo(v: string)   { setTipoFilter(v);  setPage(1); setFilterOpen(false); }

  const activeFilter = TIPO_FILTERS.find((f) => f.value === tipoFilter) ?? TIPO_FILTERS[0];

  return (
    <div className="overflow-hidden rounded-xl border border-rail bg-panel animate-fade-in-up delay-200">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rail px-5 py-4">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18" />
          </svg>
          <h2 className="font-semibold text-ink">Actividad registrada</h2>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <svg className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar movimiento..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-rail bg-panel2 py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-ghost transition-colors focus:border-neon/40 sm:w-52"
            />
          </div>

          {/* Filter dropdown */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                tipoFilter !== "ALL"
                  ? "border-neon/40 bg-neon/10 text-neon"
                  : "border-rail text-fade hover:border-neon/30 hover:text-ink"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {tipoFilter !== "ALL" ? activeFilter.label : "Filtros"}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[176px] animate-scale-in rounded-xl border border-rail bg-panel2 p-1 shadow-xl">
                {TIPO_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleTipo(f.value)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      tipoFilter === f.value
                        ? "bg-neon/15 text-neon"
                        : "text-fade hover:bg-panel hover:text-ink"
                    }`}
                  >
                    {tipoFilter === f.value && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span className={tipoFilter === f.value ? "" : "ml-[20px]"}>{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile card list ── */}
      <div className="divide-y divide-rail sm:hidden">
        {pageRows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <EmptyState isEmpty={rows.length === 0} />
          </div>
        ) : (
          pageRows.map((m) => (
            <div key={m.id} className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIPO_COLOR[m.tipo] ?? "bg-ghost/15 text-fade"}`}>
                  {TIPO_LABEL[m.tipo] ?? m.tipo}
                </span>
                <span className="text-xs text-fade">
                  {m.fecha} <span className="text-ghost">{m.hora}</span>
                </span>
              </div>
              <p className="mt-2 font-medium text-ink">{m.producto}</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-xs text-fade">{m.detalle || "—"}</p>
                <span className="shrink-0 font-bold text-ink">{m.cantidad}</span>
              </div>
              {m.usuarioNombre && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon/20 text-[10px] font-bold text-neon">
                    {m.usuarioInicial}
                  </div>
                  <p className="text-xs text-ink">{m.usuarioNombre}</p>
                  <p className="text-[10px] text-ghost">{m.usuarioRol}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Table ── */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-rail bg-panel2">
            {(["FECHA", "TIPO", "PRODUCTO", "CANT.", "REALIZADO POR", "DETALLE"] as const).map((h, i) => (
              <th
                key={h}
                className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-fade ${i === 3 ? "text-right" : "text-left"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rail">
          {pageRows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-16 text-center">
                <EmptyState isEmpty={rows.length === 0} />
              </td>
            </tr>
          ) : (
            pageRows.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-panel2">
                <td className="px-5 py-3 text-xs text-fade">
                  {m.fecha}{" "}
                  <span className="text-ghost">{m.hora}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIPO_COLOR[m.tipo] ?? "bg-ghost/15 text-fade"}`}>
                    {TIPO_LABEL[m.tipo] ?? m.tipo}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-ink">{m.producto}</td>
                <td className="px-5 py-3 text-right font-bold text-ink">{m.cantidad}</td>
                <td className="px-5 py-3">
                  {m.usuarioNombre ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon/20 text-[10px] font-bold text-neon">
                        {m.usuarioInicial}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink">{m.usuarioNombre}</p>
                        <p className="text-[10px] text-ghost">{m.usuarioRol}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-ghost">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-fade">{m.detalle || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-center gap-1.5 border-t border-rail px-5 py-3">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-rail text-fade transition-colors hover:border-neon/30 hover:text-ink disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors ${
              p === currentPage
                ? "border border-neon/40 bg-neon/20 font-medium text-neon"
                : "border border-rail text-fade hover:border-neon/30 hover:text-ink"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-rail text-fade transition-colors hover:border-neon/30 hover:text-ink disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ isEmpty }: { isEmpty: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Floating illustration */}
      <div className="relative animate-float">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <rect x="10" y="14" width="52" height="50" rx="7" fill="#8b5cf6" fillOpacity="0.12" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.35" />
          <rect x="24" y="8" width="24" height="12" rx="4" fill="#8b5cf6" fillOpacity="0.25" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.5" />
          <line x1="20" y1="32" x2="52" y2="32" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="20" y1="41" x2="46" y2="41" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="20" y1="50" x2="40" y2="50" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.45" />
          <circle cx="48" cy="52" r="12" fill="#8b5cf6" fillOpacity="0.15" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx="48" cy="52" r="7" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="53.5" y1="57.5" x2="58" y2="62" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
        </svg>
        <svg className="absolute -right-1 -top-2 animate-sparkle" width="14" height="14" viewBox="0 0 14 14" fill="#8b5cf6" fillOpacity="0.9">
          <path d="M7 0L8.5 5.5H14L9.5 8.5L11 14L7 11L3 14L4.5 8.5L0 5.5H5.5L7 0Z" />
        </svg>
        <svg className="absolute -left-2 bottom-0 animate-sparkle delay-300" width="10" height="10" viewBox="0 0 10 10" fill="#8b5cf6" fillOpacity="0.6">
          <path d="M5 0L6.2 3.8H10L7 6L8 10L5 7.5L2 10L3 6L0 3.8H3.8L5 0Z" />
        </svg>
      </div>

      <div>
        <p className="font-semibold text-ink">
          {isEmpty ? "Sin actividad registrada todavía" : "Sin resultados"}
        </p>
        <p className="mt-0.5 text-sm text-fade">
          {isEmpty
            ? "Los movimientos que registres aparecerán aquí."
            : "Intentá con otro término o filtro."}
        </p>
      </div>

      {isEmpty && (
        <Link
          href="/app/movimientos"
          className="animate-pulse-border flex items-center gap-1.5 rounded-lg border border-neon/30 px-4 py-2 text-sm font-medium text-neon transition-colors hover:bg-neon/10"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrar tu primer movimiento
        </Link>
      )}
    </div>
  );
}
