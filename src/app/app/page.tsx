import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const empresaId = user.empresaId;

  const [sucursales, productos, movimientos, lineasStock] = await Promise.all([
    prisma.sucursal.count({ where: { empresaId, activo: true } }),
    prisma.producto.count({ where: { empresaId, activo: true } }),
    prisma.movimiento.count({ where: { empresaId } }),
    prisma.stock.findMany({
      where: { empresaId },
      include: { producto: { select: { nombre: true, stockMinimo: true } } },
    }),
  ]);

  const bajos = lineasStock.filter(
    (s) => Number(s.cantidad) <= Number(s.producto.stockMinimo),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-xl font-bold text-ink">
          Hola, {user.name ?? "operador"} —
        </h1>
        <p className="font-mono text-xs text-fade uppercase tracking-widest">
          // resumen del negocio
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tarjeta titulo="Sucursales"    valor={sucursales}    href="/app/sucursales" />
        <Tarjeta titulo="Productos"     valor={productos}     href="/app/productos" />
        <Tarjeta titulo="Movimientos"   valor={movimientos}   href="/app/movimientos" />
        <Tarjeta titulo="Alertas stock" valor={bajos.length}  alerta={bajos.length > 0} />
      </div>

      {/* CTA vacío */}
      {productos === 0 && (
        <div className="border border-dashed border-rail bg-panel p-6 text-center space-y-3">
          <p className="font-mono text-sm font-bold text-ink">
            Todavía no cargaste productos
          </p>
          <p className="font-mono text-xs text-fade">
            Empezá agregando tu catálogo para controlar el stock por sucursal.
          </p>
          <Link
            href="/app/productos"
            className="inline-block border border-neon/60 bg-neon/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-neon transition-colors hover:bg-neon/20"
          >
            Cargar productos →
          </Link>
        </div>
      )}

      {/* Alertas */}
      {bajos.length > 0 && (
        <section className="border border-danger/30 bg-panel">
          <div className="border-b border-danger/20 px-4 py-3">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-danger glow-danger">
              !! Productos con stock bajo
            </h2>
          </div>
          <ul className="divide-y divide-rail">
            {bajos.slice(0, 10).map((s) => (
              <li key={s.id} className="flex justify-between px-4 py-2.5 font-mono text-sm">
                <span className="text-ink">{s.producto.nombre}</span>
                <span className="font-bold text-danger glow-danger">{Number(s.cantidad)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tarjeta({
  titulo,
  valor,
  href,
  alerta,
}: {
  titulo: string;
  valor: number;
  href?: string;
  alerta?: boolean;
}) {
  const contenido = (
    <div
      className={`border bg-panel p-4 transition-colors ${
        alerta
          ? "border-danger/50 hover:border-danger/70"
          : "border-rail hover:border-neon/30"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-fade">
        {titulo}
      </p>
      <p
        className={`mt-2 font-mono text-3xl font-bold ${
          alerta ? "text-danger glow-danger" : "text-neon glow-neon"
        }`}
      >
        {valor}
      </p>
    </div>
  );

  return href ? <Link href={href}>{contenido}</Link> : contenido;
}
