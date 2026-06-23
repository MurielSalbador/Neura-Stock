"use client";

import { useActionState, useRef, useState } from "react";
import { nuevoMovimiento, type MovState } from "./actions";

type Opt = { id: string; nombre: string };

const inicial: MovState = {};

export function MovForm({
  productos,
  sucursales,
}: {
  productos: { id: string; nombre: string; sku: string }[];
  sucursales: Opt[];
}) {
  const [state, action, pending] = useActionState(nuevoMovimiento, inicial);
  const [tipo, setTipo] = useState("ENTRADA");
  const formRef = useRef<HTMLFormElement>(null);

  const usaOrigen  = tipo !== "ENTRADA";
  const usaDestino = tipo === "ENTRADA" || tipo === "TRANSFERENCIA";

  if (state.ok) formRef.current?.reset();

  return (
    <form ref={formRef} action={action} className="grid gap-3 md:grid-cols-2">
      {state.error && (
        <p className="md:col-span-2 border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="md:col-span-2 border border-neon/40 bg-neon/10 px-3 py-2 font-mono text-xs text-neon">
          // Movimiento registrado. Stock actualizado.
        </p>
      )}

      <Campo label="Tipo">
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
        >
          <option value="ENTRADA">Entrada (compra / ingreso)</option>
          <option value="SALIDA">Salida (venta / egreso)</option>
          <option value="TRANSFERENCIA">Transferencia entre sucursales</option>
          <option value="AJUSTE">Ajuste (conteo / merma)</option>
        </select>
      </Campo>

      <Campo label="Producto">
        <select
          name="productoId"
          required
          className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
        >
          <option value="">Elegí un producto…</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.sku})
            </option>
          ))}
        </select>
      </Campo>

      {usaOrigen && (
        <Campo label={tipo === "AJUSTE" ? "Sucursal" : "Sucursal origen"}>
          <select
            name="sucursalOrigenId"
            required
            className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
          >
            <option value="">Elegí…</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </Campo>
      )}

      {usaDestino && (
        <Campo label="Sucursal destino">
          <select
            name="sucursalDestinoId"
            required
            className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
          >
            <option value="">Elegí…</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </Campo>
      )}

      <Campo label={tipo === "AJUSTE" ? "Cantidad (+/-)" : "Cantidad"}>
        <input
          name="cantidad"
          type="number"
          step="0.001"
          required
          placeholder={tipo === "AJUSTE" ? "Ej: -2" : "Ej: 10"}
          className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
        />
      </Campo>

      <Campo label="Motivo (opcional)">
        <input
          name="motivo"
          className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
        />
      </Campo>

      <div className="md:col-span-2">
        <button
          disabled={pending}
          className="border border-neon/60 bg-neon/10 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-neon transition-colors hover:bg-neon/20 disabled:opacity-40"
        >
          {pending ? "// registrando…" : "Registrar movimiento →"}
        </button>
      </div>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[11px] uppercase tracking-widest text-fade">{label}</span>
      {children}
    </label>
  );
}
