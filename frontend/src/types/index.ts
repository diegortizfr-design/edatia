export interface User {
  id: number
  email: string
  usuario: string
  nombre: string | null
  rol: string
  empresaId: number | null
  createdAt: string
  empresa?: { id: number; nombre: string; nit: string } | null
  profile?: { id: number; bio: string | null } | null
}

export interface AuthResponse {
  user: Omit<User, 'empresa' | 'profile'>
  access_token: string
}

export interface Empresa {
  id: number
  nit: string
  nombre: string
  direccion: string | null
  telefono: string | null
  createdAt: string
  _count: { usuarios: number }
}

export interface ApiError {
  statusCode: number
  message: { error?: string; message?: string | string[] } | string
  timestamp: string
  path: string
}

export interface StatsResponse {
  total: number
  admins?: number
  conUsuarios?: number
  sinUsuarios?: number
  porEmpresa?: Array<{ empresaId: number | null; _count: { id: number } }>
}
