# Login UI Split Layout — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar `LoginPage.tsx` con un layout dividido en dos paneles: izquierdo slate oscuro con branding, derecho blanco con el formulario.

**Architecture:** Solo cambia el JSX del `return` — la lógica de autenticación (estados, handlers, navegación) permanece intacta. Se elimina el `Card` y se reemplaza por dos `div` con flexbox. No se agregan dependencias.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui (Button, Input, Label)

---

## Archivos a tocar

| Archivo | Acción |
|---|---|
| `frontend/src/pages/LoginPage.tsx` | Reemplazar el JSX del return y limpiar import de Card |

> ⚠️ No hay tests de UI configurados en el proyecto. La verificación es visual con el servidor de desarrollo.

---

## Task 1: Reemplazar el JSX de LoginPage

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

### Contexto del archivo actual

El archivo tiene dos partes bien separadas:
1. **Lógica** (líneas 1–22): imports, estados, `handleSubmit` — **no se toca**
2. **JSX del return** (líneas 24–69): el card centrado — **se reemplaza completo**

### Paso a paso

- [ ] **Leer el archivo actual para orientarse**

Verificar que la estructura es la esperada: un `div` con `bg-muted/40`, un `Card` adentro, y el `form` dentro del `CardContent`.

- [ ] **Reemplazar el contenido completo de `frontend/src/pages/LoginPage.tsx`**

El archivo completo debe quedar exactamente así:

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await login({ username, password })
    if (ok) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — branding ───────────────────────── */}
      <div className="w-5/12 bg-slate-800 flex flex-col items-center justify-center px-12 gap-4">
        <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-white text-3xl font-bold">SAE</h1>
        <p className="text-slate-400 text-sm text-center">Sistema de Gestión para Taller</p>
        <div className="w-10 h-0.5 bg-amber-500 rounded my-1" />
        <p className="text-slate-600 text-xs text-center leading-relaxed">
          Gestioná tu stock, ventas y clientes<br />desde un solo lugar.
        </p>
      </div>

      {/* ── Panel derecho — formulario ───────────────────────── */}
      <div className="flex-1 bg-white flex items-center justify-center px-12">
        <div className="w-full max-w-xs">
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Bienvenido</h2>
          <p className="text-sm text-slate-400 mb-6">
            Ingresá tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-6">SAE · Taller v1.0</p>
        </div>
      </div>

    </div>
  )
}

export default LoginPage
```

> **Nota:** El import de `Card, CardContent, CardHeader, CardTitle, CardDescription` fue eliminado — ya no se usa. El resto de imports y toda la lógica son idénticos al archivo original.

- [ ] **Verificar TypeScript sin errores**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sin output (sin errores).

- [ ] **Verificar visualmente en el browser**

Con el servidor de desarrollo corriendo (`npm run dev` en `frontend/`), abrir `http://localhost:5173/login` y confirmar:

1. Panel izquierdo slate oscuro visible con logo naranja, título "SAE" y tagline
2. Panel derecho blanco con "Bienvenido" y el formulario
3. Botón "Ingresar" en naranja
4. Login con `admin` / `admin123` funciona y redirige al dashboard
5. Si se ponen credenciales incorrectas, aparece el mensaje de error en rojo
6. En pantallas angostas (menos de 640px) los dos paneles se apilan (comportamiento natural del flex sin `flex-col` — si esto molesta visualmente, agregar `sm:flex-row flex-col` al div raíz, pero queda fuera del scope de esta tarea)
