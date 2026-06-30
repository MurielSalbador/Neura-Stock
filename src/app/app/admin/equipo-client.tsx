"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { AddUserForm } from "./add-user-form";
import { RoleSelect } from "./role-select";
import { EditUserDialog } from "./edit-user-dialog";
import { EncargadoBranchPicker } from "./encargado-branch-picker";
import { ConfirmButton } from "../confirm-button";
import { SucursalSelector } from "../sucursal-selector";
import {
  alternarUsuario,
  eliminarUsuario,
  limpiarMovimientos,
  limpiarTodo,
  asignarSucursalesEncargado,
  asignarSucursalesVendedor,
} from "./actions";

type Sucursal = { id: string; nombre: string };
type Usuario = {
  id: string;
  nombre: string | null;
  email: string;
  rol: string;
  activo: boolean;
  sucursalId: string | null;
  sucursal: { nombre: string; id: string } | null;
  sucursalesEncargado: { sucursalId: string; sucursal: { nombre: string } }[];
};

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Admin global",
  ENCARGADO: "Encargado",
  VENDEDOR: "Vendedor",
};
const ROL_COLOR: Record<string, string> = {
  ADMIN: "bg-neon/15 text-neon",
  ENCARGADO: "bg-info/15 text-info",
  VENDEDOR: "bg-ghost/15 text-fade",
};

function DonutChart({
  activos,
  inactivos,
  total,
}: {
  activos: number;
  inactivos: number;
  total: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const r = 50;
  const C = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center py-2">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#21262d" strokeWidth="14" />
          <text x="70" y="74" textAnchor="middle" fill="#484f58" fontSize="10" fontFamily="system-ui">
            Sin usuarios
          </text>
        </svg>
      </div>
    );
  }

  const activoDash  = animated ? (C * activos) / total : 0;
  const inactivoDash = animated ? (C * inactivos) / total : 0;

  // Start at 12 o'clock (shift 25% counter-clockwise)
  const startOff  = C * 0.25;
  const inacOff   = ((startOff - (C * activos) / total) % C + C) % C;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#21262d" strokeWidth="14" />
        {/* Inactive (amber) */}
        {inactivos > 0 && (
          <circle
            cx="70" cy="70" r={r}
            fill="none" stroke="#e3b341" strokeWidth="14" strokeLinecap="butt"
            strokeDasharray={`${inactivoDash} ${C - inactivoDash}`}
            strokeDashoffset={inacOff}
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1) 0.2s" }}
          />
        )}
        {/* Active (green) */}
        {activos > 0 && (
          <circle
            cx="70" cy="70" r={r}
            fill="none" stroke="#3fb950" strokeWidth="14" strokeLinecap="butt"
            strokeDasharray={`${activoDash} ${C - activoDash}`}
            strokeDashoffset={startOff}
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)" }}
          />
        )}
        {/* Center */}
        <text x="70" y="63" textAnchor="middle" fill="#e6edf3" fontSize="26" fontWeight="700" fontFamily="system-ui">
          {total}
        </text>
        <text x="70" y="81" textAnchor="middle" fill="#8b949e" fontSize="10" fontFamily="system-ui">
          usuarios
        </text>
      </svg>
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-rail">
      <div
        className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

