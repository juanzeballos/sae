import api from './api'
import type { Presupuesto, Venta, TipoItem } from '@/types'
import type { VentaRequest } from './ventas'

export interface PresupuestoDetalleRequest {
  productoId: number | null
  tipoItem: TipoItem
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
}

export interface PresupuestoRequest {
  clienteNombre: string
  fecha?: string
  detalles: PresupuestoDetalleRequest[]
}

export const presupuestosService = {
  listar: () =>
    api.get<Presupuesto[]>('/presupuestos').then(r => r.data),

  obtener: (id: number) =>
    api.get<Presupuesto>(`/presupuestos/${id}`).then(r => r.data),

  crear: (data: PresupuestoRequest) =>
    api.post<Presupuesto>('/presupuestos', data).then(r => r.data),

  editar: (id: number, data: PresupuestoRequest) =>
    api.put<Presupuesto>(`/presupuestos/${id}`, data).then(r => r.data),

  eliminar: (id: number) =>
    api.delete(`/presupuestos/${id}`),

  confirmar: (id: number) =>
    api.post<Presupuesto>(`/presupuestos/${id}/confirmar`).then(r => r.data),

  convertir: (id: number) =>
    api.post<Venta>(`/presupuestos/${id}/convertir`).then(r => r.data),

  convertirConDatos: (id: number, ventaRequest: VentaRequest) =>
    api.post<Venta>(`/presupuestos/${id}/convertir`, ventaRequest).then(r => r.data),
}
