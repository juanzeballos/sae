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
import { ventasService } from '@/services/ventas'
import type { Venta, EstadoVenta } from '@/types'
import { Plus, Ban } from 'lucide-react'

const BADGE: Record<EstadoVenta, string> = {
  ACTIVA: 'bg-green-100 text-green-700',
  ANULADA: 'bg-red-100 text-red-600',
}

function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoVenta | 'TODOS'>('TODOS')
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      setVentas(await ventasService.listar())
    } catch {
      toast({ title: 'Error al cargar ventas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filtradas = useMemo(() =>
    ventas
      .filter(v => filtroEstado === 'TODOS' || v.estado === filtroEstado)
      .filter(v => {
        if (!busqueda) return true
        const q = busqueda.toLowerCase()
        return v.clienteNombre.toLowerCase().includes(q) || v.numero.includes(q) || v.fecha.includes(q)
      }),
    [ventas, busqueda, filtroEstado]
  )

  async function handleAnular(id: number) {
    if (!confirm('¿Anular esta venta? Se revertirá el stock.')) return
    try {
      await ventasService.anular(id)
      await cargar()
      toast({ title: 'Venta anulada' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al anular'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Ventas</h1>
          <Button onClick={() => navigate('/ventas/nueva')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva venta
          </Button>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Buscar por cliente, número o fecha..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filtroEstado}
            onValueChange={v => setFiltroEstado(v as EstadoVenta | 'TODOS')}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="ACTIVA">Activa</SelectItem>
              <SelectItem value="ANULADA">Anulada</SelectItem>
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
                <TableHead>Origen</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-slate-600">#{v.numero}</TableCell>
                  <TableCell>{v.clienteNombre}</TableCell>
                  <TableCell>
                    {v.presupuestoId ? (
                      <Link to="/presupuestos" className="text-blue-600 hover:underline text-sm">
                        Pres. #{v.presupuestoId}
                      </Link>
                    ) : (
                      <span className="text-slate-500 text-sm">Directa</span>
                    )}
                  </TableCell>
                  <TableCell>{v.fecha}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${BADGE[v.estado]}`}>
                      {v.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">${v.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {v.estado === 'ACTIVA' && (
                      <Button size="sm" variant="ghost" onClick={() => handleAnular(v.id)}
                        title="Anular venta">
                        <Ban className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtradas.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-10">
                    No hay ventas
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

export default VentasPage
