"use client";

import { useActionState, useRef } from "react";
import { crearUsuario, type AdminState } from "./actions";

type Sucursal = { id: string; nombre: string };

const inicial: AdminState = {};

export function AddUserForm({
  sucursales,
  esAdmin,
  sucursalFijaNombre,
}: {
  sucursales: Sucursal[];
  esAdmin: boolean;
  sucursalFijaNombre?: string;
}) {
  const [state, action, pending] = useActionState(crearUsuario, inicial);
  const formRef = useRef<HTMLFormElement>(null);

  if (state.ok) formRef.current?.reset();

  return (
    <form ref={formRef} action={action} className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger sm:col-span-2 lg:col-span-3">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success sm:col-span-2 lg:col-span-3">
          Usuario creado correctamente.
        </p>
      )}

      <input
        name="nombre"
        placeholder="Nombre completo"
        required
        className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
      />
      <input
        name="password"
        type="password"
        placeholder="Contraseña (mín. 6 caracteres)"
        required
        className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
      />

      <select
        name="rol"
        defaultValue="VENDEDOR"
        className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
      >
        <option value="VENDEDOR">Vendedor</option>
        {esAdmin && <option value="ENCARGADO">Jefe de equipo</option>}
        {esAdmin && <option value="ADMIN">Admin global</option>}
      </select>

      {esAdmin ? (
        <select
          name="sucursalId"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
        >
          <option value="">Sin sucursal asignada</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-fade">
          <span>Sucursal: {sucursalFijaNombre ?? "—"}</span>
        </div>
      )}

      <button
        disabled={pending}
        className="rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25 disabled:opacity-40"
      >
        {pending ? "Creando…" : "+ Agregar usuario"}
      </button>
    </form>
  );
}
