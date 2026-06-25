"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const RANGES = [
  { label: "Últimos 7 días",      value: "7" },
  { label: "Últimos 30 días",     value: "30" },
  { label: "Últimos 90 días",     value: "90" },
  { label: "Este año",            value: "365" },
  { label: "Todo el historial",   value: "all" },
];

function Filter({ current }: { current: string }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  function onChange(value: string) {
    const p = new URLSearchParams(params.toString());
    if (value === "30") p.delete("rango");
    else p.set("rango", value);
    router.push(`${pathname}?${p.toString()}`);
  }

  const selected = RANGES.find((r) => r.value === current) ?? RANGES[1];

  return (
    <div className="relative flex items-center gap-2 rounded-lg border border-rail bg-panel px-3 py-2 text-sm text-fade hover:border-neon/30 transition-colors cursor-pointer select-none">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
      <span className="font-medium text-ink">{selected.label}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
      {/* Invisible full-cover select for native dropdown */}
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
        aria-label="Filtrar por período"
      >
        {RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateFilter({ current }: { current: string }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 rounded-lg border border-rail bg-panel px-3 py-2 text-sm text-fade">
          <span>Cargando...</span>
        </div>
      }
    >
      <Filter current={current} />
    </Suspense>
  );
}
