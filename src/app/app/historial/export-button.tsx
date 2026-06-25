"use client";

export type ExportRow = {
  fecha: string;
  tipo: string;
  producto: string;
  cantidad: number;
  usuario: string;
  rol: string;
  detalle: string;
};

export function ExportButton({ data }: { data: ExportRow[] }) {
  function handleExport() {
    const headers = ["Fecha", "Tipo", "Producto", "Cantidad", "Realizado por", "Rol", "Detalle"];
    const rows = data.map((r) => [
      r.fecha,
      r.tipo,
      r.producto,
      String(r.cantidad),
      r.usuario,
      r.rol,
      r.detalle,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const bom = "﻿"; // UTF-8 BOM so Excel opens with correct encoding
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="flex items-center gap-2 rounded-lg border border-rail bg-panel px-3.5 py-2 text-sm font-medium text-fade transition-all hover:border-neon/40 hover:bg-neon/10 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Exportar
    </button>
  );
}
