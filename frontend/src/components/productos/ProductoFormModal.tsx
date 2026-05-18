import { useEffect, useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Producto } from '@/types'
import type { ProductoRequest } from '@/services/productos'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ProductoRequest) => Promise<void>
  producto?: Producto | null   // null = modo crear, Producto = modo editar
}

// ProductoFormModal: dialog reutilizable para crear y editar productos.
// Recibe el producto a editar (o null para crear) y llama a onSave con los datos del form.
function ProductoFormModal({ open, onClose, onSave, producto }: Props) {
  const isEditing = producto != null

  // useState para cada campo del formulario
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [marca, setMarca] = useState('')
  const [precioVentaNeto, setPrecioVentaNeto] = useState('')
  const [alicuotaIva, setAlicuotaIva] = useState('21')
  const [precioVenta, setPrecioVenta] = useState('')
  const [stockInicial, setStockInicial] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [saving, setSaving] = useState(false)

  // useEffect: cuando el modal se abre, carga los datos del producto a editar.
  // El array de dependencias [producto] hace que se ejecute cada vez que cambia "producto".
  // Es como un @PostConstruct que se re-ejecuta cuando cambia el estado.
  useEffect(() => {
    if (producto) {
      setCodigo(producto.codigo ?? '')
      setNombre(producto.nombre)
      setDescripcion(producto.descripcion ?? '')
      setMarca(producto.marca ?? '')
      setPrecioVentaNeto(String(producto.precioVentaNeto))
      setAlicuotaIva(String(producto.alicuotaIva))
      setPrecioVenta(String(producto.precioVenta))
      setStockMinimo(String(producto.stockMinimo))
      setStockInicial('')   // no se edita el stock desde acá
    } else {
      // Modo crear: limpiar todos los campos
      setCodigo(''); setNombre(''); setDescripcion(''); setMarca('')
      setPrecioVentaNeto(''); setAlicuotaIva('21'); setPrecioVenta('')
      setStockInicial(''); setStockMinimo('')
    }
  }, [producto, open])

  // Calcula el precio con IVA automáticamente cuando cambia el neto o la alícuota
  function handleNetoChange(value: string) {
    setPrecioVentaNeto(value)
    const neto = parseFloat(value)
    const iva = parseFloat(alicuotaIva) || 0
    if (!isNaN(neto)) {
      setPrecioVenta((neto * (1 + iva / 100)).toFixed(2))
    }
  }

  function handleIvaChange(value: string) {
    setAlicuotaIva(value)
    const neto = parseFloat(precioVentaNeto)
    const iva = parseFloat(value) || 0
    if (!isNaN(neto)) {
      setPrecioVenta((neto * (1 + iva / 100)).toFixed(2))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        codigo: codigo || undefined,
        nombre,
        descripcion: descripcion || undefined,
        marca: marca || undefined,
        precioVentaNeto: parseFloat(precioVentaNeto),
        alicuotaIva: parseInt(alicuotaIva),
        precioVenta: parseFloat(precioVenta),
        stockInicial: stockInicial ? parseFloat(stockInicial) : undefined,
        stockMinimo: stockMinimo ? parseFloat(stockMinimo) : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Código */}
            <div className="space-y-1">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" value={codigo} onChange={e => setCodigo(e.target.value)}
                placeholder="BAT-12V" />
            </div>
            {/* Nombre */}
            <div className="space-y-1">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)}
                required placeholder="Batería 12V 60Ah" />
            </div>
            {/* Marca */}
            <div className="space-y-1">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" value={marca} onChange={e => setMarca(e.target.value)}
                placeholder="BOSCH" />
            </div>
            {/* Precio neto → calcula el precio con IVA automáticamente */}
            <div className="space-y-1">
              <Label htmlFor="neto">Precio neto (sin IVA) $ *</Label>
              <Input id="neto" type="number" step="0.01" min="0.01"
                value={precioVentaNeto} onChange={e => handleNetoChange(e.target.value)}
                required />
            </div>
            {/* Alícuota IVA */}
            <div className="space-y-1">
              <Label htmlFor="iva">IVA %</Label>
              <select
                id="iva"
                value={alicuotaIva}
                onChange={e => handleIvaChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="21">21%</option>
                <option value="10">10.5%</option>
                <option value="0">Exento (0%)</option>
              </select>
            </div>
            {/* Precio con IVA (calculado automáticamente) */}
            <div className="space-y-1 col-span-2">
              <Label htmlFor="coniva">Precio venta (con IVA) $ *</Label>
              <Input id="coniva" type="number" step="0.01" min="0.01"
                value={precioVenta} onChange={e => setPrecioVenta(e.target.value)}
                required />
            </div>
            {/* Stock inicial: solo al crear */}
            {!isEditing && (
              <div className="space-y-1">
                <Label htmlFor="stockInicial">Stock inicial</Label>
                <Input id="stockInicial" type="number" step="0.01" min="0"
                  value={stockInicial} onChange={e => setStockInicial(e.target.value)}
                  placeholder="0" />
              </div>
            )}
            {/* Stock mínimo */}
            <div className="space-y-1">
              <Label htmlFor="stockMinimo">Stock mínimo</Label>
              <Input id="stockMinimo" type="number" step="0.01" min="0"
                value={stockMinimo} onChange={e => setStockMinimo(e.target.value)}
                placeholder="0" />
            </div>
            {/* Descripción */}
            <div className="space-y-1 col-span-2">
              <Label htmlFor="desc">Descripción</Label>
              <Input id="desc" value={descripcion} onChange={e => setDescripcion(e.target.value)}
                placeholder="Descripción opcional" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProductoFormModal
