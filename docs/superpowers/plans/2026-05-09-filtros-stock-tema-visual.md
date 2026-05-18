# Filtros de Stock + Tema Visual Slate/Naranja — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una barra de búsqueda + switch "Solo con stock" a la pantalla de Productos, y cambiar el tema visual de la app a Slate oscuro con acentos naranja/ámbar.

**Architecture:** El filtrado es 100% en el frontend — se computa sobre la lista ya cargada en memoria usando `useMemo`. Los colores se cambian editando variables CSS en `index.css` (afecta toda la app) y clases Tailwind hardcodeadas en el sidebar (`AppLayout.tsx`).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, lucide-react

---

## Archivos a tocar

| Archivo | Qué cambia |
|---|---|
| `frontend/src/components/ui/switch.tsx` | Crear — instalar con shadcn CLI |
| `frontend/src/index.css` | Variables CSS de color primario (`--primary`, `--ring`) |
| `frontend/src/components/layout/AppLayout.tsx` | Colores del sidebar (fondo, ítem activo, textos) |
| `frontend/src/pages/ProductosPage.tsx` | Estado de filtros, lógica `useMemo`, UI de barra de filtros |

> ⚠️ No hay tests automatizados de UI configurados en el proyecto. La verificación es visual: arrancar el servidor de desarrollo y probar en el browser.

---

## Task 1: Instalar el componente Switch de shadcn/ui

**Files:**
- Create: `frontend/src/components/ui/switch.tsx` (generado por la CLI)

### ¿Qué es shadcn/ui y por qué usar la CLI?

shadcn/ui no es una librería npm que se importa — es una colección de componentes que **se copian a tu proyecto**. Cuando corrés `npx shadcn@latest add switch`, el CLI descarga el código del componente y lo pone en `src/components/ui/switch.tsx`. A partir de ahí es tuyo.

Ventaja: podés modificarlo como quieras. Desventaja: si shadcn saca una versión nueva, no se actualiza sola.

- [ ] **Instalar el componente desde la carpeta del frontend**

```bash
cd frontend
npx shadcn@latest add switch
```

Cuando pregunte "Which style would you like to use?", presioná Enter (default). Si ya está configurado, simplemente instala el componente.

Resultado esperado: aparece el archivo `frontend/src/components/ui/switch.tsx`.

- [ ] **Verificar que el archivo existe**

```bash
ls frontend/src/components/ui/switch.tsx
```

Deberías ver el archivo listado. Si tiene un error, corrés el comando de nuevo con `--yes` al final para saltear preguntas interactivas.

---

## Task 2: Cambiar colores primarios en `index.css`

**Files:**
- Modify: `frontend/src/index.css`

### Explicación del sistema de colores

shadcn/ui usa **variables CSS** en formato HSL (Hue, Saturation, Lightness).

`hsl(38, 92%, 50%)` = naranja ámbar (el Amber-500 de Tailwind).
- **38** = matiz (0=rojo, 120=verde, 240=azul, 38=naranja)
- **92%** = saturación (qué tan intenso es el color)
- **50%** = luminosidad (0%=negro, 100%=blanco, 50%=color puro)

En el CSS las escribís **sin la función `hsl()`**, solo los tres números separados por espacios. shadcn los envuelve en `hsl()` solo cuando los usa.

- [ ] **Editar `frontend/src/index.css` — cambiar las variables de color**

Reemplazá estas tres líneas dentro de `:root { ... }`:

```css
/* ANTES */
--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;
--ring: 222.2 84% 4.9%;

/* DESPUÉS */
--primary: 38 92% 50%;
--primary-foreground: 0 0% 100%;
--ring: 38 92% 50%;
```

El archivo completo debería quedar así:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 38 92% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 38 92% 50%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: system-ui, -apple-system, sans-serif;
  }
}
```

- [ ] **Verificar en el browser**

Arrancá el servidor si no está corriendo:
```bash
cd frontend && npm run dev
```

Abrí `http://localhost:5173/productos`. El botón "Nuevo producto" debería verse **naranja** en lugar de negro. Si no cambia, guardá el archivo y recargá.

---

## Task 3: Actualizar el sidebar en `AppLayout.tsx`

**Files:**
- Modify: `frontend/src/components/layout/AppLayout.tsx`

### Explicación

Las clases Tailwind del sidebar están directamente en el JSX. Para el tema oscuro necesitamos:
- `bg-slate-800` en el `<aside>` → fondo gris pizarra oscuro
- Textos blancos/grises sobre ese fondo oscuro
- Ítem activo: fondo `bg-slate-700` + borde izquierdo naranja (`border-l-2 border-amber-500`)
- Ítem inactivo: texto `text-slate-400` que se pone blanco al hover

> ⚠️ En vez de usar `variant="secondary"` o `variant="ghost"` del Button (que usan variables CSS pensadas para fondo blanco), vamos a pasar clases directas con `className`. El Button acepta clases extras que **sobreescriben** los estilos del variant.

- [ ] **Reemplazar el contenido completo de `frontend/src/components/layout/AppLayout.tsx`**

