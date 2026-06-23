# Stock-Neura — Plan Técnico

Sistema SaaS de control de stock e inventario multi-sucursal para negocios
(ferreterías, distribuidoras, farmacias, comercios en general). Multi-empresa,
multi-sucursal, vendible como suscripción.

- **País objetivo:** Argentina (integración AFIP/ARCA en etapa 2)
- **Rubro:** genérico (flexible para varios rubros)
- **Modelo de negocio:** SaaS multi-tenant, suscripción mensual

---

## 1. Stack tecnológico

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + React + TypeScript** | Web responsive que sirve también en mobile; SSR para velocidad |
| UI | **Tailwind CSS + shadcn/ui** | Rápido, prolijo, profesional sin diseñar de cero |
| Backend | **Next.js API routes / Server Actions** | Un solo repo, menos infra que mantener solo |
| ORM | **Prisma** | Migraciones, tipado, productivo |
| Base de datos | **PostgreSQL (Neon)** | Serverless, branches para test, escala sola, barato al arrancar |
| Auth | **Auth.js (NextAuth v5)** | Roles + multi-tenant; gratis, sin dependencia de proveedor externo |
| Hosting | **Vercel + Neon** | Deploy en minutos, costo casi cero al inicio |
| Pagos | **Mercado Pago (suscripciones)** | Estándar en Argentina |

---

## 2. Arquitectura multi-tenant

**Decisión clave:** todos los clientes (empresas) comparten la misma base de
datos, aislados por `empresa_id` (tenant). Es lo más barato de mantener y escala
bien para PyMEs.

- Cada tabla de negocio lleva `empresa_id`.
- Toda query se filtra **siempre** por `empresa_id` del usuario logueado.
- Idealmente aplicar **Row Level Security (RLS)** de Postgres como red de
  seguridad para que nunca se filtren datos entre empresas.

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

---

## 3. Modelo de datos (núcleo)

> Regla de oro: **el stock NUNCA se edita directo.** El stock actual se deriva
> de los movimientos. Eso da auditoría y trazabilidad gratis.

### Tablas principales

```
empresa            id, nombre, cuit, plan, estado, creada_en
usuario            id, empresa_id, email, nombre, rol, sucursal_id?, activo
sucursal           id, empresa_id, nombre, tipo(local|deposito), direccion, activo

categoria          id, empresa_id, nombre, padre_id?
producto           id, empresa_id, sku, codigo_barras, nombre, categoria_id,
                   unidad, precio_costo, precio_venta, iva, stock_minimo, foto_url,
                   activo
                   -- (lote/vencimiento opcional por flag de empresa)

stock              id, empresa_id, producto_id, sucursal_id, cantidad
                   -- UNIQUE(producto_id, sucursal_id); cache derivado de movimientos

movimiento         id, empresa_id, producto_id, sucursal_origen_id?,
                   sucursal_destino_id?, tipo(entrada|salida|transferencia|ajuste),
                   cantidad, costo_unitario?, motivo, usuario_id, ref_tipo, ref_id,
                   creado_en

proveedor          id, empresa_id, nombre, cuit, contacto, ...
cliente            id, empresa_id, nombre, cuit_dni, contacto, cuenta_corriente

compra             id, empresa_id, proveedor_id, sucursal_id, fecha, total, estado
compra_item        id, compra_id, producto_id, cantidad, costo_unitario

venta              id, empresa_id, cliente_id?, sucursal_id, usuario_id, fecha,
                   total, medio_pago, estado, comprobante_tipo, comprobante_nro
venta_item         id, venta_id, producto_id, cantidad, precio_unitario, iva
```

### Cómo se mantiene el stock

1. Toda venta/compra/transferencia/ajuste **genera filas en `movimiento`**.
2. Un trigger (o transacción en código) actualiza el cache en `stock`.
3. El número que ve el dueño = `stock.cantidad` (rápido), reconstruible desde
   `movimiento` (confiable). Periódicamente se puede recalcular para auditar.

---

## 4. Roles y permisos

| Rol | Puede |
|---|---|
| **Dueño / Admin** | Ve TODAS las sucursales, todos los reportes, configura empresa, usuarios, precios |
| **Encargado de sucursal** | Ve y carga movimientos/ventas/compras de SU sucursal; pide transferencias |
| **Vendedor** | Solo carga ventas y consulta stock de su sucursal |

Transferencias entre sucursales con flujo: **solicitar → enviar → recibir**
(confirmación en destino) para que no se pierda stock en el camino.

---

## 5. Roadmap por etapas

### Etapa 0 — Fundaciones (semana 1)
- Setup Next.js + Prisma + Neon + Auth + multi-tenant + RLS
- Onboarding de empresa + primer usuario admin
- CRUD de sucursales y usuarios

### Etapa 1 — MVP vendible (semanas 2–4)
- Catálogo de productos + categorías + import Excel/CSV
- Stock por sucursal (vista central "qué hay y dónde")
- Movimientos: entrada, salida, transferencia, ajuste
- Ventas simples (descuenta stock) + Compras (suma stock)
- Alertas de stock mínimo
- Reportes base: stock valorizado, más vendidos, movimientos por fecha
- **→ Acá ya podés cobrar.**

### Etapa 2 — Completo (mes 2)
- Búsqueda por código de barras (lector USB / cámara)
- Proveedores y clientes con cuenta corriente
- Órdenes de compra + recepción parcial
- Toma de inventario físico (conteo + ajuste masivo)
- Lotes y vencimientos (activable por empresa → habilita farmacias)
- Reportes avanzados: rotación, stock muerto, margen, ranking por sucursal
- Auditoría completa de movimientos

### Etapa 3 — SaaS / monetización (mes 3)
- Planes de suscripción + Mercado Pago + prueba gratis
- Límites por plan (sucursales, usuarios, productos)
- Panel de super-admin (vos, para ver tus clientes)
- Backups automáticos verificados

### Etapa 4 — Diferenciadores (cobra más)
- **Facturación electrónica AFIP/ARCA** (factura A/B/C, CAE)
- App mobile dedicada (PWA o React Native)
- Dashboard con gráficos en tiempo real
- Notificaciones (email/WhatsApp) de stock bajo

---

## 6. Checklist de "vendible de verdad"

- [ ] Multi-tenant real con aislamiento de datos (RLS)
- [ ] Import de catálogo por Excel (que migren en 10 min)
- [ ] Suscripción + prueba gratis + cobro automático
- [ ] Backups automáticos y restore probado
- [ ] Responsive / usable desde el celular en el mostrador
- [ ] Onboarding guiado para el primer uso
- [ ] Términos, privacidad y datos seguros (es plata de la gente)
- [ ] Soporte / canal de contacto

---

## 7. Decisiones abiertas (definir antes de codear)

1. ~~**Auth:** Auth.js (gratis, más laburo) vs Clerk (pago, más rápido).~~ → **Decidido: Auth.js (NextAuth v5)** con adapter de Prisma, sesión por DB y `empresa_id` + `rol` en el token.
2. **Facturación AFIP:** propia (SDK SOAP de AFIP) vs vía API de terceros
   (TusFacturas, Facturante) — recomendado tercero al inicio.
3. **Estrategia de stock:** trigger en DB vs transacción en código (recomendado
   transacción en código con Prisma para mantenerlo claro).
