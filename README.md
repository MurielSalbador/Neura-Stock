```
███████╗████████╗ ██████╗  ██████╗██╗  ██╗      ███╗   ██╗███████╗██╗   ██╗██████╗  █████╗
██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝      ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔══██╗
███████╗   ██║   ██║   ██║██║     █████╔╝ █████╗██╔██╗ ██║█████╗  ██║   ██║██████╔╝███████║
╚════██║   ██║   ██║   ██║██║     ██╔═██╗ ╚════╝██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██╔══██║
███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗      ██║ ╚████║███████╗╚██████╔╝██║  ██║██║  ██║
╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝      ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

<div align="center">

**Sistema de gestión de stock multi-sucursal · by Neura Sistemas**

`Next.js 16` &nbsp;·&nbsp; `React 19` &nbsp;·&nbsp; `TypeScript` &nbsp;·&nbsp; `Prisma 7` &nbsp;·&nbsp; `PostgreSQL` &nbsp;·&nbsp; `Tailwind CSS v4`

</div>

---

## ¿Qué es Stock-Neura?

Stock-Neura es una plataforma SaaS de gestión de inventario diseñada para empresas con una o múltiples sucursales. Cada empresa tiene su propio espacio aislado (**multi-tenant**), con usuarios, roles, productos, movimientos y alertas completamente independientes.

El stock **no se modifica directamente**: cada entrada, salida, transferencia o ajuste genera un `Movimiento`, que es la fuente de verdad. El campo `Stock` es solo un cache calculado. Esto garantiza trazabilidad completa y un historial de auditoría inmutable.

---

## Pantallas principales

| Pantalla | Descripción |
|---|---|
| `/login` | Autenticación con email y contraseña |
| `/registro` | Alta de empresa + primer usuario ADMIN |
| `/app` | Dashboard con KPIs, alertas y filtro por sucursal |
| `/app/stock` | Vista de stock actual por producto y sucursal, con filtro por sucursal |
| `/app/productos` | Catálogo: alta y eliminación de productos (con confirmación) |
| `/app/movimientos` | Registro de movimientos con filtro por sucursal |
| `/app/sucursales` | Gestión de locales y depósitos |
| `/app/admin` | Gestión del equipo con filtro por sucursal |
| `/app/admin/[id]` | Historial de actividad de un usuario específico |
| `/app/historial` | Log completo de movimientos de la empresa (ADMIN/ENCARGADO) |

---

## Funcionalidades

### Control de stock
- Stock en tiempo real por **producto × sucursal**
- Alertas automáticas cuando el stock cae por debajo del mínimo configurado
- Soporte para unidades fraccionarias (3 decimales de precisión)
- Al eliminar un movimiento, el stock se **revierte automáticamente** al estado anterior

### Movimientos (fuente de verdad)
- **ENTRADA** — compra o ingreso de mercadería
- **SALIDA** — venta o egreso
- **TRANSFERENCIA** — movimiento entre sucursales (descuenta origen, acredita destino)
- **AJUSTE** — corrección por conteo, merma o rotura (acepta cantidades negativas)

### Filtro por sucursal
Todas las vistas clave incluyen un selector de sucursal que filtra el contenido en tiempo real:

| Vista | Comportamiento del filtro |
|---|---|
| **Dashboard** | Filtra "Productos con stock bajo" y "Últimos movimientos". Los KPIs superiores siempre muestran totales generales. |
| **Inventario** | Muestra solo la sucursal seleccionada (vista de columna única) o todas. |
| **Movimientos** | Filtra por sucursal de origen o destino. El ENCARGADO arranca en su sucursal por defecto. |
| **Equipo** | Filtra usuarios por sucursal asignada. Los ADMINs siempre aparecen. El ENCARGADO arranca en su sucursal. |

### Multi-sucursal
- Cantidad ilimitada de locales y/o depósitos por empresa
- Cada usuario puede estar asignado a una sucursal específica
- El stock se segmenta por sucursal, con totales consolidados en la vista general
- El ENCARGADO ve su sucursal por defecto en todas las vistas

### Roles y permisos
| Rol | Acceso |
|---|---|
| `ADMIN` | Todo: configuración, productos, movimientos, reportes, gestión de usuarios y limpieza de datos |
| `ENCARGADO` | Operaciones de su sucursal asignada. Puede ver el historial de actividad de cualquier usuario de la empresa. |
| `VENDEDOR` | Consulta y registro de sus propios movimientos |

### Confirmaciones antes de eliminar
Todas las acciones destructivas requieren confirmación explícita del usuario:
- Eliminar un producto (avisa que se borran sus movimientos y stock)
- Eliminar un movimiento (avisa que el stock se revertirá)
- Eliminar un usuario
- Borrar todos los movimientos y el stock (limpieza de datos)
- Borrar todo el contenido de la empresa (limpieza de datos)

### Historial de actividad por usuario
Desde el panel de Equipo, ADMIN y ENCARGADO pueden ver el historial completo de movimientos de cualquier usuario, con estadísticas por tipo de movimiento.

### Catálogo de productos
- SKU único por empresa + código de barras opcional
- Precio de costo y precio de venta con IVA configurable
- Stock mínimo por producto para activar alertas
- Categorías jerárquicas (padre → hijos)

### Arquitectura multi-tenant
- Cada empresa opera en un espacio completamente aislado (`empresaId` en todas las tablas)
- Planes de suscripción: `trial`, `basico`, `pro`
- Feature flags por empresa (ej: `usaLotes` para farmacias con control de vencimientos)

---

## Stack tecnológico

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.2.9 | Framework full-stack con App Router y Turbopack |
| [React](https://react.dev) | 19.2.4 | UI con Server Components y Actions |
| [TypeScript](https://typescriptlang.org) | 5.x | Tipado estático en todo el proyecto |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Estilos con design system propio vía `@theme inline` |
| Geist Mono | — | Fuente monoespaciada (estética terminal) |

### Backend & datos
| Tecnología | Versión | Rol |
|---|---|---|
| [Prisma](https://prisma.io) | 7.8.0 | ORM con schema declarativo y migraciones |
| [PostgreSQL](https://postgresql.org) | 15+ | Base de datos relacional principal |
| [@prisma/adapter-pg](https://www.prisma.io/docs/orm/overview/databases/postgresql) | 7.8.0 | Driver nativo para conexión directa y pooling |

### Auth
| Tecnología | Versión | Rol |
|---|---|---|
| [Auth.js / NextAuth](https://authjs.dev) | v5 beta | Autenticación con sesiones JWT y adapter Prisma |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.x | Hash seguro de contraseñas |

### Validación
| Tecnología | Versión | Rol |
|---|---|---|
| [Zod](https://zod.dev) | 4.x | Validación de schemas en Server Actions |

---

## Modelo de datos (simplificado)

```
Empresa (tenant)
├── Usuario []         → roles: ADMIN | ENCARGADO | VENDEDOR
├── Sucursal []        → LOCAL | DEPOSITO
├── Categoria []       → árbol jerárquico (padre → hijos)
├── Producto []        → SKU único, precio costo/venta, IVA, stock mínimo
├── Stock []           → cache: cantidad por (Producto × Sucursal)
├── Movimiento []      → fuente de verdad ← ENTRADA | SALIDA | TRANSFERENCIA | AJUSTE
├── Proveedor []       → con CUIT y datos de contacto
├── Cliente []         → con cuenta corriente
├── Compra []          → ítems con costo unitario
└── Venta []           → ítems con IVA, comprobante A/B/C, medio de pago
```

---

## Design system

El diseño sigue una estética **Matrix / neon brutalismo oscuro**, definida íntegramente en `src/app/globals.css` mediante Tailwind CSS v4 `@theme inline`:

```css
--color-canvas:  #050d08   /* fondo principal — negro verdoso profundo */
--color-panel:   #091310   /* cards y sidebars */
--color-panel2:  #0d1a14   /* filas alternas, cabeceras de tabla */
--color-neon:    #00ff88   /* acento principal — verde neon */
--color-danger:  #ff2d55   /* alertas de stock bajo */
--color-warn:    #ffb300   /* transferencias y advertencias */
--color-ink:     #c4edd8   /* texto principal */
--color-fade:    #3a6a4a   /* texto secundario, labels */
--color-rail:    #122018   /* bordes y divisores */
```

Principios de diseño:
- Sin `border-radius` — bordes rectos (brutalismo)
- Glow reservado para números KPI y marca — no en cada elemento
- Tipografía mono en toda la UI para estética terminal
- Opacidades (`/10`, `/30`, `/40`) para capas de profundidad sin saturar

---

## Instalación y desarrollo

### Requisitos
- Node.js 20+
- PostgreSQL 15+ (o cuenta en [Neon](https://neon.tech))

### Setup

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/neurasistemas/stock-neura
cd stock-neura
npm install

# 2. Variables de entorno
cp .env.example .env
# Completar DATABASE_URL, DIRECT_URL y AUTH_SECRET en .env

# 3. Migraciones y generación del cliente Prisma
npx prisma migrate dev
npx prisma generate

# 4. Servidor de desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

### Variables de entorno requeridas

```env
DATABASE_URL=postgresql://user:password@host:5432/stock_neura   # pooled (runtime)
DIRECT_URL=postgresql://user:password@host:5432/stock_neura     # directa (migraciones)
AUTH_SECRET=una_clave_secreta_de_al_menos_32_caracteres
AUTH_TRUST_HOST=true
```

### Scripts

```bash
npm run dev      # servidor de desarrollo con Turbopack (HMR)
npm run build    # build de producción
npm run start    # servidor de producción
npm run lint     # ESLint

