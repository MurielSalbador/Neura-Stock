"use client";

import { useRef, useState } from "react";

type Sucursal = { id: string; nombre: string };

export function EncargadoBranchPicker({
  usuarioId,
  todasSucursales,
  asignadas,
  action,
}: {
  usuarioId: string;
  todasSucursales: Sucursal[];
  asignadas: Sucursal[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const asignadasIds = asignadas.map((s) => s.id);

  // Collapsed view — show first branch badge; if 2+ show a "N sucursales" pill
  if (!editing) {
    const hasMultiple = asignadas.length > 1;

    return (
      <div className="flex items-center gap-1.5">
        {asignadas.length === 0 ? (
          <span className="text-xs text-ghost">Sin asignar</span>
        ) : hasMultiple ? (
          /* Compact dropdown for 2+ branches */
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1 rounded-md bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info hover:bg-info/20"
            >
              {asignadas.length} sucursales
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 min-w-max rounded-lg border border-rail bg-panel shadow-lg">
                {asignadas.map((s) => (
                  <p key={s.id} className="px-3 py-1.5 text-xs text-ink">
                    {s.nombre}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="rounded-md bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
            {asignadas[0].nombre}
          </span>
        )}
        <button
          type="button"
          onClick={() => { setEditing(true); setDropdownOpen(false); }}
          className="rounded-md border border-rail px-2 py-0.5 text-[10px] text-fade hover:bg-panel2 hover:text-ink"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setEditing(false)}
      className="flex flex-wrap items-start gap-2"
    >
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <div className="flex flex-col gap-1">
        {todasSucursales.map((s) => (
          <label key={s.id} className="flex cursor-pointer items-center gap-2 text-xs text-ink">
            <input
              type="checkbox"
              name="sucursalIds"
              value={s.id}
              defaultChecked={asignadasIds.includes(s.id)}
              className="accent-neon"
            />
            {s.nombre}
          </label>
        ))}
      </div>
      <div className="flex gap-1.5">
        <button
          type="submit"
          className="rounded-md bg-neon/15 px-2.5 py-1 text-[10px] font-semibold text-neon hover:bg-neon/25"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md bg-panel2 px-2.5 py-1 text-[10px] text-fade hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
