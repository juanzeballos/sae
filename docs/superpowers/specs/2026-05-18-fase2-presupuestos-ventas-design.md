# Fase 2 — Presupuestos y Ventas: Spec de Diseño

**Fecha:** 2026-05-18
**Rama:** fase2

---

## Objetivo

Agregar los módulos de Presupuestos y Ventas al sistema SAE. Los presupuestos permiten armar un detalle de productos/servicios para un cliente sin afectar el stock. Las ventas descuentan stock y pueden originarse directamente o por conversión de un presupuesto confirmado. Las ventas activas pueden anularse revertiendo el stock.

---

## Decisiones de diseño

| Decisión | Resolución |
|---|---|
| Clientes en Fase 2 | Texto libre (sin entidad). Fase 3 agrega ABM de clientes. |
| Items | Productos del catálogo (PRODUCTO) y servicios manuales (SERVICIO) |
| Descuentos | No en Fase 2. El precio se autocompleta desde el catálogo y es editable. |
| Formas de pago | Solo Efectivo en Fase 2 |
| Numeración | Automática. Presupuestos: 1, 2, 3… Ventas: 1, 2, 3… (secuencias independientes) |
| Anulación de ventas | Sí. Revierte stock automáticamente |
| Formulario presupuesto/venta | Página completa (no modal) — demasiados campos para un Dialog |

---

## Schema de base de datos

**No se necesita nueva migración** — las tablas ya existen en `V1__init_schema.sql`:
- `presupuestos` + `presupuesto_detalles`
- `ventas` + `venta_detalles`

---

## Máquinas de estado

```
Presupuesto:
  BORRADOR → CONFIRMADO → CONVERTIDO
  - Solo BORRADOR puede editarse o eliminarse
  - Solo CONFIRMADO puede convertirse a venta
  - CONVERTIDO es de solo lectura

Venta:
  ACTIVA → ANULADA
  - Solo ACTIVA puede anularse
  - ANULADA es de solo lectura
  - La anulación revierte el stock de todos los items PRODUCTO
```

---

## Reglas de stock

- Presupuesto: **nunca toca el stock**
- Venta nueva (directa o por conversión): registra movimiento SALIDA por cada item de tipo PRODUCTO
- Venta anulada: registra movimiento ENTRADA por cada item de tipo PRODUCTO (revierte)
- Si un producto no tiene stock suficiente al crear la venta: error con mensaje claro

---

## Numeración automática

- Presupuestos: `SELECT MAX(numero) + 1 FROM presupuestos` dentro de transacción `@Transactional`
- Ventas: `SELECT MAX(numero) + 1 FROM ventas` dentro de transacción `@Transactional`
- Primer número es 1 si la tabla está vacía

---

## Backend

### Entidades nuevas

**`Presupuesto.java`** — tabla `presupuestos`
```
id, numero, clienteNombre, fecha (String ISO), estado (enum BORRADOR|CONFIRMADO|CONVERTIDO),
ventaId (nullable), subtotalNeto, totalIva, total
```

**`PresupuestoDetalle.java`** — tabla `presupuesto_detalles`
```
id, presupuesto (ManyToOne), productoId (nullable), tipoItem (enum PRODUCTO|SERVICIO),
descripcionItem, cantidad, precioUnitarioNeto, alicuotaIva, precioUnitario, subtotalNeto, subtotal
```

**`Venta.java`** — tabla `ventas`
```
id, numero, clienteNombre, presupuestoId (nullable), fecha (String ISO),
estado (enum ACTIVA|ANULADA), formaPago (siempre "EFECTIVO" en Fase 2),
subtotalNeto, totalIva, total
```

**`VentaDetalle.java`** — tabla `venta_detalles`
```
id, venta (ManyToOne), productoId (nullable), tipoItem (enum PRODUCTO|SERVICIO),
descripcionItem, cantidad, precioCostoUnitario (nullable), precioUnitarioNeto,
alicuotaIva, precioUnitario, subtotalNeto, subtotal
```

### DTOs

**`PresupuestoDetalleRequest`**
```java
Long productoId        // null si es SERVICIO
String tipoItem        // "PRODUCTO" | "SERVICIO"
String descripcionItem // obligatorio
BigDecimal cantidad
BigDecimal precioUnitarioNeto
Integer alicuotaIva    // 21 | 10 | 0
```

**`PresupuestoRequest`**
```java
String clienteNombre   // obligatorio
String fecha           // ISO date, opcional (default hoy)
List<PresupuestoDetalleRequest> detalles  // mínimo 1
```

