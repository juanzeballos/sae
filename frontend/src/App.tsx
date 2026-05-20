import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProductosPage from '@/pages/ProductosPage'
import ClientesPage from '@/pages/ClientesPage'
import PresupuestosPage from '@/pages/PresupuestosPage'
import PresupuestoFormPage from '@/pages/PresupuestoFormPage'
import VentasPage from '@/pages/VentasPage'
import VentaFormPage from '@/pages/VentaFormPage'
import GastosPage from '@/pages/GastosPage'

// App.tsx define el árbol de rutas de toda la aplicación.
// Equivale al servlet-mapping de web.xml pero en el cliente.
//
// Rutas públicas:  /login  → no requieren token
// Rutas privadas:  todo lo demás → ProtectedRoute redirige al login si no hay token
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        <Route path="/productos" element={
          <ProtectedRoute><ProductosPage /></ProtectedRoute>
        } />

        <Route path="/clientes" element={
          <ProtectedRoute><ClientesPage /></ProtectedRoute>
        } />

        <Route path="/presupuestos" element={
          <ProtectedRoute><PresupuestosPage /></ProtectedRoute>
        } />

        <Route path="/presupuestos/nuevo" element={
          <ProtectedRoute><PresupuestoFormPage /></ProtectedRoute>
        } />

        <Route path="/presupuestos/:id/editar" element={
          <ProtectedRoute><PresupuestoFormPage /></ProtectedRoute>
        } />

        <Route path="/ventas" element={
          <ProtectedRoute><VentasPage /></ProtectedRoute>
        } />

        <Route path="/ventas/nueva" element={
          <ProtectedRoute><VentaFormPage /></ProtectedRoute>
        } />

        <Route path="/gastos" element={
          <ProtectedRoute><GastosPage /></ProtectedRoute>
        } />

        {/* Redirige la raíz al dashboard (o al login si no está autenticado) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Toaster: el contenedor global de notificaciones toast (esquina inferior derecha) */}
      <Toaster />
    </BrowserRouter>
  )
}

export default App
