import api from './api'
import type { Venta, TipoItem } from '@/types'

export interface VentaDetalleRequest {
  productoId: number | null
  tipoItem: TipoItem
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
}

export interface VentaRequest {
  clienteNombre: string
  fecha?: string
  detalles: VentaDetalleRequest[]
}

export const ventasService = {
  listar: () =>
    api.get<Venta[]>('/ventas').then(r => r.data),

  obtener: (id: number) =>
    api.get<Venta>(`/ventas/${id}`).then(r => r.data),

  crear: (data: VentaRequest) =>
    api.post<Venta>('/ventas', data).then(r => r.data),

  anular: (id: number) =>
    api.post(`/ventas/${id}/anular`).then(() => undefined),
}
