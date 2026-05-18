import { Navigate } from 'react-router-dom'

// ProtectedRoute: envuelve rutas que requieren estar logueado.
// Si no hay token en localStorage, redirige al login.
// Es el equivalente de un @PreAuthorize en Spring Security.
//
// Uso en App.tsx:
//   <Route path="/productos" element={<ProtectedRoute><ProductosPage /></ProtectedRoute>} />
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('sae_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
