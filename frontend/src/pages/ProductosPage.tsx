import { useEffect, useState, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import ProductoFormModal from '@/components/productos/ProductoFormModal'
import AjusteStockModal from '@/components/productos/AjusteStockModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { productosService, type ProductoRequest } from '@/services/productos'
import type { Producto } from '@/types'
import { Plus, Pencil, Trash2, PackageSearch, Search } from 'lucide-react'

function ProductosPage() {
  // Estado principal de la página
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [soloConStock, setSoloConStock] = useState(true)

  // Estado de los modales: null = cerrado, Producto = editar ese producto
  const [formModal, setFormModal] = useState<{ open: boolean; producto: Producto | null }>({
    open: false, producto: null,
  })
  const [ajusteModal, setAjusteModal] = useState<{ open: boolean; producto: Producto | null }>({
    open: false, producto: null,
  })

  const productosFiltrados = useMemo(() => {
    return productos
      .filter(p => !soloConStock || p.stockActual > 0)
      .filter(p => {
        if (busqueda === '') return true
        const q = busqueda.toLowerCase()
        return [p.codigo, p.nombre, p.descripcion, p.marca]
          .some(campo => campo?.toLowerCase().includes(q))
      })
  }, [productos, busqueda, soloConStock])

  const { toast } = useToast()

  // Carga la lista de productos al montar el componente (una vez)
  // useEffect con [] vacío = equivalente a @PostConstruct
  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    try {
      const data = await productosService.listar()
      setProductos(data)
    } catch {
      toast({ title: 'Error al cargar productos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers de acciones ──────────────────────────────────────────────────

  async function handleSaveProducto(data: ProductoRequest) {
    try {
      if (formModal.producto) {
        const actualizado = await productosService.editar(formModal.producto.id, data)
        setProductos(prev => prev.map(p => p.id === actualizado.id ? actualizado : p))
        toast({ title: 'Producto actualizado' })
      } else {
        const nuevo = await productosService.crear(data)
        setProductos(prev => [...prev, nuevo])
        toast({ title: 'Producto creado' })
      }
      setFormModal({ open: false, producto: null })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al guardar'
      toast({ title: msg, variant: 'destructive' })
    }
  }

  async function handleEliminar(producto: Producto) {
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return
    try {
      await productosService.eliminar(producto.id)
      setProductos(prev => prev.filter(p => p.id !== producto.id))
      toast({ title: 'Producto eliminado' })
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  async function handleAjusteStock(cantidad: number, observacion: string) {
    if (!ajusteModal.producto) return
    try {
      const actualizado = await productosService.ajustarStock(
        ajusteModal.producto.id, cantidad, observacion,
      )
      setProductos(prev => prev.map(p => p.id === actualizado.id ? actualizado : p))
      setAjusteModal({ open: false, producto: null })
      toast({ title: 'Stock actualizado' })
    } catch {
      toast({ title: 'Error al ajustar stock', variant: 'destructive' })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        {/* Header de la página */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Productos</h1>
            <p className="text-sm text-muted-foreground">
              {productosFiltrados.length < productos.length
                ? `${productosFiltrados.length} de ${productos.length} productos`
                : `${productos.length} producto${productos.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <Button onClick={() => setFormModal({ open: true, producto: null })}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </Button>
        </div>

        {/* Barra de filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por nombre, código o marca..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="solo-stock"
              checked={soloConStock}
              onCheckedChange={setSoloConStock}
            />
            <label htmlFor="solo-stock" className="text-sm text-muted-foreground cursor-pointer select-none">
              Solo con stock
            </label>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
            <PackageSearch className="h-12 w-12" />
            <p>No hay productos todavía</p>
            <Button variant="outline" onClick={() => setFormModal({ open: true, producto: null })}>
              Crear el primer producto
            </Button>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
            <Search className="h-12 w-12" />
            <p>{busqueda ? `Sin resultados para "${busqueda}"` : 'No hay productos con stock'}</p>
            {busqueda && (
              <Button variant="outline" onClick={() => setBusqueda('')}>
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-sm">{p.codigo ?? '—'}</TableCell>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-sm">{p.marca ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      ${p.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-sm">{p.alicuotaIva}%</TableCell>
                    <TableCell className="text-right">
                      {/* Badge rojo si el stock está por debajo del mínimo */}
                      <Badge
                        variant={p.stockActual <= p.stockMinimo && p.stockMinimo > 0 ? 'destructive' : 'secondary'}
                      >
                        {p.stockActual}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {/* Ajuste de stock */}
                        <Button
                          variant="ghost" size="icon"
                          title="Ajustar stock"
                          onClick={() => setAjusteModal({ open: true, producto: p })}
                        >
                          <PackageSearch className="h-4 w-4" />
                        </Button>
                        {/* Editar */}
                        <Button
                          variant="ghost" size="icon"
                          title="Editar"
                          onClick={() => setFormModal({ open: true, producto: p })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Eliminar */}
                        <Button
                          variant="ghost" size="icon"
                          title="Eliminar"
                          onClick={() => handleEliminar(p)}
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

      {/* Modales */}
      <ProductoFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, producto: null })}
        onSave={handleSaveProducto}
        producto={formModal.producto}
      />
      <AjusteStockModal
        open={ajusteModal.open}
        onClose={() => setAjusteModal({ open: false, producto: null })}
        onSave={handleAjusteStock}
        producto={ajusteModal.producto}
      />
    </AppLayout>
  )
}

export default ProductosPage
