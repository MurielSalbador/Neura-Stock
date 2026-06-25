"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import { eliminarProducto, editarProducto, type ProductoState } from "./actions";

export type ProductoRow = {
  id: string;
  sku: string;
  nombre: string;
  codigoBarras: string | null;
  precioVenta: number;
  stockMinimo: number;
  stockTotal: number;
  stockPorSucursal: { sucursalId: string; cantidad: number }[];
};

type Sucursal = { id: string; nombre: string };

const POR_PAGINA = 10;

// ── Edit modal — separate component so useActionState resets on each open ──
function EditModal({
  producto,
  onClose,
}: {
  producto: ProductoRow;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(editarProducto, {} as ProductoState);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-scale-in w-full max-w-lg rounded-2xl border border-rail bg-panel p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon/15">
              <svg className="h-4 w-4 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-ink">Editar producto</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-fade transition-colors hover:bg-panel2 hover:text-ink"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {state.error && (
          <p className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
            {state.error}
          </p>
        )}

        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={producto.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fade">SKU / código</label>
              <input name="sku" defaultValue={producto.sku} required className="w-full rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fade">Nombre</label>
              <input name="nombre" defaultValue={producto.nombre} required className="w-full rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fade">Cód. de barras</label>
              <input name="codigoBarras" defaultValue={producto.codigoBarras ?? ""} placeholder="Opcional" className="w-full rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fade">Precio de venta</label>
              <input name="precioVenta" type="number" step="0.01" defaultValue={producto.precioVenta} required className="w-full rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-fade">Stock mínimo</label>
              <input name="stockMinimo" type="number" step="0.001" defaultValue={producto.stockMinimo} className="w-full rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-rail py-2.5 text-sm font-medium text-fade transition-colors hover:bg-panel2 hover:text-ink">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 rounded-xl bg-neon py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-[.98]">
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main table component ──
export function ProductosTablaCliente({
  productos: inicial,
  sucursales,
  esAdmin,
  puedeEditar,
}: {
  productos: ProductoRow[];
  sucursales: Sucursal[];
  esAdmin: boolean;
  puedeEditar: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [sucursalFiltro, setSucursalFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<ProductoRow | null>(null);

  const hayVariasSucursales = sucursales.length > 1;

  const filtrados = useMemo(() => {
    let result = inicial;

    if (sucursalFiltro) {
      result = result.filter((p) =>
        p.stockPorSucursal.some((s) => s.sucursalId === sucursalFiltro),
      );
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
    }

    return result;
  }, [inicial, busqueda, sucursalFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const slice = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  const resetPagina = () => setPagina(1);

  const handleBusqueda = (v: string) => { setBusqueda(v); resetPagina(); };
  const handleSucursal = (v: string) => { setSucursalFiltro(v); resetPagina(); };

  const sucursalActiva = sucursales.find((s) => s.id === sucursalFiltro);

  const pageNums = useMemo(() => {
    if (totalPaginas <= 5) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const start =
      paginaActual <= 3 ? 1
      : paginaActual >= totalPaginas - 2 ? totalPaginas - 4
      : paginaActual - 2;
    return Array.from({ length: 5 }, (_, i) => start + i);
  }, [totalPaginas, paginaActual]);

  const hayFiltros = busqueda || sucursalFiltro;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-rail bg-panel animate-fade-in-up delay-300">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-rail px-4 py-3">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ghost pointer-events-none"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="w-full rounded-xl border border-rail bg-panel2 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ghost"
            />
          </div>

          {/* Branch filter — only when there are multiple branches */}
          {hayVariasSucursales && (
            <div className="relative flex items-center gap-2">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ghost"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <select
                value={sucursalFiltro}
                onChange={(e) => handleSucursal(e.target.value)}
                className={`rounded-xl border py-2 pl-8 pr-3 text-sm transition-colors ${
                  sucursalFiltro
                    ? "border-neon/50 bg-neon/10 text-neon"
                    : "border-rail bg-panel2 text-ink"
                }`}
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear filters */}
          {hayFiltros && (
            <button
              onClick={() => { handleBusqueda(""); handleSucursal(""); }}
              className="text-xs text-fade transition-colors hover:text-ink"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Active filter badge */}
        {sucursalActiva && (
          <div className="flex items-center gap-2 border-b border-rail/50 bg-neon/5 px-4 py-2">
            <svg className="h-3.5 w-3.5 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-xs text-neon font-medium">{sucursalActiva.nombre}</span>
            <span className="text-xs text-fade">— mostrando stock de esta sucursal</span>
            <button
              onClick={() => handleSucursal("")}
              className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-fade transition-colors hover:bg-neon/20 hover:text-neon"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rail bg-panel2/50">
                {[
                  "SKU",
                  "NOMBRE",
                  "PRECIO",
                  sucursalActiva ? `STOCK · ${sucursalActiva.nombre}` : "STOCK TOTAL",
                  "ACCIONES",
                ].map((h, idx) => (
                  <th
                    key={idx}
                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-fade ${
                      h === "ACCIONES" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((p, i) => {
                const stockMostrar = sucursalFiltro
                  ? (p.stockPorSucursal.find((s) => s.sucursalId === sucursalFiltro)?.cantidad ?? 0)
                  : p.stockTotal;

                const stockBadge =
                  stockMostrar <= 0
                    ? "bg-danger/15 text-danger"
                    : stockMostrar <= p.stockMinimo
                    ? "bg-warn/15 text-warn"
                    : "bg-success/15 text-success";

                return (
                  <tr
                    key={p.id}
                    className="animate-fade-in-up border-b border-rail/40 transition-colors hover:bg-panel2/60"
                    style={{ animationDelay: `${i * 45}ms`, animationFillMode: "both" }}
                  >
                    {/* SKU */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/10">
                          <svg className="h-4 w-4 text-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                            <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
                          </svg>
                        </div>
                        <span className="font-mono text-xs text-fade">{p.sku}</span>
                      </div>
                    </td>

                    {/* Nombre */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{p.nombre}</p>
                      {/* Mini branch breakdown when showing total */}
                      {!sucursalFiltro && hayVariasSucursales && p.stockPorSucursal.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {p.stockPorSucursal.map((s) => {
                            const nombre = sucursales.find((x) => x.id === s.sucursalId)?.nombre;
                            if (!nombre) return null;
                            return (
                              <span
                                key={s.sucursalId}
                                className="inline-flex items-center gap-1 rounded-full bg-panel2 px-2 py-0.5 text-[10px] text-fade"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-neon/50" />
                                {nombre}: {s.cantidad}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Precio */}
                    <td className="px-5 py-4 text-ink">
                      ${p.precioVenta.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Stock */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-full px-2.5 text-xs font-bold ${stockBadge}`}>
                        {stockMostrar}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {puedeEditar && (
                          <button
                            onClick={() => setEditando(p)}
                            title="Editar producto"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10 text-neon transition-all hover:bg-neon/25 hover:scale-105 active:scale-95"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        {esAdmin && (
                          <form action={eliminarProducto}>
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              title="Eliminar producto"
                              onClick={(e) => {
                                if (!confirm(`¿Eliminar "${p.nombre}"? Se borrarán sus movimientos y stock asociados.`))
                                  e.preventDefault();
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger transition-all hover:bg-danger/25 hover:scale-105 active:scale-95"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel2">
                        <svg className="h-7 w-7 text-ghost" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
                        </svg>
                      </div>
                      <p className="text-sm text-fade">
                        {sucursalActiva && busqueda
                          ? `Sin resultados en "${sucursalActiva.nombre}" para "${busqueda}"`
                          : sucursalActiva
                          ? `No hay productos con stock registrado en "${sucursalActiva.nombre}"`
                          : busqueda
                          ? `Sin resultados para "${busqueda}"`
                          : "Todavía no cargaste productos"}
                      </p>
                      {hayFiltros && (
                        <button
                          onClick={() => { handleBusqueda(""); handleSucursal(""); }}
                          className="text-xs text-neon underline underline-offset-2"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
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
              {sucursalActiva && (
                <span className="text-neon"> · {sucursalActiva.nombre}</span>
              )}
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
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      n === paginaActual
                        ? "bg-neon text-white"
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

      {/* Edit modal — mounts fresh on each open so useActionState resets */}
      {editando && (
        <EditModal producto={editando} onClose={() => setEditando(null)} />
      )}
    </>
  );
}
