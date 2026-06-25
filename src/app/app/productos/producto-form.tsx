"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearProducto, type ProductoState } from "./actions";

type Sucursal = { id: string; nombre: string };
const inicial: ProductoState = {};

export function ProductoForm({ sucursales }: { sucursales: Sucursal[] }) {
  const [state, action, pending] = useActionState(crearProducto, inicial);
  const formRef = useRef<HTMLFormElement>(null);
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <div className="overflow-hidden rounded-2xl border border-rail bg-panel animate-fade-in-up delay-200">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-panel2/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/15">
            <svg
              className="h-3.5 w-3.5 text-neon"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink">Nuevo producto</span>
        </div>
        <svg
          className={`h-4 w-4 text-fade transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {abierto && (
        <div className="border-t border-rail px-5 pb-5 pt-4 animate-fade-in-up">
          {state.error && (
            <p className="mb-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="mb-3 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success">
              Producto creado correctamente.
            </p>
          )}

          <form ref={formRef} action={action}>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <input
                name="sku"
                placeholder="SKU / código *"
                required
                className="rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost"
              />
              <input
                name="nombre"
                placeholder="Nombre *"
                required
                className="rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost md:col-span-2"
              />
              <input
                name="codigoBarras"
                placeholder="Cód. barras (opc.)"
                className="rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost"
              />
              <input
                name="precioVenta"
                type="number"
                step="0.01"
                placeholder="Precio venta"
                className="rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost"
              />
              <input
                name="stockMinimo"
                type="number"
                step="0.001"
                placeholder="Stock mínimo"
                className="rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost"
              />
              <input
                name="stockInicial"
                type="number"
                step="0.001"
                min="0"
                placeholder="Stock actual"
                className="rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost"
              />
              <select
                name="sucursalId"
                className="rounded-xl border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink"
              >
                <option value="">Sucursal (si cargás stock)</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <button
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-[.98]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {pending ? "Agregando…" : "Agregar producto"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
