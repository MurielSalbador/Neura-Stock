# Stock-Neura

Sistema SaaS de control de stock e inventario multi-sucursal para negocios (ferreterías, distribuidoras, farmacias, comercios en general).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) + React + TypeScript |
| UI | Tailwind CSS |
| Backend | Next.js Server Actions |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL (Neon serverless) |
| Auth | Auth.js v5 (NextAuth) — JWT + Credentials |
| Hosting | Vercel + Neon |

## Arquitectura multi-tenant

Todos los clientes (empresas) comparten la misma base de datos, aislados por `empresaId`. Cada tabla de negocio lleva `empresaId` y toda query se filtra siempre por el tenant del usuario logueado.

```
Empresa (tenant)
 └─ Sucursales (locales / depósitos)
     └─ Stock por producto
 └─ Usuarios (con rol y sucursal asignada)
 └─ Productos / Categorías
 └─ Movimientos (entrada / salida / transferencia / ajuste)
 └─ Ventas / Compras
 └─ Clientes / Proveedores
```

## Roles y permisos

| Rol | Acceso |
|---|---|
| **ADMIN** | Todas las sucursales, todos los reportes, configuración de empresa, usuarios y precios |
| **ENCARGADO** | Movimientos, ventas y compras de su sucursal; gestiona vendedores de su sucursal |
| **VENDEDOR** | Solo registra salidas (ventas) y consulta stock de su propia sucursal |

## Modelo de stock

El stock **nunca se edita directo**. El stock actual se deriva de los movimientos:

1. Cada venta/compra/transferencia/ajuste genera una fila en `movimiento`.
2. Una transacción atómica actualiza el cache en `stock`.
3. El valor visible = `stock.cantidad` (rápido); reconstruible desde `movimiento` (auditable).

Tipos de movimiento: `ENTRADA` · `SALIDA` · `TRANSFERENCIA` · `AJUSTE`

## Variables de entorno

```env
DATABASE_URL=          # Conexión pooled de Neon (postgres://...)
AUTH_SECRET=           # Secret para firmar los JWT de Auth.js
```

## Desarrollo local

```bash
npm install
npx prisma generate
npm run dev
```

## Estructura del proyecto

```
src/
├── app/
│   ├── app/               # Panel principal (rutas protegidas)
│   │   ├── page.tsx           # Dashboard con KPIs y alertas
│   │   ├── movimientos/       # Registro y listado de movimientos
│   │   ├── stock/             # Inventario por sucursal
│   │   ├── productos/         # Catálogo de productos
│   │   ├── sucursales/        # Gestión de sucursales
│   │   ├── admin/             # Gestión de equipo y usuarios
│   │   └── historial/         # Historial completo de actividad
│   ├── login/             # Página de inicio de sesión
│   └── registro/          # Alta de nueva empresa (onboarding)
├── lib/
│   ├── prisma.ts          # Cliente Prisma singleton
│   ├── session.ts         # requireUser / requireAdmin
│   └── stock.ts           # registrarMovimiento (lógica core)
├── auth.ts                # NextAuth con provider Credentials
├── auth.config.ts         # Config edge-safe (JWT callbacks)
└── proxy.ts               # Middleware de autenticación
```

## Despliegue

El proyecto está configurado para Vercel. Cada push a `main` dispara un deploy automático.

```bash
# Variables requeridas en Vercel:
DATABASE_URL
AUTH_SECRET
```
