"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { nuevoMovimiento, type MovState } from "./actions";

type Opt = { id: string; nombre: string };

const inicial: MovState = {};

export function MovForm({
  productos,
  sucursales,
  esVendedor = false,
}: {
  productos: { id: string; nombre: string; sku: string }[];
  sucursales: Opt[];
  esVendedor?: boolean;
}) {
  const [state, action, pending] = useActionState(nuevoMovimiento, inicial);
  const [tipo, setTipo] = useState(esVendedor ? "SALIDA" : "ENTRADA");
  const formRef = useRef<HTMLFormElement>(null);

  const usaOrigen  = tipo !== "ENTRADA";
  const usaDestino = tipo === "ENTRADA" || tipo === "TRANSFERENCIA";

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setTipo(esVendedor ? "SALIDA" : "ENTRADA");
    }
  }, [state.ok, esVendedor]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 md:grid-cols-2">
      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger md:col-span-2">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success md:col-span-2">
          Movimiento registrado. Stock actualizado.
        </p>
      )}

      <Campo label="Tipo">
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          disabled={esVendedor}
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors disabled:opacity-60"
        >
          {!esVendedor && <option value="ENTRADA">Entrada (compra / ingreso)</option>}
          <option value="SALIDA">Salida (venta / egreso)</option>
          {!esVendedor && <option value="TRANSFERENCIA">Transferencia entre sucursales</option>}
          {!esVendedor && <option value="AJUSTE">Ajuste (conteo / merma)</option>}
        </select>
      </Campo>

      <Campo label="Producto">
        <select
          name="productoId"
          required
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
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
            className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
          >
            <option value="">Elegí…</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}

      {usaDestino && (
        <Campo label="Sucursal destino">
          <select
            name="sucursalDestinoId"
            required
            className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
          >
            <option value="">Elegí…</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
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
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
      </Campo>

      <Campo label="Motivo (opcional)">
        <input
          name="motivo"
          placeholder="Notas..."
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
      </Campo>

      <div className="md:col-span-2">
        <button
          disabled={pending}
          className="rounded-lg bg-neon/15 px-5 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25 disabled:opacity-40"
          onClick={(e) => {
            if (tipo === "TRANSFERENCIA") {
              const form = formRef.current;
              if (!form) return;
              const origen  = (form.elements.namedItem("sucursalOrigenId")  as HTMLSelectElement)?.value;
              const destino = (form.elements.namedItem("sucursalDestinoId") as HTMLSelectElement)?.value;
              if (origen && destino && origen === destino) {
                e.preventDefault();
                alert("La sucursal de origen y destino no pueden ser la misma.");
              }
            }
          }}
        >
          {pending ? "Registrando…" : "Registrar movimiento →"}
        </button>
      </div>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-fade">{label}</span>
      {children}
    </label>
  );
}
