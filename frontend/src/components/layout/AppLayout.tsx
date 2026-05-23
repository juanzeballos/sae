import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, LayoutDashboard, LogOut, FileText, ShoppingCart, Users, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/productos', label: 'Productos', icon: Package },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/presupuestos', label: 'Presupuestos', icon: FileText },
  { path: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { path: '/gastos', label: 'Gastos', icon: Receipt },
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
