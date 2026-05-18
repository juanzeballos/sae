import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { presupuestosService } from '@/services/presupuestos'
import type { Presupuesto, EstadoPresupuesto } from '@/types'
import { Plus, Pencil, CheckCircle, ArrowRightCircle, Trash2, ExternalLink } from 'lucide-react'

const BADGE: Record<EstadoPresupuesto, string> = {
  BORRADOR: 'bg-slate-200 text-slate-700',
  CONFIRMADO: 'bg-blue-100 text-blue-700',
  CONVERTIDO: 'bg-green-100 text-green-700',
}

function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoPresupuesto | 'TODOS'>('TODOS')
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      setPresupuestos(await presupuestosService.listar())
    } catch {
      toast({ title: 'Error al cargar presupuestos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filtrados = useMemo(() =>
    presupuestos
      .filter(p => filtroEstado === 'TODOS' || p.estado === filtroEstado)
      .filter(p => {
        if (!busqueda) return true
        const q = busqueda.toLowerCase()
        return p.clienteNombre.toLowerCase().includes(q) || p.numero.includes(q)
      }),
    [presupuestos, busqueda, filtroEstado]
  )

  function errMsg(err: unknown) {
    return (err as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? 'Error'
  }

  async function handleConfirmar(id: number) {
    try {
      const actualizado = await presupuestosService.confirmar(id)
      setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, estado: actualizado.estado } : p))
      toast({ title: 'Presupuesto confirmado' })
    } catch (err) {
      toast({ title: errMsg(err), variant: 'destructive' })
    }
  }

  async function handleConvertir(id: number) {
    try {
      const venta = await presupuestosService.convertir(id)
      await cargar()
      toast({ title: `Venta #${venta.numero} creada` })
    } catch (err) {
      toast({ title: errMsg(err), variant: 'destructive' })
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este presupuesto?')) return
    try {
      await presupuestosService.eliminar(id)
      setPresupuestos(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Presupuesto eliminado' })
    } catch (err) {
      toast({ title: errMsg(err), variant: 'destructive' })
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Presupuestos</h1>
          <Button onClick={() => navigate('/presupuestos/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo presupuesto
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Buscar por cliente o número..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filtroEstado}
            onValueChange={v => setFiltroEstado(v as EstadoPresupuesto | 'TODOS')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="BORRADOR">Borrador</SelectItem>
              <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
              <SelectItem value="CONVERTIDO">Convertido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nro</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-slate-600">#{p.numero}</TableCell>
                  <TableCell>{p.clienteNombre}</TableCell>
                  <TableCell>{p.fecha}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${BADGE[p.estado]}`}>
                      {p.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">${p.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {p.estado === 'BORRADOR' && (
                        <>
                          <Button size="sm" variant="ghost"
                            onClick={() => navigate(`/presupuestos/${p.id}/editar`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleConfirmar(p.id)}>
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEliminar(p.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      {p.estado === 'CONFIRMADO' && (
                        <Button size="sm" variant="outline" onClick={() => handleConvertir(p.id)}>
                          <ArrowRightCircle className="h-4 w-4 mr-1 text-green-600" />
                          Convertir a venta
                        </Button>
                      )}
                      {p.estado === 'CONVERTIDO' && (
                        <Link to="/ventas">
                          <Button size="sm" variant="ghost" title="Ver venta generada">
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-10">
                    No hay presupuestos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </AppLayout>
  )
}

export default PresupuestosPage
