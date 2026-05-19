# Convertir Presupuesto via Formulario de Venta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cambiar "Convertir a venta" para navegar a VentaFormPage pre-cargado con los datos del presupuesto, permitiendo revisión/modificación antes de confirmar.

**Architecture:** Router state pasa el objeto presupuesto a VentaFormPage sin fetch extra. VentaFormPage detecta el state y entra en modo "desde presupuesto". Al guardar llama a `POST /presupuestos/{id}/convertir` con el VentaRequest del formulario. El backend acepta body opcional (retrocompatible).

**Tech Stack:** Spring Boot 3.2.5 · Java records (DTOs) · React 18 · TypeScript · React Router v6 · axios

---

## File Map

| Archivo | Cambio |
|---|---|
| `backend/.../controller/PresupuestoController.java` | Agregar `@RequestBody(required=false) VentaRequest` al endpoint convertir |
| `backend/.../service/PresupuestoService.java` | Cambiar firma `convertir(Long id)` → `convertir(Long id, VentaRequest)` |
| `frontend/src/services/presupuestos.ts` | Agregar método `convertirConDatos` |
| `frontend/src/pages/PresupuestosPage.tsx` | Reemplazar `handleConvertir` con `navigate` |
| `frontend/src/pages/VentaFormPage.tsx` | Agregar modo `fromPresupuesto` |

---

## Task 1: Backend — PresupuestoService acepta VentaRequest opcional

**Files:**
- Modify: `backend/src/main/java/com/taller/sae/service/PresupuestoService.java:124-159`

- [ ] **Step 1: Cambiar la firma y lógica del método `convertir`**

Reemplazar el método completo (líneas 124–159) con:

```java
@Transactional
public VentaResponse convertir(Long id, VentaRequest ventaRequestBody) {
    Presupuesto presupuesto = buscarOLanzar(id);

    if (!"CONFIRMADO".equals(presupuesto.getEstado())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Solo se puede convertir un presupuesto CONFIRMADO");
    }

    VentaRequest ventaRequest;
    if (ventaRequestBody != null) {
        ventaRequest = ventaRequestBody;
    } else {
        List<PresupuestoDetalle> detalles = presupuestoDetalleRepository.findByPresupuestoId(id);
        List<VentaDetalleRequest> detalleRequests = detalles.stream()
                .map(d -> new VentaDetalleRequest(
                        d.getProductoId(),
                        d.getTipoItem(),
                        d.getDescripcionItem(),
                        d.getCantidad(),
                        d.getPrecioUnitarioNeto(),
                        d.getAlicuotaIva()
                ))
                .toList();
        ventaRequest = new VentaRequest(
                presupuesto.getClienteNombre(),
                presupuesto.getFecha(),
                detalleRequests
        );
    }

    VentaResponse ventaResponse = ventaService.crearDesdePresupuesto(ventaRequest, presupuesto.getId());

    presupuesto.setEstado("CONVERTIDO");
    presupuesto.setVentaId(ventaResponse.id());
    presupuestoRepository.save(presupuesto);

    return ventaResponse;
}
```

- [ ] **Step 2: Verificar que compila**

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk1.8.0_301"
$env:MAVEN_OPTS = "-Xmx1024m -XX:MaxMetaspaceSize=512m"
Set-Location "F:\Proyectos\sae\backend"
& "C:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn.cmd" compile -q
```

Esperado: `BUILD SUCCESS` sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/taller/sae/service/PresupuestoService.java
git commit -m "feat: convertir acepta VentaRequest opcional en PresupuestoService"
```

---

## Task 2: Backend — PresupuestoController expone body opcional

**Files:**
- Modify: `backend/src/main/java/com/taller/sae/controller/PresupuestoController.java:54-58`

- [ ] **Step 1: Agregar import de VentaRequest y actualizar el endpoint**

Agregar al bloque de imports (ya existe `VentaResponse`, agregar `VentaRequest`):

```java
import com.taller.sae.dto.VentaRequest;
```

Reemplazar el método `convertir` (líneas 54–58):

```java
@PostMapping("/{id}/convertir")
@ResponseStatus(HttpStatus.CREATED)
public VentaResponse convertir(
        @PathVariable Long id,
        @RequestBody(required = false) VentaRequest ventaRequest) {
    return presupuestoService.convertir(id, ventaRequest);
}
```

- [ ] **Step 2: Compilar y verificar retrocompatibilidad**

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk1.8.0_301"
$env:MAVEN_OPTS = "-Xmx1024m -XX:MaxMetaspaceSize=512m"
Set-Location "F:\Proyectos\sae\backend"
& "C:\Users\54347\Documents\apache-maven-3.8.4\bin\mvn.cmd" compile -q
```

Esperado: `BUILD SUCCESS`.

Verificar retrocompatibilidad con curl (sin body → debe seguir funcionando):

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s -w "\nHTTP:%{http_code}" \
  -X POST http://localhost:8080/presupuestos/1/convertir \
  -H "Authorization: Bearer $TOKEN"
```

