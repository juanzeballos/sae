import { useEffect, useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Producto } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (cantidad: number, observacion: string) => Promise<void>
  producto: Producto | null
}

function AjusteStockModal({ open, onClose, onSave, producto }: Props) {
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')
  const [saving, setSaving] = useState(false)

  // Sincronizar el campo con el stock actual cada vez que cambia el producto
  useEffect(() => {
    if (producto) {
      setCantidad(String(producto.stockActual))
      setObservacion('')
    }
  }, [producto])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(parseFloat(cantidad), observacion)
      setCantidad('')
      setObservacion('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar stock</DialogTitle>
        </DialogHeader>
        {producto && (
          <p className="text-sm text-muted-foreground">
            {producto.nombre} — Stock actual: <strong>{producto.stockActual}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="cantidad">Nueva cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              step="0.01"
              min="0"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="obs">Observación</Label>
            <Input
              id="obs"
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="Inventario físico, corrección, etc."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AjusteStockModal
