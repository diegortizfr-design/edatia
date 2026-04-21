import api from './api'
import type { AuthResponse, User } from '../types'

export interface LoginPayload {
  nit: string
  identifier: string
  password: string
}

export interface RegisterPayload {
  email: string
  usuario: string
  nombre: string
  password: string
  empresaId?: number
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    return data
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  saveSession(response: AuthResponse) {
    localStorage.setItem('edatia_token', response.access_token)
    localStorage.setItem('edatia_user', JSON.stringify(response.user))
  },

  clearSession() {
    localStorage.removeItem('edatia_token')
    localStorage.removeItem('edatia_user')
  },

  getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('edatia_user')
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('edatia_token')
  },
}
