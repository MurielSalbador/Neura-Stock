"use client";

import { useRef } from "react";
import { cambiarRol } from "./actions";

export function RoleSelect({
  usuarioId,
  currentRol,
  esAdmin,
}: {
  usuarioId: string;
  currentRol: string;
  esAdmin: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={cambiarRol}>
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <select
        name="rol"
        defaultValue={currentRol}
        onChange={() => formRef.current?.requestSubmit()}
        className="cursor-pointer rounded-md border border-rail bg-panel2 px-2 py-1.5 text-xs text-ink transition-colors hover:border-neon/40"
      >
        <option value="VENDEDOR">Vendedor</option>
        {esAdmin && <option value="ENCARGADO">Jefe de equipo</option>}
        {esAdmin && <option value="ADMIN">Admin global</option>}
      </select>
    </form>
  );
}