export function EquipoClient({
  usuarios,
  sucursales,
  sucursalesVisibles,
  sessionUser,
  esAdmin,
  misIds,
  sucursalFiltro,
}: {
  usuarios: Usuario[];
  sucursales: Sucursal[];
  sucursalesVisibles: Sucursal[];
  sessionUser: { id: string; rol: string; sucursalesIds: string[] };
  esAdmin: boolean;
  misIds: string[];
  sucursalFiltro: string;
}) {
  const [query, setQuery]           = useState("");
  const [showAddModal, setAddModal] = useState(false);
  const [openMenuId, setMenuId]     = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        (u.nombre ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (ROL_LABEL[u.rol] ?? "").toLowerCase().includes(q) ||
        (u.sucursal?.nombre ?? "").toLowerCase().includes(q),
    );
  }, [usuarios, query]);

  const totalActivos   = usuarios.filter((u) => u.activo).length;
  const totalInactivos = usuarios.filter((u) => !u.activo).length;

  const userInBranch = (u: Usuario, bid: string) =>
    u.sucursalId === bid || u.sucursalesEncargado.some((se) => se.sucursalId === bid);

  return (
    <>
      {/* Invisible overlay to close dropdowns */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuId(null)}
        />
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setAddModal(false); }}
        >
          <div className="max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-xl border border-rail bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-rail px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" x2="19" y1="8" y2="14"/>
                    <line x1="22" x2="16" y1="11" y2="11"/>
                  </svg>
                </div>
                <h2 className="font-semibold text-ink">Agregar nuevo usuario</h2>
              </div>
              <button
                type="button"
                onClick={() => setAddModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ghost transition-colors hover:bg-panel2 hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-5">
              <AddUserForm
                sucursales={sucursalesVisibles}
                esAdmin={esAdmin}
                sucursalFijaNombre={
                  !esAdmin
                    ? misIds.length === 1
                      ? sucursales.find((s) => s.id === misIds[0])?.nombre
                      : undefined
                    : undefined
                }
                onSuccess={() => setAddModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── Main content ── */}
        <div className="min-w-0 flex-1 space-y-5">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-ink">Equipo</h1>
            <p className="mt-0.5 text-sm text-fade">Gestioná los usuarios de la empresa</p>
          </div>

          {/* Search + CTA */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ghost"
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar usuario, rol o sucursal..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-rail bg-panel py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ghost transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ghost transition-colors hover:text-ink"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => setAddModal(true)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-neon/90 hover:shadow-lg hover:shadow-neon/25 active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Agregar usuario
            </button>
          </div>

          {/* Sucursal filter (only when multiple branches) */}
          {sucursalesVisibles.length > 1 && (
            <div className="flex items-center gap-3 rounded-xl border border-rail bg-panel px-4 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p className="flex-1 text-xs font-medium text-fade">Filtrar por sucursal</p>
              <SucursalSelector sucursales={sucursalesVisibles} current={sucursalFiltro} />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              {
                label: "Total usuarios",
                valor: usuarios.length,
                sub: `${totalActivos} activos`,
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                iconCls: "bg-neon/10 text-neon",
                valCls:  "text-neon",
              },
              {
                label: "Activos",
                valor: totalActivos,
                sub: "Usuarios activos",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                ),
                iconCls: "bg-success/10 text-success",
                valCls:  "text-success",
              },
              {
                label: "Inactivos",
                valor: totalInactivos,
                sub: "Usuarios inactivos",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                ),
                iconCls: "bg-warn/10 text-warn",
                valCls:  "text-warn",
              },
            ].map(({ label, valor, sub, icon, iconCls, valCls }, i) => (
              <div
                key={label}
                className="animate-fade-in-up rounded-xl border border-rail bg-panel p-2.5 transition-all hover:border-neon/20 hover:shadow-md hover:shadow-neon/5 sm:p-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium text-fade sm:text-xs">{label}</p>
                    <p className={`mt-1.5 text-xl font-bold sm:text-3xl ${valCls}`}>{valor}</p>
                    <p className="mt-1 hidden text-xs text-ghost sm:block">{sub}</p>
                  </div>
                  <div className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${iconCls}`}>
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div
            className="animate-fade-in rounded-xl border border-rail bg-panel"
            style={{ animationDelay: "240ms" }}
          >
            {/* Table header bar */}
            <div className="flex items-center justify-between border-b border-rail px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-ink">Usuarios registrados</h2>
                <span className="rounded-full bg-neon/10 px-2 py-0.5 text-xs font-medium text-neon">
                  {filtrados.length}
                </span>
              </div>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs text-fade transition-colors hover:text-ink"
                >
                  Limpiar filtro ×
                </button>
              )}
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-rail sm:hidden">
              {filtrados.map((u) => {
                const esYo          = u.id === sessionUser.id;
                const esAdminGlobal = u.rol === "ADMIN";
                const enMiSucursal  = esAdmin || (misIds.length > 0 && misIds.some((mid) => userInBranch(u, mid)));
                const puedeModif    = !esYo && !esAdminGlobal && enMiSucursal && (esAdmin || u.rol === "VENDEDOR");
                const tieneMenu     = puedeModif || (esAdmin && !esYo);
                const sActualesIds = u.sucursalesEncargado.length > 0
                  ? u.sucursalesEncargado.map((se) => se.sucursalId)
                  : u.sucursalId ? [u.sucursalId] : [];

                return (
                  <div key={u.id} className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.nombre ?? u.email)}&radius=50&fontSize=40`}
                          alt=""
                          width={36}
                          height={36}
                          className={`h-9 w-9 rounded-full ${esAdminGlobal ? "ring-2 ring-neon/40" : ""}`}
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel ${u.activo ? "bg-success" : "bg-ghost"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-medium text-ink">{u.nombre ?? "—"}</p>
                          {esYo && (
                            <span className="shrink-0 rounded bg-neon/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neon">vos</span>
                          )}
                        </div>
                        <p className="truncate text-xs text-fade">{u.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${ROL_COLOR[u.rol] ?? "bg-ghost/15 text-fade"}`}>
                        {ROL_LABEL[u.rol]}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-12">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${u.activo ? "bg-success/10 text-success" : "bg-ghost/10 text-ghost"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? "bg-success" : "bg-ghost"}`} />
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                      {u.sucursal?.nombre && (
                        <span className="text-[11px] text-fade">{u.sucursal.nombre}</span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center gap-3 pl-12">
                      <Link
                        href={`/app/admin/${u.id}`}
                        className="text-xs font-medium text-fade transition-colors hover:text-ink"
                      >
                        Actividad
                      </Link>

                      {puedeModif && (
                        <EditUserDialog
                          usuario={{ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, sucursalId: u.sucursalId }}
                          sucursalesDisponibles={sucursalesVisibles}
                          sucursalesActuales={sActualesIds}
                          esAdmin={esAdmin}
                        />
                      )}

                      {tieneMenu && (
                        <div className="relative z-30 ml-auto">
                          <button
                            type="button"
                            onClick={() => setMenuId(openMenuId === u.id ? null : u.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-rail text-ghost transition-all hover:border-neon/40 hover:bg-panel2 hover:text-ink"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="1.5"/>
                              <circle cx="12" cy="12" r="1.5"/>
                              <circle cx="12" cy="19" r="1.5"/>
                            </svg>
                          </button>

                          {openMenuId === u.id && (
                            <div className="absolute right-0 top-full z-40 mt-1.5 min-w-[190px] overflow-hidden rounded-xl border border-rail bg-panel shadow-2xl shadow-black/50 animate-scale-in">
                              {puedeModif && (
                                <form action={alternarUsuario}>
                                  <input type="hidden" name="usuarioId" value={u.id} />
                                  <button
                                    type="submit"
                                    onClick={() => setMenuId(null)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-fade transition-colors hover:bg-panel2 hover:text-ink"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      {u.activo
                                        ? <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>
                                        : <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>
                                      }
                                    </svg>
                                    {u.activo ? "Desactivar" : "Activar"}
                                  </button>
                                </form>
                              )}
                              {esAdmin && !esYo && (
                                <>
                                  <div className="my-1 border-t border-rail" />
                                  <form action={eliminarUsuario}>
                                    <input type="hidden" name="usuarioId" value={u.id} />
                                    <ConfirmButton
                                      mensaje={`¿Eliminar a "${u.nombre ?? u.email}"? Esta acción es irreversible.`}
                                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/5"
                                    >
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                                      </svg>
                                      Eliminar usuario
                                    </ConfirmButton>
                                  </form>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filtrados.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                  <p className="text-sm text-ghost">
                    {query ? `Sin resultados para "${query}"` : "No hay usuarios todavía"}
                  </p>
                  {query && (
                    <button onClick={() => setQuery("")} className="mt-1 text-xs text-neon transition-colors hover:text-neon/70">
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              )}
            </div>

            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-rail bg-panel2">
                  {["USUARIO", "ROL", "SUCURSAL", "SUCURSALES", "ESTADO", "ACCIONES"].map((col, i, arr) => (
                    <th
                      key={col}
                      className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ghost ${col === "ACCIONES" ? "text-right" : "text-left"} ${i === 0 ? "rounded-tl-xl" : ""} ${i === arr.length - 1 ? "rounded-tr-xl" : ""}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-rail">
                {filtrados.map((u, idx) => {
                  const esYo          = u.id === sessionUser.id;
                  const esAdminGlobal = u.rol === "ADMIN";
                  const enMiSucursal  = esAdmin || (misIds.length > 0 && misIds.some((mid) => userInBranch(u, mid)));
                  const puedeModif    = !esYo && !esAdminGlobal && enMiSucursal && (esAdmin || u.rol === "VENDEDOR");
                  const tieneMenu     = puedeModif || (esAdmin && !esYo);

                  const sEncargado = u.sucursalesEncargado.map((se) => ({ id: se.sucursalId, nombre: se.sucursal.nombre }));
                  const sVendedor  = u.sucursalesEncargado.length > 0
                    ? u.sucursalesEncargado.map((se) => ({ id: se.sucursalId, nombre: se.sucursal.nombre }))
                    : u.sucursal ? [{ id: u.sucursal.id, nombre: u.sucursal.nombre }] : [];
                  const sActualesIds = u.sucursalesEncargado.length > 0
                    ? u.sucursalesEncargado.map((se) => se.sucursalId)
                    : u.sucursalId ? [u.sucursalId] : [];

                  return (
                    <tr
                      key={u.id}
                      className="group transition-colors duration-150 hover:bg-panel2/70"
                      style={{ animation: "fadeInUp 0.35s ease both", animationDelay: `${260 + idx * 40}ms` }}
                    >
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.nombre ?? u.email)}&radius=50&fontSize=40`}
                              alt=""
                              width={36}
                              height={36}
                              className={`h-9 w-9 rounded-full ${esAdminGlobal ? "ring-2 ring-neon/40" : ""}`}
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel ${u.activo ? "bg-success" : "bg-ghost"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-ink">{u.nombre ?? "—"}</p>
                              {esYo && (
                                <span className="rounded bg-neon/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neon">
                                  vos
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-fade">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        {puedeModif ? (
                          <RoleSelect usuarioId={u.id} currentRol={u.rol} esAdmin={esAdmin} />
                        ) : (
                          <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${ROL_COLOR[u.rol] ?? "bg-ghost/15 text-fade"}`}>
                            {ROL_LABEL[u.rol]}
                          </span>
                        )}
                      </td>

                      {/* Primary branch */}
                      <td className="px-5 py-3.5 text-sm text-fade">
                        {u.sucursal?.nombre ?? <span className="text-ghost">—</span>}
                      </td>

                      {/* Multi-branch */}
                      <td className="px-5 py-3.5">
                        {u.rol === "ENCARGADO" && esAdmin ? (
                          <EncargadoBranchPicker usuarioId={u.id} todasSucursales={sucursales} asignadas={sEncargado} action={asignarSucursalesEncargado} />
                        ) : u.rol === "VENDEDOR" && puedeModif ? (
                          <EncargadoBranchPicker usuarioId={u.id} todasSucursales={sucursalesVisibles} asignadas={sVendedor} action={asignarSucursalesVendedor} />
                        ) : (
                          <span className="text-ghost">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${u.activo ? "bg-success/10 text-success" : "bg-ghost/10 text-ghost"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? "animate-pulse bg-success" : "bg-ghost"}`} />
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/app/admin/${u.id}`}
                            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-fade transition-all hover:border-rail hover:text-ink"
                          >
                            Actividad
                          </Link>

                          {tieneMenu && (
                            <div className="relative z-30">
                              <button
                                type="button"
                                onClick={() => setMenuId(openMenuId === u.id ? null : u.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-rail text-ghost transition-all hover:border-neon/40 hover:bg-panel2 hover:text-ink"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="5" r="1.5"/>
                                  <circle cx="12" cy="12" r="1.5"/>
                                  <circle cx="12" cy="19" r="1.5"/>
                                </svg>
                              </button>

                              {openMenuId === u.id && (
                                <div className="absolute right-0 top-full z-40 mt-1.5 min-w-[190px] overflow-hidden rounded-xl border border-rail bg-panel shadow-2xl shadow-black/50 animate-scale-in">
                                  {puedeModif && (
                                    <div onClick={() => setMenuId(null)}>
                                      <EditUserDialog
                                        usuario={{ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, sucursalId: u.sucursalId }}
                                        sucursalesDisponibles={sucursalesVisibles}
                                        sucursalesActuales={sActualesIds}
                                        esAdmin={esAdmin}
                                        menuMode
                                      />
                                    </div>
                                  )}
                                  {puedeModif && (
                                    <form action={alternarUsuario}>
                                      <input type="hidden" name="usuarioId" value={u.id} />
                                      <button
                                        type="submit"
                                        onClick={() => setMenuId(null)}
                                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-fade transition-colors hover:bg-panel2 hover:text-ink"
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          {u.activo
                                            ? <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>
                                            : <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>
                                          }
                                        </svg>
                                        {u.activo ? "Desactivar" : "Activar"}
                                      </button>
                                    </form>
                                  )}
                                  {esAdmin && !esYo && (
                                    <>
                                      <div className="my-1 border-t border-rail" />
                                      <form action={eliminarUsuario}>
                                        <input type="hidden" name="usuarioId" value={u.id} />
                                        <ConfirmButton
                                          mensaje={`¿Eliminar a "${u.nombre ?? u.email}"? Esta acción es irreversible.`}
                                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/5"
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                                          </svg>
                                          Eliminar usuario
                                        </ConfirmButton>
                                      </form>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="1.5">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                          <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                        <p className="text-sm text-ghost">
                          {query ? `Sin resultados para "${query}"` : "No hay usuarios todavía"}
                        </p>
                        {query && (
                          <button
                            onClick={() => setQuery("")}
                            className="mt-1 text-xs text-neon transition-colors hover:text-neon/70"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-rail px-5 py-3">
              <p className="text-xs text-ghost">
                Mostrando {filtrados.length} de {usuarios.length} usuarios
              </p>
              <div className="flex items-center gap-1">
                <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-rail text-xs text-fade transition-colors hover:border-neon/40 hover:text-ink">
                  ‹
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/10 text-xs font-bold text-neon">
                  1
                </button>
                <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-rail text-xs text-fade transition-colors hover:border-neon/40 hover:text-ink">
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* Danger zone — admin only */}
          {esAdmin && (
            <div className="rounded-xl border border-danger/20 bg-panel p-5">
              <h2 className="mb-1 text-sm font-semibold text-danger">Zona de peligro</h2>
              <p className="mb-4 text-xs text-fade">
                Estas acciones son irreversibles. Los usuarios y sucursales no se eliminan.
              </p>
              <div className="flex flex-wrap gap-3">
                <form action={limpiarMovimientos}>
                  <ConfirmButton
                    mensaje="¿Borrar TODOS los movimientos y el stock? Esta acción es irreversible."
                    className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
                  >
                    Borrar movimientos y stock
                  </ConfirmButton>
                </form>
                <form action={limpiarTodo}>
                  <ConfirmButton
                    mensaje="¿Borrar TODO (productos, movimientos, ventas, compras)? Esta acción es COMPLETAMENTE irreversible."
                    className="rounded-lg bg-danger/15 px-4 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/25"
                  >
                    Borrar todo
                  </ConfirmButton>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="w-full animate-fade-in space-y-4 lg:w-[268px] lg:shrink-0" style={{ animationDelay: "150ms" }}>

          {/* Donut chart */}
          <div className="rounded-xl border border-rail bg-panel p-5">
            <h3 className="text-sm font-semibold text-ink">Resumen rápido</h3>
            <p className="mb-3 mt-0.5 text-xs text-fade">Distribución del equipo</p>
            <DonutChart activos={totalActivos} inactivos={totalInactivos} total={usuarios.length} />

            <div className="mt-5 space-y-3">
              {[
                { label: "Activos",   valor: totalActivos,   dot: "bg-success", bar: "bg-success", pct: usuarios.length > 0 ? Math.round((totalActivos / usuarios.length) * 100) : 0 },
                { label: "Inactivos", valor: totalInactivos, dot: "bg-warn",    bar: "bg-warn",    pct: usuarios.length > 0 ? Math.round((totalInactivos / usuarios.length) * 100) : 0 },
                { label: "Total",     valor: usuarios.length, dot: "bg-neon",   bar: "bg-neon",    pct: 100 },
              ].map(({ label, valor, dot, bar, pct }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                    <span className="text-xs text-fade">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniBar pct={pct} color={bar} />
                    <span className="w-12 text-right text-xs font-medium text-ink">
                      {valor}
                      <span className="ml-1 text-ghost">({pct}%)</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-rail bg-panel p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">Acciones rápidas</h3>
            <div className="space-y-1">
              <button
                onClick={() => setAddModal(true)}
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-fade transition-all hover:bg-panel2 hover:text-ink"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neon/10 text-neon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <line x1="19" x2="19" y1="8" y2="14"/>
                      <line x1="22" x2="16" y1="11" y2="11"/>
                    </svg>
                  </div>
                  Agregar usuario
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ghost group-hover:text-fade">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>

              <Link
                href="/app/historial"
                className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-fade transition-all hover:bg-panel2 hover:text-ink"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ghost/10 text-fade">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  Ver historial
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ghost group-hover:text-fade">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Branch info — carousel */}
          {sucursalesVisibles.length > 0 && (
            <div className="rounded-xl border border-rail bg-panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-fade">Sucursales</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    {sucursalesVisibles.length} {sucursalesVisibles.length === 1 ? "sucursal" : "sucursales"}
                  </p>
                </div>
                {sucursalesVisibles.length > 1 && (
                  <span className="text-[10px] text-ghost">scroll →</span>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {sucursalesVisibles.map((s) => (
                  <div
                    key={s.id}
                    className="w-[120px] flex-shrink-0 snap-start rounded-xl border border-rail bg-panel2 p-3 transition-colors hover:border-neon/30"
                  >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-neon/10">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <p className="truncate text-xs font-semibold text-ink">{s.nombre}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase text-success">
                      <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
                      Activa
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
