import axios from 'axios'

/**
 * Extrae el mensaje de error de una respuesta Axios de Edatia API.
 */
export function getApiError(err: unknown, fallback = 'Ocurrió un error'): string {
  const data = (err as any)?.response?.data
  if (!data) return fallback

  const outer = data.message

  if (typeof outer === 'string') return outer
  if (Array.isArray(outer)) return outer[0] ?? fallback

  if (outer && typeof outer === 'object') {
    const inner = outer.message
    if (typeof inner === 'string') return inner
    if (Array.isArray(inner)) return inner[0] ?? fallback
  }

  return fallback
}

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.edatia.com'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ── Interceptor de Peticiones: Adjuntar token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edatia_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Interceptor de Respuestas: Manejo de 401 y Auto-Refresh ──────────────────
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processRefreshQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

function clearSession() {
  localStorage.removeItem('edatia_token')
  localStorage.removeItem('edatia_user')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as any

    // Si no es 401 o ya reintentamos, rechazar
    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err)
    }

    // No intentar refresh si la ruta es auth/login o auth/refresh
    const url: string = originalRequest.url ?? ''
    if (url.includes('/auth/login')) {
      return Promise.reject(err)
    }
    if (url.includes('/auth/refresh')) {
      clearSession()
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(api(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // El refresh token viaja en cookie httpOnly
      const res = await axios.post(
        `${BASE_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      )

      const { access_token } = res.data as { access_token: string }
      localStorage.setItem('edatia_token', access_token)

      processRefreshQueue(access_token)

      originalRequest.headers.Authorization = `Bearer ${access_token}`
      return api(originalRequest)
    } catch {
      refreshQueue = []
      clearSession()
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
