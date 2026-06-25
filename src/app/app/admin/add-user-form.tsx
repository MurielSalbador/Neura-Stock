"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearUsuario, type AdminState } from "./actions";

type Sucursal = { id: string; nombre: string };

const inicial: AdminState = {};

export function AddUserForm({
  sucursales,
  esAdmin,
  sucursalFijaNombre,
  onSuccess,
}: {
  sucursales: Sucursal[];
  esAdmin: boolean;
  sucursalFijaNombre?: string;
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState(crearUsuario, inicial);
  const formRef = useRef<HTMLFormElement>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState("VENDEDOR");

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setRolSeleccionado("VENDEDOR");
      onSuccess?.();
    }
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  // Multi-branch checkboxes when creating VENDEDOR with 2+ branches available
  const mostrarCheckboxes = rolSeleccionado === "VENDEDOR" && sucursales.length > 1;

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
        value={rolSeleccionado}
        onChange={(e) => setRolSeleccionado(e.target.value)}
        className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
      >
        <option value="VENDEDOR">Vendedor</option>
        {esAdmin && <option value="ENCARGADO">Jefe de equipo</option>}
        {esAdmin && <option value="ADMIN">Admin global</option>}
      </select>

      {/* Branch selection — checkboxes for VENDEDOR with 2+ branches, select otherwise */}
      {mostrarCheckboxes ? (
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="mb-1.5 text-xs font-medium text-fade">Sucursales</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {sucursales.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="sucursalIds"
                  value={s.id}
                  className="accent-neon"
                />
                <span className="text-sm text-ink">{s.nombre}</span>
              </label>
            ))}
          </div>
        </div>
      ) : esAdmin || sucursales.length > 1 ? (
        <select
          name="sucursalId"
          className="rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
        >
          {esAdmin && <option value="">Sin sucursal asignada</option>}
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