**`PresupuestoDetalleResponse`**
```java
Long id, Long productoId, String tipoItem, String descripcionItem
BigDecimal cantidad, BigDecimal precioUnitarioNeto, Integer alicuotaIva
BigDecimal precioUnitario, BigDecimal subtotalNeto, BigDecimal subtotal
```

**`PresupuestoResponse`**
```java
Long id, Integer numero, String clienteNombre, String fecha
String estado, Long ventaId
List<PresupuestoDetalleResponse> detalles
BigDecimal subtotalNeto, BigDecimal totalIva, BigDecimal total
```

**`VentaDetalleResponse`**
```java
Long id, Long productoId, String tipoItem, String descripcionItem
BigDecimal cantidad, BigDecimal precioUnitarioNeto, Integer alicuotaIva
BigDecimal precioUnitario, BigDecimal subtotalNeto, BigDecimal subtotal
```

**`VentaDetalleRequest`** — igual estructura que `PresupuestoDetalleRequest`

**`VentaRequest`**
```java
String clienteNombre   // obligatorio
String fecha           // opcional
List<VentaDetalleRequest> detalles  // mínimo 1
```

**`VentaResponse`**
```java
Long id, Integer numero, String clienteNombre
Long presupuestoId, String fecha, String estado, String formaPago
List<VentaDetalleResponse> detalles
BigDecimal subtotalNeto, BigDecimal totalIva, BigDecimal total
```

### Repositories

- `PresupuestoRepository`: `findAllByOrderByNumeroDesc()`, `findMaxNumero()`
- `PresupuestoDetalleRepository`: `findByPresupuestoId(Long)`
- `VentaRepository`: `findAllByOrderByNumeroDesc()`, `findMaxNumero()`
- `VentaDetalleRepository`: `findByVentaId(Long)`

### Services

**`PresupuestoService`**
- `listar()` → List<PresupuestoResponse>
- `obtener(id)` → PresupuestoResponse
- `crear(request)` → PresupuestoResponse — calcula totales, asigna número automático, estado BORRADOR
- `editar(id, request)` → PresupuestoResponse — solo si BORRADOR, recalcula totales
- `eliminar(id)` — solo si BORRADOR
- `confirmar(id)` → PresupuestoResponse — BORRADOR → CONFIRMADO
- `convertir(id)` → VentaResponse — CONFIRMADO → CONVERTIDO + crea Venta + descuenta stock

**`VentaService`**
- `listar()` → List<VentaResponse>
- `obtener(id)` → VentaResponse
- `crear(request)` → VentaResponse — calcula totales, asigna número, descuenta stock, estado ACTIVA. Para items PRODUCTO, popula `precioCostoUnitario` desde `producto.precioCostoNeto` al momento de la venta (snapshot para futuros reportes de margen)
- `anular(id)` — ACTIVA → ANULADA + revierte stock

**Cálculo de totales (compartido por ambos servicios):**
```
subtotalNeto = Σ (cantidad × precioUnitarioNeto)
totalIva     = Σ (cantidad × precioUnitarioNeto × alicuotaIva / 100)
total        = subtotalNeto + totalIva
```

### Controllers

**`PresupuestoController`** — base `/presupuestos`
```
GET    /                    → listar()
GET    /{id}                → obtener(id)
POST   /                    → crear(request)       201 CREATED
PUT    /{id}                → editar(id, request)
DELETE /{id}                → eliminar(id)         204 NO_CONTENT
POST   /{id}/confirmar      → confirmar(id)
POST   /{id}/convertir      → convertir(id)        201 CREATED
```

**`VentaController`** — base `/ventas`
```
GET    /                    → listar()
GET    /{id}                → obtener(id)
POST   /                    → crear(request)       201 CREATED
POST   /{id}/anular         → anular(id)           204 NO_CONTENT
```

---

## Frontend

### Tipos nuevos (`frontend/src/types/index.ts`)

```typescript
export type EstadoPresupuesto = 'BORRADOR' | 'CONFIRMADO' | 'CONVERTIDO'
export type EstadoVenta = 'ACTIVA' | 'ANULADA'
export type TipoItem = 'PRODUCTO' | 'SERVICIO'

export interface PresupuestoDetalle {
  id: number
  productoId: number | null
  tipoItem: TipoItem
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
  precioUnitario: number
  subtotalNeto: number
  subtotal: number
}

export interface Presupuesto {
  id: number
  numero: number
  clienteNombre: string
  fecha: string
  estado: EstadoPresupuesto
  ventaId: number | null
  detalles: PresupuestoDetalle[]
  subtotalNeto: number
  totalIva: number
  total: number
}

export interface VentaDetalle {
  id: number
  productoId: number | null
  tipoItem: TipoItem
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
  precioUnitario: number
  subtotalNeto: number
  subtotal: number
}

export interface Venta {
  id: number
  numero: number
  clienteNombre: string
  presupuestoId: number | null
  fecha: string
  estado: EstadoVenta
  formaPago: string
  detalles: VentaDetalle[]
  subtotalNeto: number
  totalIva: number
  total: number
}
```

