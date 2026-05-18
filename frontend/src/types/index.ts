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
  apellido: string
  dniCuil?: string
  telefono?: string
  razonSocial?: string
  condicionFiscal?: 'CONSUMIDOR_FINAL' | 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTISTA' | 'EXENTO'
  observaciones?: string
  activo: boolean
}

export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'OTRO'
export type TipoItem = 'PRODUCTO' | 'SERVICIO'
export type EstadoVenta = 'ACTIVA' | 'ANULADA'
export type EstadoPresupuesto = 'BORRADOR' | 'CONFIRMADO' | 'CONVERTIDO'
