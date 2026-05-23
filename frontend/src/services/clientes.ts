import api from './api'
import type { Cliente } from '@/types'

export interface ClienteRequest {
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
}

export const clientesService = {
  listar: () =>
    api.get<Cliente[]>('/clientes').then(r => r.data),

  obtener: (id: number) =>
    api.get<Cliente>(`/clientes/${id}`).then(r => r.data),

  crear: (data: ClienteRequest) =>
    api.post<Cliente>('/clientes', data).then(r => r.data),

  editar: (id: number, data: ClienteRequest) =>
    api.put<Cliente>(`/clientes/${id}`, data).then(r => r.data),

  eliminar: (id: number) =>
    api.delete(`/clientes/${id}`),
}
