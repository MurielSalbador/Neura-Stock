"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrar, type RegistroState } from "./actions";

const inicial: RegistroState = {};

export default function RegistroPage() {
  const [state, action, pending] = useActionState(registrar, inicial);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="text-center space-y-1">
          <p className="font-mono text-2xl font-bold tracking-[0.3em] text-neon brand-glow uppercase">
            STOCK-NEURA
          </p>
          <p className="font-mono text-[11px] tracking-[0.2em] text-fade uppercase">
            // sistema de gestión
          </p>
        </div>

        <form
          action={action}
          className="border border-rail bg-panel p-6 space-y-4"
        >
          <div className="border-b border-rail pb-3">
            <h1 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-ink">
              Crear cuenta
            </h1>
            <p className="mt-0.5 font-mono text-[11px] text-fade">
              Empezá tu prueba gratis.
            </p>
          </div>

          {state.error && (
            <p className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
              {state.error}
            </p>
          )}

          <Campo label="Nombre de la empresa" name="empresa" placeholder="Ferretería El Tornillo" />
          <Campo label="Tu nombre" name="nombre" placeholder="Juan Pérez" />
          <Campo label="Email" name="email" type="email" placeholder="juan@empresa.com" />
          <Campo label="Contraseña" name="password" type="password" placeholder="••••••••" />

          <button
            type="submit"
            disabled={pending}
            className="w-full border border-neon/60 bg-neon/10 px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-[0.15em] text-neon transition-colors hover:bg-neon/20 disabled:opacity-40"
          >
            {pending ? "// creando…" : "Crear cuenta →"}
          </button>

          <p className="text-center font-mono text-[11px] text-fade">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-neon underline underline-offset-2">
              Iniciar sesión
            </Link>
          </p>
        </form>

      </div>
    </main>
  );
}

function Campo({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[11px] uppercase tracking-widest text-fade">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
      />
    </label>
  );
}
