"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";

const inicial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, inicial);

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
              Iniciar sesión
            </h1>
            <p className="mt-0.5 font-mono text-[11px] text-fade">
              Accedé a tu panel de stock.
            </p>
          </div>

          {state.error && (
            <p className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
              {state.error}
            </p>
          )}

          <label className="block space-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-fade">Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-mono text-[11px] uppercase tracking-widest text-fade">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-rail bg-panel px-3 py-2 font-mono text-sm text-ink transition-colors"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full border border-neon/60 bg-neon/10 px-4 py-2.5 font-mono text-sm font-bold uppercase tracking-[0.15em] text-neon transition-colors hover:bg-neon/20 disabled:opacity-40"
          >
            {pending ? "// conectando…" : "Entrar →"}
          </button>

          <p className="text-center font-mono text-[11px] text-fade">
            ¿No tenés cuenta?{" "}
            <Link href="/registro" className="text-neon underline underline-offset-2 hover:glow-neon">
              Crear una
            </Link>
          </p>
        </form>

      </div>
    </main>
  );
}
