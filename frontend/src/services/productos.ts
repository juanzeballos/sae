import api from './api'
import type { Producto } from '@/types'

export interface ProductoRequest {
  codigo?: string
  nombre: string
  descripcion?: string
  marca?: string
  precioCostoNeto?: number
  precioVentaNeto: number
  alicuotaIva?: number
  precioVenta: number
  stockInicial?: number
  stockMinimo?: number
}

export const productosService = {
  listar: () =>
    api.get<Producto[]>('/productos').then(r => r.data),

  obtener: (id: number) =>
    api.get<Producto>(`/productos/${id}`).then(r => r.data),

  crear: (data: ProductoRequest) =>
    api.post<Producto>('/productos', data).then(r => r.data),

  editar: (id: number, data: ProductoRequest) =>
    api.put<Producto>(`/productos/${id}`, data).then(r => r.data),

  eliminar: (id: number) =>
    api.delete(`/productos/${id}`),

  ajustarStock: (id: number, cantidad: number, observacion?: string) =>
    api.patch<Producto>(`/productos/${id}/stock`, { cantidad, observacion }).then(r => r.data),
}
