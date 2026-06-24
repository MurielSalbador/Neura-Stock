"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearProducto, type ProductoState } from "./actions";

type Sucursal = { id: string; nombre: string };
const inicial: ProductoState = {};

export function ProductoForm({ sucursales }: { sucursales: Sucursal[] }) {
  const [state, action, pending] = useActionState(crearProducto, inicial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <>
      {state.error && (
        <p className="mb-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mb-3 rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success">
          Producto creado correctamente.
        </p>
      )}
      <form ref={formRef} action={action} className="grid gap-2.5 md:grid-cols-5">
        <input
          name="sku"
          placeholder="SKU / código"
          required
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
        <input
          name="nombre"
          placeholder="Nombre"
          required
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors md:col-span-2"
        />
        <input
          name="codigoBarras"
          placeholder="Cód. barras (opc.)"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
        <input
          name="precioVenta"
          type="number"
          step="0.01"
          placeholder="Precio venta"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
        <input
          name="stockMinimo"
          type="number"
          step="0.001"
          placeholder="Stock mínimo"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
        <input
          name="stockInicial"
          type="number"
          step="0.001"
          min="0"
          placeholder="Stock actual"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
        <select
          name="sucursalId"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors md:col-span-2"
        >
          <option value="">Sucursal (si cargás stock)</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
        <button
          disabled={pending}
          className="rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25 disabled:opacity-40 md:col-span-2"
        >
          {pending ? "Agregando…" : "+ Agregar producto"}
        </button>
      </form>
    </>
  );
}
