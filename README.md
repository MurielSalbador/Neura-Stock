<div align="center">

```
 ██████╗████████╗ ██████╗  ██████╗██╗  ██╗    ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗
██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝    ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗
╚█████╗    ██║   ██║   ██║██║     █████╔╝     ██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║
 ╚═══██╗   ██║   ██║   ██║██║     ██╔═██╗     ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║
██████╔╝   ██║   ╚██████╔╝╚██████╗██║  ██╗    ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║
╚═════╝    ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝    ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

### Sistema SaaS de Control de Stock e Inventario Multi-Sucursal

_Para ferreterías, distribuidoras, farmacias y comercios en general_

---

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## ¿Qué es Stock-Neura?

**Stock-Neura** es una plataforma SaaS multi-tenant diseñada para que pequeñas y medianas empresas (PyMEs) de Argentina gestionen su inventario en tiempo real a través de múltiples sucursales y depósitos — desde un único panel de control web, sin instalaciones locales.

Cada empresa tiene su propio entorno aislado. Los usuarios operan con roles diferenciados. Cada movimiento de stock queda registrado para siempre.

---

## Funcionalidades principales

### Dashboard ejecutivo

El panel central muestra el estado del negocio de un vistazo:

- **KPIs en tiempo real**: total de productos activos, sucursales operativas, movimientos de la semana y alertas de stock crítico
- **Sparklines de tendencia**: gráficos de 7 días para movimientos y altas de productos
- **Alertas de stock bajo**: distingue entre stock crítico (≤ 30 % del mínimo) y stock bajo (entre 30 % y 100 % del mínimo)
- **Actividad reciente**: los últimos movimientos con producto, sucursal, usuario y fecha
- **Stock por sucursal**: gráfico de barras comparativo entre locales y depósitos

---

### Gestión de inventario

| Característica | Detalle |
|---|---|
| **Multi-sucursal** | Visualizá y gestioná el stock de cada local o depósito por separado |
| **Productos con SKU y código de barras** | Código único, nombre, categoría, precio de costo y venta, stock mínimo |
| **Categorías jerárquicas** | Agrupación por categoría y subcategoría |
| **Filtro por sucursal** | Consultá el inventario de cualquier punto de venta al instante |
| **Valorización del stock** | Cantidad × precio de costo y de venta por producto y sucursal |

---

### Movimientos de stock

El corazón del sistema. Cuatro tipos de operación cubren toda la operativa:

```
┌─────────────┬──────────────────────────────────────────────────────┐
│ Tipo        │ Descripción                                          │
├─────────────┼──────────────────────────────────────────────────────┤
│ ENTRADA     │ Ingreso de mercadería (compra a proveedor, devolución)│
│ SALIDA      │ Egreso de mercadería (venta, pérdida, merma)         │
│ TRANSFERENCIA│ Traslado entre sucursales en una sola operación      │
│ AJUSTE      │ Corrección manual de inventario (recuento físico)    │
└─────────────┴──────────────────────────────────────────────────────┘
```

Cada movimiento registra: usuario, fecha/hora, sucursal/es involucradas, producto, cantidad y motivo. Es el trazable completo del negocio.

---

### Ventas y compras

- Registro de ventas con líneas de detalle (producto × cantidad × precio)
- Registro de compras por proveedor con líneas de detalle
- Cada operación genera automáticamente su movimiento de stock correspondiente

---

### Clientes y proveedores

- ABM completo de clientes con seguimiento de cuenta corriente
- ABM completo de proveedores
- Historial de operaciones asociadas

---

### Historial de actividad

Log completo y filtrable de todos los movimientos de la empresa:

- Filtro por tipo de movimiento (entrada / salida / transferencia / ajuste)
- Búsqueda por producto, sucursal o usuario
- Exportable para auditoría

---

### Gestión de usuarios y roles

```
ADMIN
 ├── Acceso completo a todas las sucursales
 ├── Configuración de empresa y precios
 ├── Gestión de usuarios y roles
 └── Reportes y estadísticas globales

ENCARGADO
 ├── Movimientos, ventas y compras de su sucursal
 ├── Consulta de stock de su sucursal
 └── Gestión de vendedores de su sucursal

VENDEDOR
 ├── Registro de ventas (salidas) de su sucursal
 └── Consulta de stock de su sucursal
```

---

## Arquitectura del sistema

### Multi-tenancy

Todas las empresas comparten una única base de datos PostgreSQL. El aislamiento se garantiza filtrando siempre por `empresaId` en cada consulta — nunca existe la posibilidad de cruce de datos entre tenants.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Stock-Neura SaaS                             │
│                                                                     │
│   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐        │
│   │  Empresa A    │   │  Empresa B    │   │  Empresa C    │        │
│   │  (Ferretería) │   │  (Farmacia)   │   │ (Distribuidora│        │
│   └──────┬────────┘   └──────┬────────┘   └──────┬────────┘        │
│          │                   │                   │                  │
│          └───────────────────┼───────────────────┘                  │
│                              │ empresaId                            │
│                    ┌─────────▼─────────┐                           │
│                    │   PostgreSQL       │                           │
│                    │   (Neon Serverless)│                           │
│                    └───────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Modelo de datos

```
Empresa (tenant)
│
├── Usuarios          → rol (ADMIN / ENCARGADO / VENDEDOR) + sucursalId
│
├── Sucursales        → tipo (LOCAL / DEPOSITO) + dirección
│
├── Productos         → SKU, código de barras, precios, stock mínimo
│   └── Categorías    → jerárquicas (padre / hijo)
│
├── Stock             → cantidad por (producto × sucursal) — cache derivado
│
├── Movimientos       → fuente de verdad: ENTRADA / SALIDA / TRANSFERENCIA / AJUSTE
│
├── Ventas            → cabecera + líneas de detalle
│   └── DetalleVenta
│
├── Compras           → cabecera + líneas de detalle
│   └── DetalleCompra
│
├── Clientes          → nombre, contacto, cuenta corriente
│
└── Proveedores       → nombre, contacto, historial de compras
```

### Modelo de stock: movement-first

El stock **nunca se edita directamente**. La secuencia siempre es:

```
Operación (venta / compra / ajuste)
         │
         ▼
  ┌──────────────┐       transacción atómica
  │  Movimiento  │ ─────────────────────────────►  Stock (cache)
  │  (fuente de  │                                 cantidad actualizada
  │   verdad)    │
  └──────────────┘

