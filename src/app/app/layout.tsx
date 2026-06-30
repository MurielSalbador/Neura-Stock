import { Suspense } from "react";
import Link from "next/link";
import { getOptionalUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/auth";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { LenisWrapper } from "./lenis-wrapper";
import { MobileMenuProvider, MobileMenuButton, MobileSidebarWrapper } from "./mobile-nav";

const PLAN_LABEL: Record<string, string> = {
  trial:  "Plan Trial",
  basico: "Plan Básico",
  pro:    "Plan Pro",
};

// Fetches empresa plan — wrapped in Suspense so it doesn't block the layout
async function PlanBadge({
  empresaId,
  displayName,
}: {
  empresaId: string;
  displayName: string;
}) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { plan: true },
  });
  return (
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
        <p className="truncate text-[10px] text-fade">{displayName}</p>
      </div>
    </div>
  );
}

type UserInfo = {
  id: string;
  empresaId: string;
  rol: string;
  sucursalesIds: string[];
  sucursalId: string | null;
  name?: string | null;
  email?: string | null;
};

// Fetches employees + sucursales for the dropdown — wrapped in Suspense
async function AsyncUserMenu({
  user,
  inicial,
}: {
  user: UserInfo;
  inicial: string;
}) {
  const [empleados, sucursales] = await Promise.all([
    (user.rol === "ADMIN" || user.rol === "ENCARGADO")
      ? prisma.usuario.findMany({
          where: {
            empresaId: user.empresaId,
            activo: true,
            id: { not: user.id },
            ...(user.rol === "ENCARGADO"
              ? {
                  rol: "VENDEDOR",
                  ...(user.sucursalesIds.length > 0
                    ? { sucursalId: { in: user.sucursalesIds } }
                    : {}),
                }
              : { rol: { not: "ADMIN" } }),
          },
          select: { id: true, nombre: true, rol: true, sucursal: { select: { id: true, nombre: true } } },
          orderBy: [{ rol: "asc" }, { nombre: "asc" }],
        })
      : Promise.resolve([]),
    (user.rol === "ADMIN" || user.rol === "ENCARGADO")
      ? prisma.sucursal.findMany({
          where: {
            empresaId: user.empresaId,
            activo: true,
            ...(user.rol === "ENCARGADO" && user.sucursalesIds.length > 0
              ? { id: { in: user.sucursalesIds } }
              : {}),
          },
          select: { id: true, nombre: true },
          orderBy: { nombre: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <UserMenu
      inicial={inicial}
      nombre={user.name ?? "Usuario"}
      rol={user.rol?.toLowerCase() ?? "operador"}
      empleados={empleados.map((e) => ({
        id: e.id,
        nombre: e.nombre ?? e.id,
        rol: e.rol,
        sucursalId: e.sucursal?.id ?? null,
        sucursalNombre: e.sucursal?.nombre ?? null,
      }))}
      sucursales={sucursales}
    />
  );
}

function UserMenuFallback({
  inicial,
  nombre,
  rol,
}: {
  inicial: string;
  nombre: string;
  rol: string;
}) {
  return (
    <UserMenu
      inicial={inicial}
      nombre={nombre}
      rol={rol}
      empleados={[]}
      sucursales={[]}
    />
  );
}

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();
  const inicial = user ? (user.name ?? user.email ?? "U").charAt(0).toUpperCase() : "";

  return (
    <LenisWrapper>
      <MobileMenuProvider>
      <div className="flex min-h-screen bg-canvas">

        {/* ── Sidebar — sticky on desktop, slide-in drawer on mobile ── */}
        <MobileSidebarWrapper>

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
            <NavLinks rol={user?.rol} />
          </div>

          {/* Historial + Sign out */}
          <div className="space-y-0.5 border-t border-rail px-3 py-3">
            {user && (user.rol === "ENCARGADO" || user.rol === "ADMIN") && (
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
            {user ? (
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
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neon transition-colors hover:bg-neon/10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
                Iniciar sesión
              </Link>
            )}
          </div>

          {/* Plan badge */}
          <div className="border-t border-rail p-4">
            {user ? (
              <Suspense
                fallback={
                  <div className="flex items-center gap-3 rounded-xl bg-neon/10 px-3 py-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-neon/20" />
                    <div className="min-w-0 flex-1">
                      <div className="h-3 w-20 animate-pulse rounded bg-neon/20" />
                      <div className="mt-1 h-2.5 w-28 animate-pulse rounded bg-panel2" />
                    </div>
                  </div>
                }
              >
                <PlanBadge
                  empresaId={user.empresaId}
                  displayName={user.name ?? user.email ?? ""}
                />
              </Suspense>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-neon/10 px-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neon/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">Vista previa</p>
                  <p className="truncate text-[10px] text-fade">Datos de ejemplo</p>
                </div>
              </div>
            )}
          </div>
        </MobileSidebarWrapper>

        {/* ── Right side ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Top bar — sticky */}
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-rail bg-panel/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <MobileMenuButton />
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.29 7 8.71 5 8.71-5M12 22V12" />
                </svg>
              </div>
              <p className="text-sm font-bold tracking-wide text-ink">NEURA</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <Suspense
                  fallback={
                    <UserMenuFallback
                      inicial={inicial}
                      nombre={user!.name ?? "Usuario"}
                      rol={user!.rol?.toLowerCase() ?? "operador"}
                    />
                  }
                >
                  <AsyncUserMenu user={user!} inicial={inicial} />
                </Suspense>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neon/90"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  Iniciar sesión
                </Link>
              )}
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
      </div>
      </MobileMenuProvider>
    </LenisWrapper>
  );
}