Esperado: `HTTP:409` (el presupuesto 1 ya fue convertido antes) o `HTTP:201` con venta creada — cualquiera de los dos confirma que el endpoint responde correctamente sin body.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/com/taller/sae/controller/PresupuestoController.java
git commit -m "feat: endpoint convertir acepta body VentaRequest opcional"
```

---

## Task 3: Frontend — agregar `convertirConDatos` al servicio

**Files:**
- Modify: `frontend/src/services/presupuestos.ts`

- [ ] **Step 1: Importar VentaRequest y agregar método**

El archivo actual termina con:
```ts
  convertir: (id: number) =>
    api.post<Venta>(`/presupuestos/${id}/convertir`).then(r => r.data),
}
```

Reemplazar el contenido completo del archivo con:

```ts
import api from './api'
import type { Presupuesto, Venta, TipoItem } from '@/types'
import type { VentaRequest } from './ventas'

export interface PresupuestoDetalleRequest {
  productoId: number | null
  tipoItem: TipoItem
  descripcionItem: string
  cantidad: number
  precioUnitarioNeto: number
  alicuotaIva: number
}

export interface PresupuestoRequest {
  clienteNombre: string
  fecha?: string
  detalles: PresupuestoDetalleRequest[]
}

export const presupuestosService = {
  listar: () =>
    api.get<Presupuesto[]>('/presupuestos').then(r => r.data),

  obtener: (id: number) =>
    api.get<Presupuesto>(`/presupuestos/${id}`).then(r => r.data),

  crear: (data: PresupuestoRequest) =>
    api.post<Presupuesto>('/presupuestos', data).then(r => r.data),

  editar: (id: number, data: PresupuestoRequest) =>
    api.put<Presupuesto>(`/presupuestos/${id}`, data).then(r => r.data),

  eliminar: (id: number) =>
    api.delete(`/presupuestos/${id}`),

  confirmar: (id: number) =>
    api.post<Presupuesto>(`/presupuestos/${id}/confirmar`).then(r => r.data),

  convertir: (id: number) =>
    api.post<Venta>(`/presupuestos/${id}/convertir`).then(r => r.data),

  convertirConDatos: (id: number, ventaRequest: VentaRequest) =>
    api.post<Venta>(`/presupuestos/${id}/convertir`, ventaRequest).then(r => r.data),
}
```

- [ ] **Step 2: Verificar que TypeScript compila**

```powershell
Set-Location "F:\Proyectos\sae\frontend"
npx tsc --noEmit
```

Esperado: sin errores de tipos.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/presupuestos.ts
git commit -m "feat: agregar convertirConDatos al servicio de presupuestos"
```

---

## Task 4: Frontend — PresupuestosPage navega en lugar de convertir directo

**Files:**
- Modify: `frontend/src/pages/PresupuestosPage.tsx`

- [ ] **Step 1: Reemplazar `handleConvertir` por navegación**

El archivo actual tiene (líneas 69–77):
```tsx
async function handleConvertir(id: number) {
  try {
    const venta = await presupuestosService.convertir(id)
    await cargar()
    toast({ title: `Venta #${venta.numero} creada` })
  } catch (err) {
    toast({ title: errMsg(err), variant: 'destructive' })
  }
}
```

Y el botón (líneas 167–171):
```tsx
{p.estado === 'CONFIRMADO' && (
  <Button size="sm" variant="outline" onClick={() => handleConvertir(p.id)}>
    <ArrowRightCircle className="h-4 w-4 mr-1 text-green-600" />
    Convertir a venta
  </Button>
)}
```

**Eliminar** el método `handleConvertir` completo.

**Reemplazar** el botón con:

```tsx
{p.estado === 'CONFIRMADO' && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => navigate('/ventas/nueva', { state: { fromPresupuesto: p } })}
  >
    <ArrowRightCircle className="h-4 w-4 mr-1 text-green-600" />
    Convertir a venta
  </Button>
)}
```

- [ ] **Step 2: Verificar que no quedan referencias a `handleConvertir` ni a `presupuestosService.convertir`**

```powershell
Select-String -Path "frontend\src\pages\PresupuestosPage.tsx" -Pattern "handleConvertir|\.convertir"
```

Esperado: sin resultados.

- [ ] **Step 3: Verificar TypeScript**

```powershell
Set-Location "F:\Proyectos\sae\frontend"
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/PresupuestosPage.tsx
git commit -m "feat: convertir presupuesto navega a formulario de venta"
```

---

## Task 5: Frontend — VentaFormPage modo `fromPresupuesto`

**Files:**
- Modify: `frontend/src/pages/VentaFormPage.tsx`

Este es el cambio más extenso. Reemplazar el archivo completo con la versión que detecta `location.state.fromPresupuesto`.

- [ ] **Step 1: Escribir el archivo completo**

```tsx
import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import { ventasService } from '@/services/ventas'
import { presupuestosService } from '@/services/presupuestos'
import type { Producto, Presupuesto } from '@/types'
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

function VentaFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const fromPresupuesto = (location.state as { fromPresupuesto?: Presupuesto } | null)
    ?.fromPresupuesto ?? null

  const [clienteNombre, setClienteNombre] = useState(fromPresupuesto?.clienteNombre ?? '')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [fecha, setFecha] = useState(
    fromPresupuesto?.fecha ?? new Date().toISOString().split('T')[0]
  )
  const [items, setItems] = useState<ItemRow[]>(() =>
    fromPresupuesto
      ? fromPresupuesto.detalles.map(d => ({
          key: String(d.id),
          productoId: d.productoId ?? undefined,
          tipoItem: d.tipoItem,
          descripcionItem: d.descripcionItem,
          cantidad: d.cantidad,
          precioUnitarioNeto: d.precioUnitarioNeto,
          alicuotaIva: d.alicuotaIva,
        }))
      : []
  )
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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

  async function handleRegistrar() {
    if (!clienteNombre.trim()) {
      toast({ title: 'El nombre del cliente es obligatorio', variant: 'destructive' })
      return
    }
    if (items.length === 0) {
      toast({ title: 'Agregue al menos un ítem', variant: 'destructive' })
      return
    }

    const ventaRequest = {
      clienteNombre,
      fecha,
      detalles: items.map(item => ({
        productoId: item.productoId ?? null,
        tipoItem: item.tipoItem,
        descripcionItem: item.descripcionItem,
        cantidad: item.cantidad,
        precioUnitarioNeto: item.precioUnitarioNeto,
        alicuotaIva: item.alicuotaIva,
      })),
    }

    setSaving(true)
    try {
      if (fromPresupuesto) {
        const venta = await presupuestosService.convertirConDatos(fromPresupuesto.id, ventaRequest)
        toast({ title: `Venta #${venta.numero} creada — Presupuesto #${fromPresupuesto.numero} convertido` })
      } else {
        const venta = await ventasService.crear(ventaRequest)
        toast({ title: `Venta #${venta.numero} registrada` })
      }
      navigate('/ventas')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Error al registrar'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">
          {fromPresupuesto
            ? `Venta desde Presupuesto #${fromPresupuesto.numero}`
            : 'Nueva venta'}
        </h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <Label>Cliente *</Label>
            <Input
              placeholder="Nombre del cliente"
              value={clienteNombre}
              onChange={e => setClienteNombre(e.target.value)}
            />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Teléfono <span className="text-slate-400 text-xs">(opcional)</span></Label>
            <Input
              placeholder="Teléfono del cliente"
              value={clienteTelefono}
              onChange={e => setClienteTelefono(e.target.value)}
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
                <TableHead className="w-32 text-right">Subtotal c/IVA</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const subtotal = item.cantidad * item.precioUnitarioNeto * (1 + item.alicuotaIva / 100)
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
                        <SelectContent className="bg-white">
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="10.5">10.5%</SelectItem>
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
          <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setSelectorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Producto
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setItems(prev => [...prev, nuevaFila()])}>
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
          <Button
            variant="outline"
            onClick={() => navigate(fromPresupuesto ? '/presupuestos' : '/ventas')}
          >
            Cancelar
          </Button>
          <Button onClick={handleRegistrar} disabled={saving}>
            {fromPresupuesto ? 'Confirmar venta' : 'Registrar venta'}
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

export default VentaFormPage
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
Set-Location "F:\Proyectos\sae\frontend"
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Prueba manual — modo normal (sin presupuesto)**

1. Ir a `/ventas/nueva`
2. Verificar título "Nueva venta", botón "Registrar venta", cancelar va a `/ventas`
3. Crear una venta directa → confirmar que se crea correctamente

- [ ] **Step 4: Prueba manual — modo fromPresupuesto**

1. Ir a `/presupuestos`
2. Elegir un presupuesto en estado CONFIRMADO y hacer clic en "Convertir a venta"
3. Verificar que navega a `/ventas/nueva` con:
   - Título "Venta desde Presupuesto #X"
   - Campos pre-cargados (cliente, fecha, items)
   - Botón "Confirmar venta"
   - Cancelar lleva a `/presupuestos`
4. Modificar algún campo (ej: cambiar cantidad de un ítem)
5. Hacer clic en "Confirmar venta"
6. Verificar toast "Venta #Y creada — Presupuesto #X convertido"
7. Ir a `/presupuestos` → el presupuesto debe mostrar estado CONVERTIDO
8. Ir a `/ventas` → la venta creada debe aparecer con los datos modificados

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/VentaFormPage.tsx
git commit -m "feat: VentaFormPage soporta modo fromPresupuesto con datos pre-cargados"
```

---

## Verificación final

- [ ] Backend compila sin errores: `mvn compile -q`
- [ ] Frontend sin errores de tipos: `npx tsc --noEmit`
- [ ] `POST /presupuestos/{id}/convertir` sin body → sigue retornando 409 (ya convertido) o 201
- [ ] `POST /presupuestos/{id}/convertir` con body → crea venta con datos del body
- [ ] Flujo completo desde UI sin regresiones en Nueva Venta directa
