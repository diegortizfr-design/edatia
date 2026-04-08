import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.edatia.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Adjuntar token JWT a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edatia_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Manejar expiración de sesión globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('edatia_token')
      localStorage.removeItem('edatia_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