npx prisma migrate dev          # aplicar migraciones
npx prisma generate             # regenerar cliente
npx prisma studio               # explorar datos visualmente
npx tsx scripts/smoke.ts        # smoke test contra la base de datos
npx tsx scripts/smoke-stock.ts  # prueba el ciclo entrada→transferencia→salida→ajuste
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx              # Root layout + fuentes Geist
│   ├── globals.css             # Design system completo (Tailwind v4 @theme)
│   ├── page.tsx                # Redirect → /app o /login
│   ├── login/                  # Inicio de sesión
│   ├── registro/               # Alta de empresa y primer admin
│   └── app/                    # Panel autenticado
│       ├── layout.tsx          # Sidebar + nav principal
│       ├── page.tsx            # Dashboard / KPIs (con filtro por sucursal)
│       ├── sucursal-selector.tsx  # Componente cliente: selector de sucursal (todas las vistas)
│       ├── confirm-button.tsx  # Componente cliente: botón con diálogo de confirmación
│       ├── stock/              # Vista de inventario por sucursal (con filtro)
│       ├── productos/          # Catálogo de productos (con confirmación al borrar)
│       ├── movimientos/        # Registro y listado (con filtro por sucursal y confirmación)
│       ├── sucursales/         # Gestión de locales y depósitos
│       ├── historial/          # Log completo de movimientos (ADMIN/ENCARGADO)
│       └── admin/              # Gestión del equipo (con filtro por sucursal)
│           ├── page.tsx        # Lista de usuarios
│           ├── actions.ts      # Acciones: crear, editar, eliminar usuarios
│           ├── add-user-form.tsx
│           ├── role-select.tsx
│           └── [usuarioId]/
│               └── page.tsx    # Historial de actividad del usuario
├── auth.ts                     # Configuración de Auth.js (Node runtime)
├── auth.config.ts              # Config edge-safe (middleware/proxy)
├── proxy.ts                    # Protección de rutas
├── lib/
│   ├── prisma.ts               # Cliente Prisma (singleton)
│   ├── session.ts              # requireUser() — guard de sesión
│   └── stock.ts                # Lógica de actualización de stock en transacción
└── generated/
    └── prisma/                 # Cliente Prisma generado automáticamente
prisma/
└── schema.prisma               # Esquema de datos completo
scripts/
├── smoke.ts                    # Test de conectividad
└── smoke-stock.ts              # Test del ciclo de movimientos
```

---

## Roadmap

- [ ] Import de catálogo desde Excel/CSV
- [ ] Punto de venta (POS) con soporte de comprobantes A/B/C
- [ ] Compras a proveedores con actualización automática de stock
- [ ] Control de lotes y fechas de vencimiento (farmacias, alimentos)
- [ ] Reportes y exportación a PDF
- [ ] API REST pública para integración con sistemas externos
- [ ] Facturación electrónica AFIP
- [ ] App móvil con lectora de código de barras

---

## Licencia

Propiedad de **Neura Sistemas**. Todos los derechos reservados.

---

<div align="center">

Desarrollado con precisión por **Neura Sistemas**

`// control total · trazabilidad completa · sin margen para el error`

</div>
