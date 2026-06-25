"use client";

import { useActionState, useEffect, useRef } from "react";
import { editarUsuario, type AdminState } from "./actions";

type Sucursal = { id: string; nombre: string };

const inicial: AdminState = {};

export function EditUserDialog({
  usuario,
  sucursalesDisponibles,
  sucursalesActuales,
  esAdmin,
  menuMode = false,
}: {
  usuario: {
    id: string;
    nombre: string | null;
    email: string;
    rol: string;
    sucursalId: string | null;
  };
  sucursalesDisponibles: Sucursal[];
  sucursalesActuales: string[];
  esAdmin: boolean;
  menuMode?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(editarUsuario, inicial);

  useEffect(() => {
    if (state.ok) dialogRef.current?.close();
  }, [state.ok]);

  // Both VENDEDORs and ENCARGADOs support multi-branch checkboxes
  const usaCheckboxes =
    (usuario.rol === "VENDEDOR" || usuario.rol === "ENCARGADO") &&
    sucursalesDisponibles.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={menuMode
          ? "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-fade transition-colors hover:bg-panel2 hover:text-ink"
          : "text-xs font-medium text-fade underline underline-offset-2 transition-colors hover:text-ink"
        }
      >
        {menuMode && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        )}
        Editar
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-xl border border-rail bg-panel p-0 shadow-2xl backdrop:bg-black/60"
        onClick={(e) => { if (e.target === e.currentTarget) dialogRef.current?.close(); }}
      >
        <div className="flex items-center justify-between border-b border-rail px-5 py-4">
          <h2 className="font-semibold text-ink">Editar usuario</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-fade transition-colors hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={action} className="space-y-4 p-5">
          <input type="hidden" name="usuarioId" value={usuario.id} />

          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
              {state.error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-fade">Nombre</label>
            <input
              name="nombre"
              defaultValue={usuario.nombre ?? ""}
              required
              className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-fade">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={usuario.email}
              required
              className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-fade">
              Nueva contraseña{" "}
              <span className="text-ghost">(dejar vacío para no cambiar)</span>
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••"
              className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors"
            />
          </div>

          {/* Multi-branch checkboxes for VENDEDOR and ENCARGADO */}
          {usaCheckboxes && (
            <div>
              <label className="mb-2 block text-xs font-medium text-fade">
                Sucursales asignadas
              </label>
              <div className="space-y-2 rounded-lg border border-rail bg-panel2 p-3">
                {sucursalesDisponibles.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      name="sucursalIds"
                      value={s.id}
                      defaultChecked={sucursalesActuales.includes(s.id)}
                      className="accent-neon"
                    />
                    <span className="text-sm text-ink">{s.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Single branch select — only for non-ENCARGADO/VENDEDOR roles when admin */}
          {!usaCheckboxes && esAdmin && sucursalesDisponibles.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-fade">Sucursal principal</label>
              <select
                name="sucursalId"
                defaultValue={usuario.sucursalId ?? ""}
                className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink transition-colors"
              >
                <option value="">Sin sucursal</option>
                {sucursalesDisponibles.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-rail px-4 py-2.5 text-sm text-fade transition-colors hover:text-ink"
            >
              Cancelar
            </button>
            <button
              disabled={pending}
              className="rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25 disabled:opacity-40"
            >
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
