"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { signOutAction, loginComoEmpleadoAction } from "./auth-actions";

type Empleado = {
  id: string;
  nombre: string;
  rol?: string;
  sucursalId: string | null;
  sucursalNombre: string | null;
};

type Sucursal = { id: string; nombre: string };

const ROL_LABEL: Record<string, string> = {
  ENCARGADO: "Jefe",
  VENDEDOR:  "Vendedor",
};

export function UserMenu({
  inicial,
  nombre,
  rol,
  empleados = [],
  sucursales = [],
}: {
  inicial: string;
  nombre: string;
  rol: string;
  empleados?: Empleado[];
  sucursales?: Sucursal[];
}) {
  const [open, setOpen] = useState(false);
  const [sucursalFiltro, setSucursalFiltro] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<Empleado | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [switchState, switchAction, switchPending] = useActionState(loginComoEmpleadoAction, {});

  const esJefe = rol === "admin" || rol === "encargado";
  const multiSucursal = sucursales.length > 1;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSucursalFiltro(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (pendingSwitch) {
      dialogRef.current?.showModal();
      setTimeout(() => passwordRef.current?.focus(), 50);
    }
  }, [pendingSwitch]);

  const empleadosMostrados = sucursalFiltro
    ? empleados.filter((e) => e.sucursalId === sucursalFiltro)
    : multiSucursal
    ? []
    : empleados;

  function seleccionarEmpleado(empleado: Empleado) {
    setOpen(false);
    setSucursalFiltro(null);
    setPendingSwitch(empleado);
  }

  function cerrarDialog() {
    dialogRef.current?.close();
    setPendingSwitch(null);
  }

  function renderEmpleado(e: Empleado) {
    return (
      <button
        key={e.id}
        type="button"
        onClick={() => seleccionarEmpleado(e)}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-panel2"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ghost/20 text-[10px] font-bold text-fade">
          {e.nombre.charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 truncate text-ink">{e.nombre}</span>
        {e.rol && e.rol !== "VENDEDOR" && (
          <span className="rounded bg-info/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-info">
            {ROL_LABEL[e.rol] ?? e.rol}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setSucursalFiltro(null); }}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-panel2"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon text-xs font-bold text-canvas">
            {inicial}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium leading-tight text-ink">{nombre}</p>
            <p className="text-[10px] capitalize text-fade">{rol}</p>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-fade transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-rail bg-panel shadow-xl">
            <div className="border-b border-rail px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink">{nombre}</p>
              <p className="text-xs capitalize text-fade">{rol}</p>
            </div>

            {/* Sección empleados — solo para jefes/encargados */}
            {esJefe && empleados.length > 0 && (
              <div className="border-b border-rail">
                <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-ghost">
                  Cambiar a cuenta
                </p>

                {multiSucursal && !sucursalFiltro && (
                  <div className="px-2 pb-2">
                    {sucursales.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSucursalFiltro(s.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-panel2"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-fade">
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                        </svg>
                        <span className="flex-1 truncate">{s.nombre}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ghost">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}

                {multiSucursal && sucursalFiltro && (
                  <div className="px-2 pb-2">
                    <button
                      type="button"
                      onClick={() => setSucursalFiltro(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-fade hover:text-ink"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                      {sucursales.find((s) => s.id === sucursalFiltro)?.nombre}
                    </button>
                    {empleadosMostrados.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-ghost">Sin usuarios en esta sucursal</p>
                    ) : (
                      empleadosMostrados.map(renderEmpleado)
                    )}
                  </div>
                )}

                {!multiSucursal && (
                  <div className="px-2 pb-2">
                    {empleadosMostrados.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-ghost">Sin usuarios activos</p>
                    ) : (
                      empleadosMostrados.map(renderEmpleado)
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="p-1.5">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-fade transition-colors hover:bg-panel2 hover:text-danger"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para confirmar contraseña al cambiar de cuenta */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded-xl border border-rail bg-panel p-0 shadow-2xl backdrop:bg-black/60"
        onClose={() => setPendingSwitch(null)}
        onClick={(e) => { if (e.target === e.currentTarget) cerrarDialog(); }}
      >
        {pendingSwitch && (
          <>
            <div className="flex items-center justify-between border-b border-rail px-5 py-4">
              <div>
                <p className="font-semibold text-ink">Cambiar de cuenta</p>
                <p className="text-xs text-fade">
                  Ingresás como{" "}
                  <span className="font-medium text-ink">{pendingSwitch.nombre}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarDialog}
                className="text-fade transition-colors hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              key={pendingSwitch.id}
              action={switchAction}
              className="space-y-4 p-5"
            >
              <input type="hidden" name="usuarioId" value={pendingSwitch.id} />

              {switchState.error && (
                <p className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                  {switchState.error}
                </p>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-fade">
                  Contraseña de {pendingSwitch.nombre}
                </label>
                <input
                  ref={passwordRef}
                  name="password"
                  type="password"
                  placeholder="••••••"
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border border-rail bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ghost transition-colors focus:border-neon/50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={cerrarDialog}
                  className="rounded-lg border border-rail px-4 py-2.5 text-sm text-fade transition-colors hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  disabled={switchPending}
                  className="rounded-lg bg-neon/15 px-4 py-2.5 text-sm font-semibold text-neon transition-colors hover:bg-neon/25 disabled:opacity-40"
                >
                  {switchPending ? "Verificando…" : "Ingresar"}
                </button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
