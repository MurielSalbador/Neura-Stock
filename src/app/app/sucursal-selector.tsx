"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function SucursalSelector({
  sucursales,
  current,
}: {
  sucursales: { id: string; nombre: string }[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function select(id: string) {
    router.push(id ? `${pathname}?sucursal=${encodeURIComponent(id)}` : pathname);
    setOpen(false);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLabel = current
    ? (sucursales.find((s) => s.id === current)?.nombre ?? "Todas")
    : "Todas";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          current
            ? "border-neon/40 bg-neon/10 text-neon"
            : "border-rail bg-panel2 text-ink hover:bg-panel"
        }`}
      >
        {currentLabel}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""} ${current ? "text-neon" : "text-fade"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-rail bg-panel shadow-xl">
          <button
            onClick={() => select("")}
            className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-panel2 ${
              !current ? "text-neon" : "text-ink"
            }`}
          >
            Todas
          </button>
          {sucursales.map((s) => (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors hover:bg-panel2 ${
                current === s.id ? "text-neon" : "text-ink"
              }`}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
