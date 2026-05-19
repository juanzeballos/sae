# Convertir Presupuesto via Formulario de Venta — Design Spec

## Objetivo

Cambiar el flujo de "Convertir a venta" para que en lugar de convertir directamente, navegue al formulario de Nueva Venta pre-cargado con los datos del presupuesto. El usuario puede revisar y modificar antes de confirmar. Al guardar, el presupuesto queda marcado como CONVERTIDO y vinculado a la venta creada.

## Arquitectura

**Frontend**: React Router `navigate` con `state` para pasar datos sin fetch extra. `VentaFormPage` detecta el state y entra en modo "desde presupuesto". Al guardar llama al endpoint `convertir` con el body de la venta modificada.

**Backend**: El endpoint `POST /presupuestos/{id}/convertir` acepta un `@RequestBody(required = false) VentaRequest`. Si viene con body usa esos datos; si no, usa los del presupuesto (retrocompatible). Todo en una transacción.

## Cambios por archivo

### `PresupuestosPage.tsx`
- Eliminar `handleConvertir()` y su llamada al backend.
- El botón "Convertir a venta" (estado CONFIRMADO) llama a `navigate('/ventas/nueva', { state: { fromPresupuesto: p } })` donde `p` es el objeto presupuesto ya cargado en estado local.
- Eliminar el import de `presupuestosService.convertir` si queda sin usar.

### `VentaFormPage.tsx`
- Importar `useLocation` de `react-router-dom`.
- Leer `const location = useLocation()` y extraer `const fromPresupuesto = location.state?.fromPresupuesto ?? null`.
- Si `fromPresupuesto` existe, inicializar estado del formulario con:
  - `clienteNombre` ← `fromPresupuesto.clienteNombre`
  - `fecha` ← `fromPresupuesto.fecha`
  - `items` ← `fromPresupuesto.detalles.map(d => ({ key: String(d.id), productoId: d.productoId ?? undefined, tipoItem: d.tipoItem, descripcionItem: d.descripcionItem, cantidad: d.cantidad, precioUnitarioNeto: d.precioUnitarioNeto, alicuotaIva: d.alicuotaIva }))`
- Título: si `fromPresupuesto`, mostrar `"Venta desde Presupuesto #${fromPresupuesto.numero}"`, si no `"Nueva venta"`.
- Botón guardar: si `fromPresupuesto`, texto `"Confirmar venta"`, si no `"Registrar venta"`.
- Botón cancelar: si `fromPresupuesto`, navega a `/presupuestos`, si no a `/ventas`.
- En `handleRegistrar()`:
  - Si `fromPresupuesto`: llama a `presupuestosService.convertirConDatos(fromPresupuesto.id, ventaRequest)`.
  - Si no: llama a `ventasService.crear(ventaRequest)` (comportamiento actual sin cambios).
  - Toast de éxito: si `fromPresupuesto`, `"Venta #${venta.numero} creada — Presupuesto #${fromPresupuesto.numero} convertido"`.
  - Post-guardado: siempre navega a `/ventas`.

### `frontend/src/services/presupuestos.ts`
- Agregar método `convertirConDatos(id: number, ventaRequest: VentaRequest): Promise<Venta>` que hace `POST /presupuestos/${id}/convertir` con el body del request.

### `PresupuestoController.java`
- Cambiar la firma del endpoint `convertir`:
  ```java
  @PostMapping("/{id}/convertir")
  public ResponseEntity<VentaResponse> convertir(
      @PathVariable Long id,
      @RequestBody(required = false) VentaRequest ventaRequest) {
      return ResponseEntity.ok(presupuestoService.convertir(id, ventaRequest));
  }
  ```

### `PresupuestoService.java`
- Cambiar firma de `convertir(Long id)` a `convertir(Long id, VentaRequest ventaRequest)`.
- Si `ventaRequest == null`: construir el request desde los detalles del presupuesto (lógica actual).
- Si `ventaRequest != null`: usar directamente ese request.
- En ambos casos: llamar a `ventaService.crearDesdePresupuesto(request, presupuesto.getId())`, marcar presupuesto CONVERTIDO, guardar `ventaId`.

## Flujo completo

```
PresupuestosPage
  └─ click "Convertir a venta" (CONFIRMADO)
       └─ navigate('/ventas/nueva', { state: { fromPresupuesto: p } })

VentaFormPage (modo fromPresupuesto)
  ├─ título: "Venta desde Presupuesto #X"
  ├─ form pre-cargado con datos del presupuesto (editable)
  ├─ cancelar → /presupuestos
  └─ "Confirmar venta"
       └─ POST /presupuestos/{id}/convertir  { body: VentaRequest }
            └─ backend: crea venta + marca presupuesto CONVERTIDO + ventaId
                 └─ navigate('/ventas') + toast "Venta #Y creada — Presupuesto #X convertido"
```

## Retrocompatibilidad

El endpoint `POST /presupuestos/{id}/convertir` sin body sigue funcionando igual. No hay breaking changes en la API.

## Fuera de scope

- Teléfono del cliente no se persiste en backend (igual que hoy).
- No se valida si el presupuesto ya fue convertido antes de navegar (el backend ya lo rechaza con 409).
- No se agrega historial de cambios entre presupuesto original y venta creada.
