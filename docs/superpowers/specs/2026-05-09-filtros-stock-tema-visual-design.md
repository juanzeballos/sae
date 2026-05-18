# Filtros en pantalla de Productos + Tema Visual Slate/Naranja

**Fecha:** 2026-05-09  
**Archivo afectado principalmente:** `frontend/src/pages/ProductosPage.tsx`, `frontend/src/index.css`, `frontend/src/components/layout/AppLayout.tsx`

---

## 1. Filtros en la pantalla de Productos

### Qué se agrega

Una barra de filtros entre el header (`<h1>Productos</h1>`) y la tabla existente.

### Controles

#### Campo de búsqueda
- Input de texto con ícono de lupa (icono `Search` de lucide-react)
- Placeholder: `"Buscar por nombre, código o marca..."`
- Filtra sobre la lista ya cargada en memoria (`productos` del estado)
- Busca en los campos: `codigo`, `nombre`, `descripcion`, `marca`
- La búsqueda es case-insensitive
- El filtrado ocurre con cada keystroke (controlled input, sin botón "buscar")
- No realiza llamadas al backend

#### Switch "Solo con stock"
- Componente `Switch` de shadcn/ui (`frontend/src/components/ui/switch.tsx` — nuevo archivo a instalar con `npx shadcn@latest add switch`)
- Label: `"Solo con stock"`
- **Por defecto: activo (true)** — al entrar a la pantalla solo se ven productos con `stockActual > 0`
- Condición: `stockActual > 0` (no `>= 1`, para manejar fracciones si las hubiera)
- Si el switch está apagado, se muestran todos los productos

### Lógica de filtrado

El filtrado es puramente en el frontend, sobre el array `productos` del estado. Se computa con `useMemo` para no recalcular en cada render:

```
productosFiltrados = productos
  .filter(p => !soloConStock || p.stockActual > 0)
  .filter(p => busqueda === '' || [p.codigo, p.nombre, p.descripcion, p.marca]
      .some(campo => campo?.toLowerCase().includes(busqueda.toLowerCase())))
```

La tabla renderiza `productosFiltrados` en lugar de `productos`.

### Contador del header

Actualmente: `"N productos activos"`

Nuevo comportamiento:
- Sin filtros activos: `"15 productos"` (total)
- Con filtros activos: `"12 de 15 productos"` — "filtros activos" = búsqueda no vacía O switch encendido con productos ocultos
- Definición de "filtros activos": `productosFiltrados.length < productos.length`

### Estado nuevo en ProductosPage

```typescript
const [busqueda, setBusqueda] = useState('')
const [soloConStock, setSoloConStock] = useState(true)  // true por defecto
```

---

## 2. Tema visual: Slate + Naranja/Ámbar

### Concepto

El sistema de colores de shadcn/ui usa variables CSS definidas en `index.css`. Cambiar el tema completo solo requiere editar ese archivo — ningún componente se toca.

### Cambios en `frontend/src/index.css`

Variables a modificar en `:root`:

| Variable | Valor actual | Valor nuevo |
|---|---|---|
| `--primary` | `222.2 47.4% 11.2%` | `38 92% 50%` (naranja ámbar) |
| `--primary-foreground` | `210 40% 98%` | `0 0% 100%` |
| `--ring` | `222.2 84% 4.9%` | `38 92% 50%` |

### Cambios en el sidebar (`AppLayout.tsx`)

El sidebar actualmente usa clases hardcodeadas (`bg-gray-900`, etc.). Se actualizan a:
- Fondo sidebar: `bg-slate-800` (`#1e293b`)
- Ítem activo: `bg-slate-700` con borde izquierdo naranja (`border-l-2 border-amber-500`)
- Texto inactivo: `text-slate-400`
- Texto activo: `text-white`

### Lo que NO cambia

- Fondo de la app (blanco)
- Colores de texto generales
- Badge rojo de stock bajo (`--destructive` no se toca)
- Colores de errores/toasts destructivos

---

## 3. Archivos a modificar / crear

| Archivo | Acción |
|---|---|
| `frontend/src/pages/ProductosPage.tsx` | Agregar estado de filtros, barra de filtros, lógica con useMemo, actualizar contador |
| `frontend/src/index.css` | Cambiar variables CSS de colores primarios |
| `frontend/src/components/layout/AppLayout.tsx` | Actualizar clases de color del sidebar |
| `frontend/src/components/ui/switch.tsx` | Crear (instalar con shadcn CLI) |

---

## 4. Fuera de scope

- Filtrado server-side (no necesario por el volumen de datos)
- Persistencia de filtros entre navegaciones
- Modo oscuro
- Filtro por precio o IVA
