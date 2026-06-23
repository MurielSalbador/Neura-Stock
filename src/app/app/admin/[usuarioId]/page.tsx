import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const TIPO_LABEL: Record<string, string> = {
  ENTRADA:       "Entrada",
  SALIDA:        "Salida",
  TRANSFERENCIA: "Transferencia",
  AJUSTE:        "Ajuste",
};

const TIPO_COLOR: Record<string, string> = {
  ENTRADA:       "bg-success/15 text-success",
  SALIDA:        "bg-danger/15 text-danger",
  TRANSFERENCIA: "bg-warn/15 text-warn",
  AJUSTE:        "bg-ghost/15 text-fade",
};

const ROL_LABEL: Record<string, string> = {
  ADMIN:     "Admin global",
  ENCARGADO: "Encargado",
  VENDEDOR:  "Vendedor",
};

export default async function UsuarioHistorialPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const { usuarioId } = await params;
  const admin = await requireUser();
  if (admin.rol !== "ADMIN" && admin.rol !== "ENCARGADO") redirect("/app");

  const target = await prisma.usuario.findUnique({
    where: { id: usuarioId, empresaId: admin.empresaId },
    include: { sucursal: { select: { nombre: true } } },
  });
  if (!target) notFound();

  // ENCARGADO can only view users in their own branch
  if (admin.rol === "ENCARGADO" && target.sucursalId !== admin.sucursalId) {
    redirect("/app/admin");
  }

  const movimientos = await prisma.movimiento.findMany({
    where: { empresaId: admin.empresaId, usuarioId },
    orderBy: { creadoEn: "desc" },
    take: 50,
    include: {
      producto:        { select: { nombre: true } },
      sucursalOrigen:  { select: { nombre: true } },
      sucursalDestino: { select: { nombre: true } },
    },
  });

  // Stats per type
  const statsPorTipo = ["ENTRADA", "SALIDA", "TRANSFERENCIA", "AJUSTE"].map((tipo) => ({
    tipo,
    count: movimientos.filter((m) => m.tipo === tipo).length,
  }));

  const inicial = (target.nombre ?? target.email).charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/app/admin"
        className="inline-flex items-center gap-1.5 text-sm text-fade transition-colors hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver al equipo
      </Link>

      {/* User header */}
      <div className="flex items-center gap-4 rounded-xl border border-rail bg-panel p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neon/20 text-xl font-bold text-neon">
          {inicial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink">{target.nombre ?? "Sin nombre"}</h1>
          <p className="text-sm text-fade">{target.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-fade">Rol</p>
          <p className="text-sm font-semibold text-ink">{ROL_LABEL[target.rol]}</p>
          {target.sucursal && (
            <>
              <p className="mt-1 text-xs text-fade">Sucursal</p>
              <p className="text-sm text-ink">{target.sucursal.nombre}</p>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-fade">Estado</p>
          <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${target.activo ? "bg-success/15 text-success" : "bg-ghost/15 text-ghost"}`}>
            {target.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-rail bg-panel p-4">
          <p className="text-xs text-fade">Total movimientos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{movimientos.length}</p>
        </div>
        {statsPorTipo.map(({ tipo, count }) => (
          <div key={tipo} className="rounded-xl border border-rail bg-panel p-4">
            <p className="text-xs text-fade">{TIPO_LABEL[tipo]}</p>
            <p className={`mt-1 text-2xl font-bold ${count > 0 ? (TIPO_COLOR[tipo]?.split(" ")[1] ?? "text-ink") : "text-ghost"}`}>
              {count}
            </p>
          </div>
        ))}
      </div>

      {/* Movements table */}
      <div className="overflow-hidden rounded-xl border border-rail bg-panel">
        <div className="flex items-center justify-between border-b border-rail px-5 py-4">
          <h2 className="font-semibold text-ink">Historial de movimientos</h2>
          <span className="rounded border border-rail px-2.5 py-1 text-xs text-fade">
            Últimos {movimientos.length}
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rail bg-panel2">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Fecha
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Tipo
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Producto
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-fade">
                Cant.
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-fade">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rail">
            {movimientos.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-panel2">
                <td className="px-5 py-3 text-xs text-fade">
                  {m.creadoEn.toLocaleDateString("es-AR")}{" "}
                  <span className="text-ghost">
                    {m.creadoEn.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIPO_COLOR[m.tipo] ?? "bg-ghost/15 text-fade"}`}>
                    {TIPO_LABEL[m.tipo]}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-ink">{m.producto.nombre}</td>
                <td className="px-5 py-3 text-right font-bold text-ink">{Number(m.cantidad)}</td>
                <td className="px-5 py-3 text-xs text-fade">
                  {m.sucursalOrigen?.nombre && `desde ${m.sucursalOrigen.nombre}`}
                  {m.sucursalOrigen && m.sucursalDestino && " → "}
                  {m.sucursalDestino?.nombre}
                  {m.motivo && ` · ${m.motivo}`}
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-fade">
                  Este usuario no tiene movimientos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
