"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearSucursal, type SucursalState } from "./actions";

const inicial: SucursalState = {};

export function SucursalForm() {
  const [state, action, pending] = useActionState(crearSucursal, inicial);
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
          Sucursal creada correctamente.
        </p>
      )}
      <form ref={formRef} action={action} className="grid gap-2.5 md:grid-cols-4">
        <input
          name="nombre"
          placeholder="Nombre"
          required
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
        <select
          name="tipo"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
        >
          <option value="LOCAL">Local</option>
          <option value="DEPOSITO">Depósito</option>
        </select>
        <input
          name="direccion"
          placeholder="Dirección (opcional)"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
        />
        <button
          disabled={pending}
          className="rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25 disabled:opacity-40"
        >
          {pending ? "Agregando…" : "+ Agregar"}
        </button>
      </form>
    </>
  );
}
