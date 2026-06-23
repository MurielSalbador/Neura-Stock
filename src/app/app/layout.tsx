import Link from "next/link";
import { requireUser } from "@/lib/session";
import { signOut } from "@/auth";

const NAV = [
  { href: "/app",             label: "Inicio" },
  { href: "/app/stock",       label: "Stock" },
  { href: "/app/productos",   label: "Productos" },
  { href: "/app/movimientos", label: "Movimientos" },
  { href: "/app/sucursales",  label: "Sucursales" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-rail bg-panel">

        {/* Brand */}
        <div className="border-b border-rail px-4 py-5 space-y-2">
          <p className="font-mono text-sm font-bold tracking-[0.25em] text-neon brand-glow uppercase">
            STOCK-NEURA
          </p>
          <p className="truncate font-mono text-[11px] text-fade">
            {user.name ?? user.email}
          </p>
          <span className="inline-block border border-neon/30 bg-neon/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-neon">
            {user.rol}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2 pt-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block border-l-2 border-transparent px-3 py-2 font-mono text-sm text-fade transition-colors hover:border-neon/50 hover:bg-neon/5 hover:text-neon"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="border-t border-rail p-2"
        >
          <button
            type="submit"
            className="w-full px-3 py-2 text-left font-mono text-xs text-ghost transition-colors hover:text-fade"
          >
            Cerrar sesión
          </button>
        </form>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
