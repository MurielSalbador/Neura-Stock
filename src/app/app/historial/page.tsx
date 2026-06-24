import { redirect } from "next/navigation";
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
  ADMIN:     "Admin",
  ENCARGADO: "Jefe",
  VENDEDOR:  "Vendedor",
};

export default async function HistorialPage() {
  const user = await requireUser();

  if (user.rol === "VENDEDOR") redirect("/app");

  const empresaId = user.empresaId;

  // ENCARGADO con sucursal: solo ve los movimientos de su sucursal.
  // ENCARGADO sin sucursal: solo ve sus propios movimientos.
  const whereBase =
    user.rol === "ENCARGADO"
      ? user.sucursalId
        ? {
            empresaId,
            OR: [
              { sucursalOrigenId: user.sucursalId },
              { sucursalDestinoId: user.sucursalId },
            ],
          }
        : { empresaId, usuarioId: user.id }
      : { empresaId };

  const [movimientos, conteoPorTipo] = await Promise.all([
    prisma.movimiento.findMany({
      where: whereBase,
      orderBy: { creadoEn: "desc" },
      take: 200,
      include: {
        producto:        { select: { nombre: true } },
        sucursalOrigen:  { select: { nombre: true } },
        sucursalDestino: { select: { nombre: true } },
        usuario:         { select: { nombre: true, rol: true } },
      },
    }),
    prisma.movimiento.groupBy({
      by: ["tipo"],
      where: whereBase,
      _count: { tipo: true },
    }),
  ]);

  const totalMovimientos = conteoPorTipo.reduce((acc, c) => acc + c._count.tipo, 0);

  const statsPorTipo = ["ENTRADA", "SALIDA", "TRANSFERENCIA", "AJUSTE"].map((tipo) => ({
    tipo,
    count: conteoPorTipo.find((c) => c.tipo === tipo)?._count.tipo ?? 0,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Historial de actividad</h1>
        <p className="mt-0.5 text-sm text-fade">Todos los movimientos de la empresa</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-rail bg-panel p-4">
          <p className="text-xs text-fade">Total registros</p>
          <p className="mt-1 text-2xl font-bold text-ink">{totalMovimientos}</p>
        </div>
        {statsPorTipo.map(({ tipo, count }) => {
          const colorClass = TIPO_COLOR[tipo]?.split(" ")[1] ?? "text-ink";
          return (
            <div key={tipo} className="rounded-xl border border-rail bg-panel p-4">
              <p className="text-xs text-fade">{TIPO_LABEL[tipo]}</p>
              <p className={`mt-1 text-2xl font-bold ${count > 0 ? colorClass : "text-ghost"}`}>
                {count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Movements table */}
      <div className="overflow-hidden rounded-xl border border-rail bg-panel">
        <div className="flex items-center justify-between border-b border-rail px-5 py-4">
          <h2 className="font-semibold text-ink">Actividad registrada</h2>
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
                Realizado por
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
                <td className="px-5 py-3">
                  {m.usuario ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neon/20 text-[10px] font-bold text-neon">
                        {(m.usuario.nombre ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink">{m.usuario.nombre ?? "—"}</p>
                        <p className="text-[10px] text-ghost">{ROL_LABEL[m.usuario.rol] ?? m.usuario.rol}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-ghost">—</span>
                  )}
                </td>
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
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-fade">
                  Sin actividad registrada todavía
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
