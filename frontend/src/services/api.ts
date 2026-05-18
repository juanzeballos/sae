import axios from 'axios'

/**
 * Instancia configurada de axios para llamar al backend Spring Boot.
 *
 * Equivalente a tener un RestTemplate preconfigurado en Java.
 * En lugar de escribir la URL completa en cada llamada, la tenemos aqui.
 *
 * Uso en otros archivos:
 *   import api from '@/services/api'
 *   const response = await api.get('/productos')
 */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de request: agrega el token JWT automaticamente en cada llamada
// Es como un filtro que se ejecuta antes de cada request HTTP
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sae_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de response: si el server devuelve 401 (no autorizado),
// limpia el token y redirige al login automaticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sae_token')
      localStorage.removeItem('sae_username')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
