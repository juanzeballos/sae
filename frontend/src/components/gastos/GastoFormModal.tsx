import { useEffect, useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Gasto, CategoriaGasto } from '@/types'
import type { GastoRequest } from '@/services/gastos'

const CATEGORIAS: CategoriaGasto[] = ['MATERIALES', 'SERVICIOS', 'IMPUESTOS', 'SUELDOS', 'OTROS']

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: GastoRequest) => Promise<void>
  gasto?: Gasto | null
}

function GastoFormModal({ open, onClose, onSave, gasto }: Props) {
  const isEditing = gasto != null

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState<CategoriaGasto>('MATERIALES')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (gasto) {
      setFecha(gasto.fecha)
      setDescripcion(gasto.descripcion)
      setMonto(String(gasto.monto))
      setCategoria(gasto.categoria)
    } else {
      setFecha(new Date().toISOString().slice(0, 10))
      setDescripcion('')
      setMonto('')
      setCategoria('MATERIALES')
    }
  }, [gasto, open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        fecha,
        descripcion,
        monto: parseFloat(monto),
        categoria,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Fecha */}
            <div className="space-y-1">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
              />
            </div>

            {/* Monto */}
            <div className="space-y-1">
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                required
                placeholder="0.00"
              />
            </div>

            {/* Descripción (full width) */}
            <div className="space-y-1 col-span-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                required
                placeholder="Descripción del gasto"
              />
            </div>

            {/* Categoría (full width) */}
            <div className="space-y-1 col-span-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={categoria}
                onValueChange={v => setCategoria(v as CategoriaGasto)}
              >
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {CATEGORIAS.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default GastoFormModal
