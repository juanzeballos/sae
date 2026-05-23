import { useEffect, useState, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import GastoFormModal from '@/components/gastos/GastoFormModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { gastosService, type GastoRequest } from '@/services/gastos'
import type { Gasto, CategoriaGasto } from '@/types'
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react'

const CATEGORIA_BADGE: Record<CategoriaGasto, string> = {
  MATERIALES: 'bg-slate-100 text-slate-700',
  SERVICIOS: 'bg-blue-100 text-blue-700',
  IMPUESTOS: 'bg-red-100 text-red-700',
  SUELDOS: 'bg-green-100 text-green-700',
  OTROS: 'bg-amber-100 text-amber-700',
}

function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaGasto | 'TODAS'>('TODAS')
  const [formModal, setFormModal] = useState<{ open: boolean; gasto: Gasto | null }>({
    open: false, gasto: null,
  })

  const { toast } = useToast()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      setGastos(await gastosService.listar())
    } catch {
      toast({ title: 'Error al cargar gastos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const gastosFiltrados = useMemo(() =>
    gastos
      .filter(g => filtroCategoria === 'TODAS' || g.categoria === filtroCategoria)
      .filter(g => {
        if (!busqueda) return true
        return g.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      }),
    [gastos, busqueda, filtroCategoria]
  )

  async function handleSave(data: GastoRequest) {
    try {
      if (formModal.gasto) {
        const actualizado = await gastosService.editar(formModal.gasto.id, data)
        setGastos(prev => prev.map(g => g.id === actualizado.id ? actualizado : g))
        toast({ title: 'Gasto actualizado' })
      } else {
        const nuevo = await gastosService.crear(data)
        setGastos(prev => [...prev, nuevo])
        toast({ title: 'Gasto creado' })
      }
      setFormModal({ open: false, gasto: null })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al guardar'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  async function handleEliminar(gasto: Gasto) {
    if (!confirm(`¿Eliminar "${gasto.descripcion}"?`)) return
    try {
      await gastosService.eliminar(gasto.id)
      setGastos(prev => prev.filter(g => g.id !== gasto.id))
      toast({ title: 'Gasto eliminado' })
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Gastos</h1>
          <Button onClick={() => setFormModal({ open: true, gasto: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo gasto
          </Button>
        </div>

        <div className="flex gap-3 mb-3">
          <Input
            placeholder="Buscar por descripción..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filtroCategoria}
            onValueChange={v => setFiltroCategoria(v as CategoriaGasto | 'TODAS')}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="TODAS">Todas las categorías</SelectItem>
              <SelectItem value="MATERIALES">MATERIALES</SelectItem>
              <SelectItem value="SERVICIOS">SERVICIOS</SelectItem>
              <SelectItem value="IMPUESTOS">IMPUESTOS</SelectItem>
              <SelectItem value="SUELDOS">SUELDOS</SelectItem>
              <SelectItem value="OTROS">OTROS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Total del período: <span className="font-semibold">${gastosFiltrados.reduce((s, g) => s + g.monto, 0).toFixed(2)}</span>
          {' '}({gastosFiltrados.length} gasto{gastosFiltrados.length !== 1 ? 's' : ''})
        </p>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : gastos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
            <Receipt className="h-12 w-12" />
            <p>No hay gastos registrados</p>
            <Button variant="outline" onClick={() => setFormModal({ open: true, gasto: null })}>
              Registrar el primer gasto
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastosFiltrados.map(g => (
                <TableRow key={g.id}>
                  <TableCell>{g.fecha}</TableCell>
                  <TableCell>{g.descripcion}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORIA_BADGE[g.categoria]}`}>
                      {g.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">${g.monto.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost" size="icon"
                        title="Editar"
                        onClick={() => setFormModal({ open: true, gasto: g })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        title="Eliminar"
                        onClick={() => handleEliminar(g)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {gastosFiltrados.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-10">
                    Sin resultados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <GastoFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, gasto: null })}
        onSave={handleSave}
        gasto={formModal.gasto}
      />
    </AppLayout>
  )
}

export default GastosPage
