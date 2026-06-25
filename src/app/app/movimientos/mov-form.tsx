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
        <div className="md:col-span-2 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/8 px-4 py-3">
          <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-danger">{state.error}</p>
        </div>
      )}
      {state.ok && (
        <div className="md:col-span-2 flex items-start gap-3 rounded-lg border border-success/30 bg-success/8 px-4 py-3">
          <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-sm text-success">Movimiento registrado. Stock actualizado.</p>
        </div>
      )}

      <Campo label="Tipo">
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          disabled={esVendedor}
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
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
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-all appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
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
            className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
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
            className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
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
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-all"
        />
      </Campo>

      <Campo label="Motivo (opcional)">
        <input
          name="motivo"
          placeholder="Notas..."
          className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-all"
        />
      </Campo>

      <div className="md:col-span-2 pt-1">
        <button
          disabled={pending}
          className="group flex items-center gap-2 rounded-lg bg-neon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon/20 transition-all hover:bg-neon/90 hover:shadow-neon/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
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
          {pending ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Registrando…
            </>
          ) : (
            <>
              Registrar movimiento
              <svg className="transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-fade">{label}</span>
      {children}
    </label>
  );
}
