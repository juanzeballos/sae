import api from './api'
import type { Gasto, CategoriaGasto } from '@/types'

export interface GastoRequest {
  fecha: string
  descripcion: string
  monto: number
  categoria: CategoriaGasto
}

export const gastosService = {
  listar: () => api.get<Gasto[]>('/gastos').then(r => r.data),
  obtener: (id: number) => api.get<Gasto>(`/gastos/${id}`).then(r => r.data),
  crear: (data: GastoRequest) => api.post<Gasto>('/gastos', data).then(r => r.data),
  editar: (id: number, data: GastoRequest) => api.put<Gasto>(`/gastos/${id}`, data).then(r => r.data),
  eliminar: (id: number) => api.delete(`/gastos/${id}`),
}