### Servicios nuevos

**`frontend/src/services/presupuestos.ts`**
- `listar()` → Presupuesto[]
- `obtener(id)` → Presupuesto
- `crear(data)` → Presupuesto
- `editar(id, data)` → Presupuesto
- `eliminar(id)` → void
- `confirmar(id)` → Presupuesto
- `convertir(id)` → Venta

**`frontend/src/services/ventas.ts`**
- `listar()` → Venta[]
- `obtener(id)` → Venta
- `crear(data)` → Venta
- `anular(id)` → void

### Páginas nuevas

**`frontend/src/pages/PresupuestosPage.tsx`**
- Lista de presupuestos con filtro por cliente y estado
- Acciones según estado:
  - BORRADOR: editar, confirmar, eliminar
  - CONFIRMADO: ver, convertir a venta
  - CONVERTIDO: ver, navegar a la venta generada
- Navega a `/presupuestos/nuevo` para crear, `/presupuestos/:id/editar` para editar

**`frontend/src/pages/PresupuestoFormPage.tsx`**
- Página completa (no modal)
- Campos: número (readonly), fecha, clienteNombre
- Tabla de items con botones "+ Producto" y "+ Servicio"
  - "+ Producto": abre selector de producto del catálogo; autocompleta descripción, precio y alícuota
  - "+ Servicio": agrega fila vacía editable
  - Precio unitario siempre editable aunque venga del catálogo
- Totales calculados en tiempo real
- Botones: "Cancelar", "Guardar borrador", "Guardar y confirmar"

**`frontend/src/pages/VentasPage.tsx`**
- Lista de ventas con filtro por cliente y estado
- Columna "Origen": "Directa" o "Pres. #N" (con link)
- Acciones: ver (siempre), anular (solo ACTIVA)
- Botón "Nueva venta" navega a `/ventas/nueva`

**`frontend/src/pages/VentaFormPage.tsx`**
- Igual estructura que PresupuestoFormPage
- Sin botones de estado (la venta nace ACTIVA directamente)
- Botón único: "Registrar venta"

### Componentes nuevos

**`frontend/src/components/presupuestos/ProductoSelectorModal.tsx`**
- Dialog para buscar y seleccionar un producto del catálogo
- Buscador + tabla de productos
- Al seleccionar: cierra y devuelve el producto elegido

### Modificaciones a archivos existentes

**`frontend/src/components/layout/AppLayout.tsx`**
- Agregar "Presupuestos" y "Ventas" al sidebar

**`frontend/src/App.tsx`**
- Agregar rutas:
  - `/presupuestos` → PresupuestosPage
  - `/presupuestos/nuevo` → PresupuestoFormPage
  - `/presupuestos/:id/editar` → PresupuestoFormPage
  - `/ventas` → VentasPage
  - `/ventas/nueva` → VentaFormPage

**`backend/src/main/java/com/taller/sae/config/SecurityConfig.java`**
- Agregar `POST` en `/presupuestos/*/confirmar` y `/presupuestos/*/convertir` (ya cubierto por el `authenticated()` global, no requiere cambio)

---

## Archivos a crear

### Backend
```
entity/Presupuesto.java
entity/PresupuestoDetalle.java
entity/Venta.java
entity/VentaDetalle.java
dto/PresupuestoDetalleRequest.java
dto/PresupuestoDetalleResponse.java
dto/PresupuestoRequest.java
dto/PresupuestoResponse.java
dto/VentaDetalleRequest.java
dto/VentaDetalleResponse.java
dto/VentaRequest.java
dto/VentaResponse.java
repository/PresupuestoRepository.java
repository/PresupuestoDetalleRepository.java
repository/VentaRepository.java
repository/VentaDetalleRepository.java
service/PresupuestoService.java
service/VentaService.java
controller/PresupuestoController.java
controller/VentaController.java
```

### Frontend
```
src/services/presupuestos.ts
src/services/ventas.ts
src/pages/PresupuestosPage.tsx
src/pages/PresupuestoFormPage.tsx
src/pages/VentasPage.tsx
src/pages/VentaFormPage.tsx
src/components/presupuestos/ProductoSelectorModal.tsx
```

### Modificar
```
src/types/index.ts           — agregar tipos nuevos
src/App.tsx                  — agregar rutas
src/components/layout/AppLayout.tsx  — agregar items al sidebar
```
