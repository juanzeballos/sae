// ─── Tipos base del sistema SAE ──────────────────────────────────────────────
// En TypeScript, los "types" e "interfaces" son como clases DTO en Java.
// Le dicen al compilador qué forma tiene un objeto.

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  username: string
}

// Refleja el ProductoResponse del backend (incluye stock)
export interface Producto {
  id: number
  codigo?: string
  nombre: string
  descripcion?: string
  marca?: string
  precioCostoNeto?: number
  precioVentaNeto: number
  alicuotaIva: number
  precioVenta: number
  activo: boolean
  stockActual: number
  stockMinimo: number
}

export interface Cliente {
  id: number
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  fechaAlta?: string
  activo: boolean
}

export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'OTRO'
export type TipoItem = 'PRODUCTO' | 'SERVICIO'
export type EstadoVenta = 'ACTIVA' | 'ANULADA'
export type EstadoPresupuesto = 'BORRADOR' | 'CONFIRMADO' | 'CONVERTIDO'

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
  numero: string
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
  numero: string
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

export type CategoriaGasto = 'MATERIALES' | 'SERVICIOS' | 'IMPUESTOS' | 'SUELDOS' | 'OTROS'

export interface Gasto {
  id: number
  fecha: string
  descripcion: string
  monto: number
  categoria: CategoriaGasto
}
