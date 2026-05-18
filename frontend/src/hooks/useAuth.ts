import { useState, useCallback } from 'react'
import api from '@/services/api'
import type { LoginRequest } from '@/types'

// El token y el username se guardan en localStorage para sobrevivir recarga de página.
// localStorage es el equivalente de una sesión HTTP del lado del cliente.
const TOKEN_KEY = 'sae_token'
const USERNAME_KEY = 'sae_username'

export function useAuth() {
  // Estado inicial: lee lo que haya en localStorage al cargar la app
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = token !== null

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/auth/login', credentials)
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USERNAME_KEY, data.username)
      setToken(data.token)
      setUsername(data.username)
      return true
    } catch {
      setError('Usuario o contraseña incorrectos')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USERNAME_KEY)
    setToken(null)
    setUsername(null)
  }, [])

  return { isAuthenticated, username, loading, error, login, logout }
}
