"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { eliminarProducto } from "../productos/actions";

export type StockProducto = {
  id: string;
  nombre: string;
  sku: string;
  stockMinimo: number;
  stockPorSucursal: { sucursalId: string; cantidad: number }[];
};

export type Sucursal = {
  id: string;
  nombre: string;
};

// 8 distinct icons — hash of product name picks one
const ICON_VARIANTS = [
  {
    bg: "bg-neon/15",
    color: "text-neon",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
      </svg>
    ),
  },
  {
    bg: "bg-info/15",
    color: "text-info",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    bg: "bg-success/15",
    color: "text-success",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    bg: "bg-warn/15",
    color: "text-warn",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    bg: "bg-danger/15",
    color: "text-danger",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    bg: "bg-purple-400/15",
    color: "text-purple-400",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
  },
  {
    bg: "bg-sky-400/15",
    color: "text-sky-400",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    bg: "bg-emerald-400/15",
    color: "text-emerald-400",
    renderIcon: () => (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

function getIconVariant(nombre: string) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) & 0xffff;
  }
  return ICON_VARIANTS[hash % ICON_VARIANTS.length];
}

const POR_PAGINA = 10;

export function InventarioCliente({
  productos,
  columnas,
  todasSucursales,
  sucursalFiltro,
  esAdmin,
  puedeFiltraSucursal,
}: {
  productos: StockProducto[];
  columnas: Sucursal[];
  todasSucursales: Sucursal[];
  sucursalFiltro: string | undefined;
  esAdmin: boolean;
  puedeFiltraSucursal: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [alertaCerrada, setAlertaCerrada] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const sucursalEfectiva = sucursalFiltro ?? null;
  const mostrarTotal = !sucursalEfectiva && columnas.length > 1;

  // Close action menus on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuOpen) return;
      const el = menuRefs.current.get(menuOpen);
      if (el && !el.contains(e.target as Node)) setMenuOpen(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Stats computed from full product list
  const totalUnidades = useMemo(
    () =>
      productos.reduce(
        (acc, p) =>
          acc +
          (sucursalEfectiva
            ? (p.stockPorSucursal.find((s) => s.sucursalId === sucursalEfectiva)?.cantidad ?? 0)
            : p.stockPorSucursal.reduce((a, s) => a + s.cantidad, 0)),
        0,
      ),
    [productos, sucursalEfectiva],
  );

  const bajoStockCount = useMemo(
    () =>
      productos.filter((p) => {
        const total = sucursalEfectiva
          ? (p.stockPorSucursal.find((s) => s.sucursalId === sucursalEfectiva)?.cantidad ?? 0)
          : p.stockPorSucursal.reduce((a, s) => a + s.cantidad, 0);
        return total <= p.stockMinimo;
      }).length,
    [productos, sucursalEfectiva],
  );

  // Client-side search filter
  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return productos;
    const q = busqueda.toLowerCase();
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }, [productos, busqueda]);

  // Pagination
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const slice = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const pageNums = useMemo(() => {
    if (totalPaginas <= 5) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const start =
      paginaActual <= 3 ? 1
      : paginaActual >= totalPaginas - 2 ? totalPaginas - 4
      : paginaActual - 2;
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [totalPaginas, paginaActual]);

  function handleBusqueda(v: string) {
    setBusqueda(v);
    setPagina(1);
  }

  function handleSucursal(id: string) {
    router.push(id ? `${pathname}?sucursal=${encodeURIComponent(id)}` : pathname);
  }

  function exportCSV() {
    const headers = [
      "SKU",
      "Nombre",
      ...columnas.map((s) => s.nombre),
      ...(mostrarTotal ? ["Total"] : []),
      "Estado",
    ];
    const rows = filtrados.map((p) => {
      const porSuc = new Map(p.stockPorSucursal.map((s) => [s.sucursalId, s.cantidad]));
      const total = sucursalEfectiva
        ? (porSuc.get(sucursalEfectiva) ?? 0)
        : [...porSuc.values()].reduce((a, b) => a + b, 0);
      const bajo = total <= p.stockMinimo;
      return [
        p.sku,
        `"${p.nombre.replace(/"/g, '""')}"`,
        ...columnas.map((s) => porSuc.get(s.id) ?? 0),
        ...(mostrarTotal ? [total] : []),
        total === 0 ? "Sin stock" : bajo ? "Bajo mínimo" : "Stock OK",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const colSpanTotal =
    1 + columnas.length + (mostrarTotal ? 1 : 0) + 1 + (esAdmin ? 1 : 0);

  return (
    <div className="space-y-5">

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-rail bg-panel px-5 py-4 card-hover animate-fade-in-up">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neon/15">
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info/15">
            <svg className="h-5 w-5 text-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-fade">Unidades en stock</p>
            <p className="text-2xl font-bold text-ink">{totalUnidades.toLocaleString("es-AR")}</p>
          </div>
        </div>

        <div
          className={`flex items-center gap-4 rounded-2xl border bg-panel px-5 py-4 card-hover animate-fade-in-up delay-200 ${
            bajoStockCount > 0 ? "border-warn/30" : "border-rail"
          }`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              bajoStockCount > 0 ? "bg-warn/15" : "bg-success/15"
            }`}
          >
            <svg
              className={`h-5 w-5 ${bajoStockCount > 0 ? "text-warn" : "text-success"}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-fade">Bajo stock mínimo</p>
            <p className={`text-2xl font-bold ${bajoStockCount > 0 ? "text-warn" : "text-ink"}`}>
              {bajoStockCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sucursal filter pills ── */}
      {puedeFiltraSucursal && todasSucursales.length > 1 && (
        <div className="animate-fade-in-up delay-200 flex flex-wrap items-center gap-2 rounded-2xl border border-rail bg-panel px-5 py-4">
          <span className="mr-1 text-xs font-medium text-fade">Sucursal:</span>
          <button
            onClick={() => handleSucursal("")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              !sucursalEfectiva
                ? "bg-neon text-white shadow-sm shadow-neon/20"
                : "bg-panel2 text-fade hover:text-ink"
            }`}
          >
            Todas
          </button>
          {todasSucursales.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSucursal(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                sucursalEfectiva === s.id
                  ? "bg-neon text-white shadow-sm shadow-neon/20"
                  : "bg-panel2 text-fade hover:text-ink"
              }`}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}

      {/* ── Alert banner ── */}
      {!alertaCerrada && bajoStockCount > 0 && (
        <div className="animate-slide-in-right flex items-start gap-3 rounded-2xl border border-warn/25 bg-warn/8 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warn/20">
            <svg className="h-4 w-4 text-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-warn">
              {bajoStockCount === 1
                ? "1 producto está por debajo del stock mínimo"
                : `${bajoStockCount} productos están por debajo del stock mínimo`}
            </p>
            <p className="mt-0.5 text-xs text-fade">
              Los productos marcados en amarillo o rojo necesitan reposición.
            </p>
          </div>
          <button
            onClick={() => setAlertaCerrada(true)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ghost transition-colors hover:text-ink"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="overflow-hidden rounded-2xl border border-rail bg-panel animate-fade-in-up delay-300">

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-rail px-4 py-3">
          <div className="relative max-w-xs flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ghost"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              placeholder="Buscar producto o SKU..."
              className="w-full rounded-xl border border-rail bg-panel2 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ghost"
            />
          </div>
          {busqueda && (
            <button
              onClick={() => handleBusqueda("")}
              className="text-xs text-fade transition-colors hover:text-ink"
            >
              Limpiar
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={exportCSV}
              title="Exportar CSV"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-rail bg-panel2 text-fade transition-all hover:border-neon/30 hover:bg-panel hover:text-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile card list */}
        <div className="divide-y divide-rail/40 sm:hidden">
          {slice.map((p) => {
            const porSuc = new Map(p.stockPorSucursal.map((s) => [s.sucursalId, s.cantidad]));
            const total = sucursalEfectiva
              ? (porSuc.get(sucursalEfectiva) ?? 0)
              : [...porSuc.values()].reduce((a, b) => a + b, 0);
            const sinStock = total === 0;
            const bajo = !sinStock && total <= p.stockMinimo;
            const variant = getIconVariant(p.nombre);

            return (
              <div key={p.id} className={`px-4 py-3.5 ${sinStock ? "bg-danger/[0.03]" : bajo ? "bg-warn/[0.03]" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${variant.bg} ${variant.color}`}>
                    {variant.renderIcon()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold ${sinStock ? "text-danger" : bajo ? "text-warn" : "text-ink"}`}>
                      {p.nombre}
                    </p>
                    <p className="font-mono text-[11px] text-ghost">SKU: {p.sku}</p>
                  </div>
                  {sinStock ? (
                    <span className="shrink-0 rounded-full bg-danger/15 px-2 py-1 text-[10px] font-semibold text-danger">Sin stock</span>
                  ) : bajo ? (
                    <span className="shrink-0 rounded-full bg-warn/15 px-2 py-1 text-[10px] font-semibold text-warn">Bajo</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-success/15 px-2 py-1 text-[10px] font-semibold text-success">OK</span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 pl-12 text-xs">
                  {columnas.map((s) => {
                    const qty = porSuc.get(s.id) ?? 0;
                    return (
                      <span key={s.id} className="text-fade">
                        {s.nombre}: <span className={qty <= 0 ? "font-semibold text-danger" : "text-ink"}>{qty}u</span>
                      </span>
                    );
                  })}
                  {mostrarTotal && (
                    <span className="font-semibold text-fade">
                      Total: <span className={sinStock ? "text-danger" : bajo ? "text-warn" : "text-ink"}>{total}u</span>
                    </span>
                  )}
                </div>

                {esAdmin && (
                  <div className="mt-2.5 pl-12">
                    <form action={eliminarProducto}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        onClick={(e) => {
                          if (!confirm(`¿Eliminar "${p.nombre}"? Se borrarán sus movimientos y stock.`)) e.preventDefault();
                        }}
                        className="text-xs font-medium text-danger"
                      >
                        Eliminar producto
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}

          {filtrados.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel2">
                <svg className="h-7 w-7 text-ghost" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p className="text-sm text-fade">
                {busqueda ? `Sin resultados para "${busqueda}"` : "No hay productos con stock en esta sucursal"}
              </p>
              {busqueda && (
                <button onClick={() => handleBusqueda("")} className="text-xs text-neon underline underline-offset-2">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rail bg-panel2/40">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-fade">
                  Producto
                </th>
                {columnas.map((s) => (
                  <th
                    key={s.id}
                    className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-fade"
                  >
                    {s.nombre}
                  </th>
                ))}
                {mostrarTotal && (
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-fade">
                    Total
                  </th>
                )}
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-fade">
                  Estado
                </th>
                {esAdmin && (
                  <th className="w-12 px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-fade">
                    Acción
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {slice.map((p, i) => {
                const porSuc = new Map(p.stockPorSucursal.map((s) => [s.sucursalId, s.cantidad]));
                const total = sucursalEfectiva
                  ? (porSuc.get(sucursalEfectiva) ?? 0)
                  : [...porSuc.values()].reduce((a, b) => a + b, 0);
                const sinStock = total === 0;
                const bajo = !sinStock && total <= p.stockMinimo;
                const variant = getIconVariant(p.nombre);

                return (
                  <tr
                    key={p.id}
                    className={`border-b border-rail/40 transition-colors hover:bg-panel2/50 animate-fade-in-up ${
                      sinStock ? "bg-danger/[0.03]" : bajo ? "bg-warn/[0.03]" : ""
                    }`}
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                  >
                    {/* Product + icon */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${variant.bg} ${variant.color}`}
                        >
                          {variant.renderIcon()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`truncate font-semibold ${
                              sinStock ? "text-danger" : bajo ? "text-warn" : "text-ink"
                            }`}
                          >
                            {p.nombre}
                          </p>
                          <p className="font-mono text-[11px] text-ghost">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Per-branch stock */}
                    {columnas.map((s) => {
                      const qty = porSuc.get(s.id) ?? 0;
                      return (
                        <td key={s.id} className="px-5 py-4 text-right">
                          <span className={qty <= 0 ? "font-semibold text-danger" : "text-ink"}>
                            {qty}
                          </span>
                          <span className="ml-0.5 text-xs text-ghost">u</span>
                        </td>
                      );
                    })}

                    {/* Total */}
                    {mostrarTotal && (
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`font-bold ${
                            sinStock ? "text-danger" : bajo ? "text-warn" : "text-ink"
                          }`}
                        >
                          {total}
                        </span>
                        <span className="ml-0.5 text-xs text-ghost">u</span>
                      </td>
                    )}

                    {/* Status badge */}
                    <td className="px-5 py-4 text-center">
                      {sinStock ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-2.5 py-1 text-xs font-semibold text-danger">
                          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                          Sin stock
                        </span>
                      ) : bajo ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-2.5 py-1 text-xs font-semibold text-warn">
                          <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                          Bajo mínimo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                          Stock OK
                        </span>
                      )}
                    </td>

                    {/* Admin action menu */}
                    {esAdmin && (
                      <td className="px-3 py-4 text-right">
                        <div
                          className="relative inline-block"
                          ref={(el) => {
                            if (el) menuRefs.current.set(p.id, el);
                            else menuRefs.current.delete(p.id);
                          }}
                        >
                          <button
                            onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ghost transition-all hover:bg-panel2 hover:text-ink"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>

                          {menuOpen === p.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-rail bg-panel shadow-2xl animate-scale-in">
                              <form action={eliminarProducto}>
                                <input type="hidden" name="id" value={p.id} />
                                <button
                                  type="submit"
                                  onClick={(e) => {
                                    if (
                                      !confirm(
                                        `¿Eliminar "${p.nombre}"? Se borrarán sus movimientos y stock.`,
                                      )
                                    )
                                      e.preventDefault();
                                    setMenuOpen(null);
                                  }}
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                                >
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                  </svg>
                                  Eliminar producto
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={colSpanTotal} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel2">
                        <svg className="h-7 w-7 text-ghost" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                      </div>
                      <p className="text-sm text-fade">
                        {busqueda
                          ? `Sin resultados para "${busqueda}"`
                          : "No hay productos con stock en esta sucursal"}
                      </p>
                      {busqueda && (
                        <button
                          onClick={() => handleBusqueda("")}
                          className="text-xs text-neon underline underline-offset-2"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtrados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rail px-5 py-3">
            <p className="text-xs text-fade">
              Mostrando{" "}
              <span className="font-medium text-ink">
                {(paginaActual - 1) * POR_PAGINA + 1}–
                {Math.min(paginaActual * POR_PAGINA, filtrados.length)}
              </span>{" "}
              de{" "}
              <span className="font-medium text-ink">{filtrados.length}</span>{" "}
              {filtrados.length === 1 ? "producto" : "productos"}
            </p>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-fade transition-colors hover:bg-panel2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                {pageNums.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPagina(n)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      n === paginaActual
                        ? "scale-105 bg-neon text-white"
                        : "text-fade hover:bg-panel2 hover:text-ink"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-fade transition-colors hover:bg-panel2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
