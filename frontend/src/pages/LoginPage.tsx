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
