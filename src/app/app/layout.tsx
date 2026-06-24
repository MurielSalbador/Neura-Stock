import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/auth";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

const PLAN_LABEL: Record<string, string> = {
  trial:  "Plan Trial",
  basico: "Plan Básico",
  pro:    "Plan Pro",
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const empresa = await prisma.empresa.findUnique({
    where: { id: user.empresaId },
    select: { plan: true },
  });

  const inicial = (user.name ?? user.email ?? "U").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-canvas">

      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-rail bg-panel">

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-rail px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neon/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-ink">NEURA</p>
            <p className="text-[10px] uppercase tracking-widest text-fade">Stock System</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-4">
          <NavLinks rol={user.rol} />
        </div>

        {/* Historial + Sign out */}
        <div className="space-y-0.5 border-t border-rail px-3 py-3">
          {(user.rol === "ENCARGADO" || user.rol === "ADMIN") && (
            <Link
              href="/app/historial"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fade transition-colors hover:bg-panel2 hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Historial
            </Link>
          )}

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fade transition-colors hover:bg-panel2 hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Salir
            </button>
          </form>
        </div>

        {/* Plan badge */}
        <div className="border-t border-rail p-4">
          <div className="flex items-center gap-3 rounded-xl bg-neon/10 px-3 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink">
                {PLAN_LABEL[empresa?.plan ?? "trial"] ?? "Plan Trial"}
              </p>
              <p className="truncate text-[10px] text-fade">
                {user.name ?? user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right side ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-rail bg-panel px-6 py-3">
          <div className="relative max-w-md flex-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos, movimientos..."
              readOnly
              title="Búsqueda global — próximamente"
              className="w-full cursor-not-allowed rounded-lg border border-rail bg-panel2 py-2 pl-10 pr-28 text-sm opacity-50 transition-colors"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-rail px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ghost">
              Próximamente
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* User menu */}
            <UserMenu
              inicial={inicial}
              nombre={user.name ?? "Usuario"}
              rol={user.rol?.toLowerCase() ?? "operador"}
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