```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/productos', label: 'Productos', icon: Package },
]

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { username, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-56 flex flex-col bg-slate-800">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-700">
          <span className="font-semibold text-sm text-white">SAE · Taller</span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start gap-2 ${
                    active
                      ? 'bg-slate-700 text-white border-l-2 border-amber-500 hover:bg-slate-700 hover:text-white rounded-l-none'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-slate-700" />

        {/* Usuario + logout */}
        <div className="p-2 space-y-1">
          <p className="text-xs text-slate-400 px-2 py-1">{username}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-slate-400 hover:bg-slate-700 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </aside>

      {/* ── Contenido principal ──────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

export default AppLayout
```

- [ ] **Verificar en el browser**

En `http://localhost:5173/productos` deberías ver el sidebar gris oscuro con el ítem "Productos" activo mostrando borde naranja izquierdo y fondo más claro.

---

## Task 4: Agregar lógica de filtros en `ProductosPage.tsx`

**Files:**
- Modify: `frontend/src/pages/ProductosPage.tsx`

### Explicación de `useMemo`

`useMemo` es como un caché dentro del componente. Le decís:
- "Calculá esta lista filtrada..."
- "...pero solo cuando cambien `productos`, `busqueda` o `soloConStock`"
- "Si nada cambió, devolvé el resultado anterior sin recalcular"

En Java sería como un método que devuelve un valor cacheado que se invalida solo cuando cambian sus dependencias. En este caso evita filtrar 500 productos 30 veces por segundo si el usuario escribe rápido.

- [ ] **Agregar los imports nuevos en la parte superior del archivo**

Reemplazá esta línea:
```tsx
import { useEffect, useState } from 'react'
```
Por:
```tsx
import { useEffect, useState, useMemo } from 'react'
```

- [ ] **Agregar el import del Switch**

Después de la línea `import { Input } from '@/components/ui/input'`, agregá:
```tsx
import { Switch } from '@/components/ui/switch'
```

> Si `Input` no está importado todavía, agregá ambos juntos:
```tsx
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
```

- [ ] **Agregar el import del ícono Search**

Reemplazá:
```tsx
import { Plus, Pencil, Trash2, PackageSearch } from 'lucide-react'
```
Por:
```tsx
import { Plus, Pencil, Trash2, PackageSearch, Search } from 'lucide-react'
```

- [ ] **Agregar los dos estados nuevos** dentro de la función `ProductosPage`, después del estado `loading`:

```tsx
const [busqueda, setBusqueda] = useState('')
const [soloConStock, setSoloConStock] = useState(true)
```

- [ ] **Agregar el `useMemo` para la lista filtrada** después de los estados (antes del `useEffect`):

```tsx
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
```

---

## Task 5: Agregar la UI de filtros y actualizar el contador

**Files:**
- Modify: `frontend/src/pages/ProductosPage.tsx`

- [ ] **Actualizar el contador en el header**

Reemplazá:
```tsx
<p className="text-sm text-muted-foreground">
  {productos.length} producto{productos.length !== 1 ? 's' : ''} activo{productos.length !== 1 ? 's' : ''}
</p>
```
Por:
```tsx
<p className="text-sm text-muted-foreground">
  {productosFiltrados.length < productos.length
    ? `${productosFiltrados.length} de ${productos.length} productos`
    : `${productos.length} producto${productos.length !== 1 ? 's' : ''}`
  }
</p>
```

- [ ] **Agregar la barra de filtros entre el header y la tabla**

Buscá el comentario `{/* Tabla */}` (línea ~112). Justo antes de esa línea, insertá:

```tsx
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
```

- [ ] **Cambiar `productos.map` por `productosFiltrados.map` en la tabla**

En el `<TableBody>`, reemplazá:
```tsx
{productos.map(p => (
```
Por:
```tsx
{productosFiltrados.map(p => (
```

- [ ] **Actualizar el estado vacío para cuando no hay resultados de búsqueda**

El estado vacío actual solo aparece cuando no hay productos en la base de datos. Hay que distinguir dos casos: "no hay productos" vs "la búsqueda no encontró nada".

Reemplazá el bloque `productos.length === 0 ? (...)` por:

```tsx
productos.length === 0 ? (
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
```

> ⚠️ Si agregás este tercer caso, el bloque de la tabla que empieza con `<div className="border rounded-md">` necesita su paréntesis de cierre `)` al final del bloque completo. Verificá que los paréntesis queden balanceados.

---

## Task 6: Verificación final

- [ ] **Correr el servidor de desarrollo**

```bash
cd frontend && npm run dev
```

- [ ] **Verificar filtros**

En `http://localhost:5173/productos`:

1. El switch "Solo con stock" aparece **encendido** al entrar → solo se ven productos con stock > 0
2. El contador dice "N productos" o "N de M productos" correctamente
3. Escribir en el buscador filtra la tabla en tiempo real (sin botón)
4. Apagar el switch muestra todos los productos (incluyendo sin stock)
5. Con búsqueda activa y sin resultados, aparece el mensaje "Sin resultados para X" con botón "Limpiar búsqueda"

- [ ] **Verificar tema visual**

1. Sidebar gris oscuro (slate-800) con texto blanco
2. Ítem activo tiene borde izquierdo naranja
3. Botón "Nuevo producto" es naranja
4. El badge rojo de stock bajo **sigue siendo rojo** (no cambió con el tema)
5. Los inputs/toasts de error siguen con borde rojo al haber errores

- [ ] **Verificar que no hay errores de TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sin output (sin errores). Si hay errores, los tipos están mal — revisá que `Switch` esté importado correctamente y que `productosFiltrados` tenga tipo `Producto[]`.