Si se necesita reconstruir: SUM(movimientos por producto×sucursal) = stock real
```

Ventajas: trazabilidad completa, reconstrucción ante fallo, auditoría de quién movió qué y cuándo.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Framework** | Next.js App Router | 16 |
| **UI** | React + TypeScript | 19 / 5 |
| **Estilos** | Tailwind CSS | 4 |
| **Backend** | Next.js Server Actions + API Routes | — |
| **ORM** | Prisma | 7 |
| **Base de datos** | PostgreSQL serverless (Neon) | — |
| **Autenticación** | Auth.js v5 (NextAuth) — Credentials + JWT | 5 |
| **Hashing** | bcryptjs | 3 |
| **Validación** | Zod | 4 |
| **Hosting** | Vercel (frontend) + Neon (DB) | — |

---

## Estructura del proyecto

```
stock-neura/
│
├── prisma/
│   └── schema.prisma          # Modelo de datos completo
│
└── src/
    ├── app/
    │   ├── app/               # Panel principal (rutas protegidas)
    │   │   ├── page.tsx           ← Dashboard: KPIs, alertas, actividad reciente
    │   │   ├── movimientos/       ← Registro y listado de movimientos
    │   │   ├── stock/             ← Inventario por sucursal
    │   │   ├── productos/         ← Catálogo: alta, edición, búsqueda
    │   │   ├── sucursales/        ← Gestión de locales y depósitos
    │   │   ├── admin/             ← Equipo: usuarios, roles, activación
    │   │   ├── historial/         ← Log completo de actividad filtrable
    │   │   └── user-menu/         ← Cuenta y cierre de sesión
    │   │
    │   ├── login/             ← Inicio de sesión con credenciales
    │   └── registro/          ← Onboarding: alta de nueva empresa
    │
    ├── lib/
    │   ├── prisma.ts          ← Cliente Prisma singleton
    │   ├── session.ts         ← requireUser / requireAdmin helpers
    │   └── stock.ts           ← registrarMovimiento() — lógica core del stock
    │
    ├── auth.ts                ← Configuración NextAuth + Credentials provider
    ├── auth.config.ts         ← Config edge-safe (JWT callbacks y roles)
    └── proxy.ts               ← Middleware de autenticación y redirección
```

---

## Variables de entorno

```env
# .env.local

DATABASE_URL=postgres://...     # Connection string pooled de Neon
AUTH_SECRET=...                 # Secret aleatorio para firmar JWT (openssl rand -base64 32)
```

---

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma
npx prisma generate

# 3. Aplicar migraciones a la base de datos
npx prisma migrate deploy

# 4. (Opcional) Seed inicial
npx prisma db seed

# 5. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

### Comandos útiles

```bash
npm run build          # Build de producción
npm start              # Servidor de producción local
npx prisma studio      # UI visual para explorar la base de datos
npx prisma migrate dev # Crear nueva migración en desarrollo
```

---

## Despliegue

El proyecto está configurado para **Vercel** con deploy continuo desde `main`.

```bash
# Variables de entorno requeridas en Vercel
DATABASE_URL=...
AUTH_SECRET=...
```

Cada `git push` a `main` dispara automáticamente un build y deploy en Vercel. La base de datos Neon escala a cero cuando no hay uso y despierta en milisegundos.

---

## Roadmap

### MVP (Etapa 1) — en producción
- [x] Infraestructura multi-tenant con aislamiento por `empresaId`
- [x] Sistema de usuarios, roles y permisos por sucursal
- [x] CRUD completo de productos, sucursales, usuarios
- [x] Registro y auditoría de movimientos de stock
- [x] Dashboard con KPIs, alertas y actividad reciente
- [x] Ventas y compras con líneas de detalle
- [x] Gestión de clientes y proveedores

### Etapa 2 — próximamente
- [ ] Escaneo de código de barras desde dispositivos móviles
- [ ] Cuenta corriente de clientes con saldo y pagos
- [ ] Seguimiento de lotes y vencimientos (farmacias)
- [ ] Reportes avanzados con exportación a Excel/PDF
- [ ] Integración con AFIP para facturación electrónica
- [ ] PWA mobile para operación offline

### Etapa 3
- [ ] Integración con Mercado Pago (cobros y suscripciones)
- [ ] API pública para integración con e-commerce
- [ ] App mobile nativa

---

<div align="center">

Hecho con foco en la realidad operativa de las PyMEs argentinas.

**Stock-Neura** — control total del inventario, desde cualquier lugar.

</div>
