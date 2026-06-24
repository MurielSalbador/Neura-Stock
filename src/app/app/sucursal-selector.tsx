"use client";
import { useRouter, usePathname } from "next/navigation";

export function SucursalSelector({
  sucursales,
  current,
}: {
  sucursales: { id: string; nombre: string }[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function select(id: string) {
    router.push(id ? `${pathname}?sucursal=${encodeURIComponent(id)}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => select("")}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          !current
            ? "bg-neon/20 text-neon"
            : "text-fade hover:text-ink hover:bg-panel2"
        }`}
      >
        Todas
      </button>
      {sucursales.map((s) => (
        <button
          key={s.id}
          onClick={() => select(s.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            current === s.id
              ? "bg-neon/20 text-neon"
              : "text-fade hover:text-ink hover:bg-panel2"
          }`}
        >
          {s.nombre}
        </button>
      ))}
    </div>
  );
}
