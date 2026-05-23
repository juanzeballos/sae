import { useEffect, useState, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ClienteFormModal from '@/components/clientes/ClienteFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { clientesService, type ClienteRequest } from '@/services/clientes'
import type { Cliente } from '@/types'
import { UserPlus, Pencil, Trash2, UserRound, Search } from 'lucide-react'

function ClientesPage() {
  // Estado principal de la página
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  // Estado del modal: null = cerrado, Cliente = editar ese cliente
  const [formModal, setFormModal] = useState<{ open: boolean; cliente: Cliente | null }>({
    open: false, cliente: null,
  })

  const clientesFiltrados = useMemo(() => {
    if (busqueda === '') return clientes
    const q = busqueda.toLowerCase()
    return clientes.filter(c =>
      [c.nombre, c.telefono, c.email]
        .some(campo => campo?.toLowerCase().includes(q))
    )
  }, [clientes, busqueda])

  const { toast } = useToast()

  // Carga la lista de clientes al montar el componente (una vez)
  // useEffect con [] vacío = equivalente a @PostConstruct en Java
  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    try {
      const data = await clientesService.listar()
      setClientes(data)
    } catch {
      toast({ title: 'Error al cargar clientes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers de acciones ──────────────────────────────────────────────────

  async function handleSaveCliente(data: ClienteRequest) {
    try {
      if (formModal.cliente) {
        const actualizado = await clientesService.editar(formModal.cliente.id, data)
        setClientes(prev => prev.map(c => c.id === actualizado.id ? actualizado : c))
        toast({ title: 'Cliente actualizado' })
      } else {
        const nuevo = await clientesService.crear(data)
        setClientes(prev => [...prev, nuevo])
        toast({ title: 'Cliente creado' })
      }
      setFormModal({ open: false, cliente: null })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al guardar'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  async function handleEliminar(cliente: Cliente) {
    if (!confirm(`¿Eliminar "${cliente.nombre}"?`)) return
    try {
      await clientesService.eliminar(cliente.id)
      setClientes(prev => prev.filter(c => c.id !== cliente.id))
      toast({ title: 'Cliente eliminado' })
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Header de la página */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              {clientesFiltrados.length < clientes.length
                ? `${clientesFiltrados.length} de ${clientes.length} clientes`
                : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <Button onClick={() => setFormModal({ open: true, cliente: null })}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo cliente
          </Button>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
            <UserRound className="h-12 w-12" />
            <p>No hay clientes todavía</p>
            <Button variant="outline" onClick={() => setFormModal({ open: true, cliente: null })}>
              Crear el primer cliente
            </Button>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
            <Search className="h-12 w-12" />
            <p>Sin resultados para "{busqueda}"</p>
            <Button variant="outline" onClick={() => setBusqueda('')}>
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.telefono ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {/* Editar */}
                        <Button
                          variant="ghost" size="icon"
                          title="Editar"
                          onClick={() => setFormModal({ open: true, cliente: c })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Eliminar */}
                        <Button
                          variant="ghost" size="icon"
                          title="Eliminar"
                          onClick={() => handleEliminar(c)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ClienteFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, cliente: null })}
        onSave={handleSaveCliente}
        cliente={formModal.cliente}
      />
    </AppLayout>
  )
}

export default ClientesPage
