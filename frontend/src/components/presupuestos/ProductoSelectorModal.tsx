import { useState, useEffect, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { productosService } from '@/services/productos'
import type { Producto } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (producto: Producto) => void
}

export function ProductoSelectorModal({ open, onClose, onSelect }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (open) {
      productosService.listar().then(setProductos).catch(() => {})
      setBusqueda('')
    }
  }, [open])

  const filtrados = useMemo(() => {
    if (!busqueda) return productos
    const q = busqueda.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.codigo ?? '').toLowerCase().includes(q) ||
      (p.marca ?? '').toLowerCase().includes(q)
    )
  }, [productos, busqueda])

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar producto</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Buscar por nombre, código o marca..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoFocus
        />

        <div className="max-h-96 overflow-auto mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(p => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => { onSelect(p); onClose() }}
                >
                  <TableCell>{p.codigo ?? '-'}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell>{p.marca ?? '-'}</TableCell>
                  <TableCell className="text-right font-mono">${p.precioVenta.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.stockActual}</TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-6">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
