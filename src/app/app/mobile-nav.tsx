"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type MenuCtx = { open: boolean; setOpen: (v: boolean) => void };

const Ctx = createContext<MenuCtx | null>(null);

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

function useMobileMenu() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMobileMenu must be used within MobileMenuProvider");
  return ctx;
}

export function MobileMenuButton() {
  const { open, setOpen } = useMobileMenu();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-label={open ? "Cerrar menú" : "Abrir menú"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink transition-colors hover:bg-panel2 lg:hidden"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
      </svg>
    </button>
  );
}

export function MobileSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useMobileMenu();
  const pathname = usePathname();

  // Cierra el drawer al navegar
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Bloquea el scroll del body mientras el drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] shrink-0 flex-col border-r border-rail bg-panel overflow-y-auto transition-transform duration-200 ease-out lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:w-64 lg:translate-x-0 lg:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </aside>
    </>
  );
}
