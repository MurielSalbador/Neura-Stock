"use client";

import { useState, useRef, useEffect } from "react";
import { signOutAction } from "./auth-actions";

export function UserMenu({
  inicial,
  nombre,
  rol,
}: {
  inicial: string;
  nombre: string;
  rol: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-rail bg-panel shadow-xl">
          <div className="border-b border-rail px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{nombre}</p>
            <p className="text-xs capitalize text-fade">{rol}</p>
          </div>
          <div className="p-1.5">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-fade transition-colors hover:bg-panel2 hover:text-danger"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
