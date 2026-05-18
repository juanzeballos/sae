import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import { ProductoSelectorModal } from '@/components/presupuestos/ProductoSelectorModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { presupuestosService } from '@/services/presupuestos'
import type { Producto } from '@/types'
import { Trash2, Plus } from 'lucide-react'

interface ItemRow {
  key: string
  productoId?: number
  tipoItem: 'PRODUCTO' | 'SERVICIO'
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
}

function nuevaFila(): ItemRow {
  return {
    key: Math.random().toString(36).slice(2),
    tipoItem: 'SERVICIO',
    descripcionItem: '',
    cantidad: 1,
    precioUnitarioNeto: 0,
    alicuotaIva: 21,
  }
}

function PresupuestoFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEdit = !!id

  const [clienteNombre, setClienteNombre] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<ItemRow[]>([])
  const [numero, setNumero] = useState<string | null>(null)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    presupuestosService.obtener(Number(id))
      .then(p => {
        setClienteNombre(p.clienteNombre)
        setFecha(p.fecha)
        setNumero(p.numero)
        setItems(p.detalles.map(d => ({
          key: String(d.id),
          productoId: d.productoId ?? undefined,
          tipoItem: d.tipoItem,
          descripcionItem: d.descripcionItem,
          cantidad: d.cantidad,
          precioUnitarioNeto: d.precioUnitarioNeto,
          alicuotaIva: d.alicuotaIva,
        })))
      })
      .catch(() => {
        toast({ title: 'Error al cargar presupuesto', variant: 'destructive' })
        navigate('/presupuestos')
      })
  }, [id])

  const { subtotalNeto, totalIva, total } = useMemo(() => {
    let sn = 0, iv = 0
    for (const item of items) {
      const itemSn = item.cantidad * item.precioUnitarioNeto
      sn += itemSn
      iv += itemSn * item.alicuotaIva / 100
    }
    return { subtotalNeto: sn, totalIva: iv, total: sn + iv }
  }, [items])

  function addProducto(producto: Producto) {
    setItems(prev => [...prev, {
      key: Math.random().toString(36).slice(2),
      productoId: producto.id,
      tipoItem: 'PRODUCTO',
      descripcionItem: producto.nombre,
      cantidad: 1,
      precioUnitarioNeto: producto.precioVentaNeto,
      alicuotaIva: producto.alicuotaIva,
    }])
  }

  function updateItem(key: string, field: keyof ItemRow, value: string | number) {
    setItems(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item))
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(item => item.key !== key))
  }

  async function guardar(confirmar: boolean) {
    if (!clienteNombre.trim()) {
      toast({ title: 'El nombre del cliente es obligatorio', variant: 'destructive' })
      return
    }
    if (items.length === 0) {
      toast({ title: 'Agregue al menos un ítem', variant: 'destructive' })
      return
    }

    const request = {
      clienteNombre,
      fecha,
      detalles: items.map(item => ({
        productoId: item.productoId,
        tipoItem: item.tipoItem,
        descripcionItem: item.descripcionItem,
        cantidad: item.cantidad,
        precioUnitarioNeto: item.precioUnitarioNeto,
        alicuotaIva: item.alicuotaIva,
      })),
    }

    setSaving(true)
    try {
      const saved = isEdit
        ? await presupuestosService.editar(Number(id), request)
        : await presupuestosService.crear(request)

      if (confirmar) {
        await presupuestosService.confirmar(saved.id)
      }

      toast({ title: isEdit ? 'Presupuesto actualizado' : 'Presupuesto creado' })
      navigate('/presupuestos')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al guardar'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">
          {isEdit ? `Editar presupuesto${numero ? ` #${numero}` : ''}` : 'Nuevo presupuesto'}
        </h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <Label>Nro</Label>
            <Input value={numero ?? 'Automático'} readOnly className="bg-slate-100" />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Cliente *</Label>
            <Input
              placeholder="Nombre del cliente"
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-24">Cant.</TableHead>
                <TableHead className="w-36">Precio neto</TableHead>
                <TableHead className="w-24">IVA %</TableHead>
                <TableHead className="w-32 text-right">Subtotal</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const precioConIva = item.precioUnitarioNeto * (1 + item.alicuotaIva / 100)
                const subtotal = item.cantidad * precioConIva
                return (
                  <TableRow key={item.key}>
                    <TableCell>
                      <Input
                        value={item.descripcionItem}
                        onChange={e => updateItem(item.key, 'descripcionItem', e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0.01} step={0.01}
                        value={item.cantidad}
                        onChange={e => updateItem(item.key, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number" min={0} step={0.01}
                        value={item.precioUnitarioNeto}
                        onChange={e => updateItem(item.key, 'precioUnitarioNeto', parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(item.alicuotaIva)}
                        onValueChange={v => updateItem(item.key, 'alicuotaIva', Number(v))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="10">10.5%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => removeItem(item.key)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    Sin ítems. Use los botones de abajo para agregar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setSelectorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Producto
          </Button>
          <Button variant="outline" size="sm" onClick={() => setItems(prev => [...prev, nuevaFila()])}>
            <Plus className="h-4 w-4 mr-1" /> Servicio
          </Button>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal neto:</span>
              <span className="font-mono">${subtotalNeto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA:</span>
              <span className="font-mono">${totalIva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total:</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/presupuestos')}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => guardar(false)} disabled={saving}>
            Guardar borrador
          </Button>
          <Button onClick={() => guardar(true)} disabled={saving}>
            Guardar y confirmar
          </Button>
        </div>
      </div>

      <ProductoSelectorModal
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={addProducto}
      />
    </AppLayout>
  )
}

export default PresupuestoFormPage
