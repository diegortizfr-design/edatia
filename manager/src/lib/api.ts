import axios from 'axios';

/**
 * Extrae el mensaje de error de una respuesta Axios.
 * El AllExceptionsFilter del backend envuelve los errores así:
 * { message: { statusCode, message: string | string[], error } }
 */
export function getApiError(err: unknown, fallback = 'Ocurrió un error'): string {
  const data = (err as any)?.response?.data;
  if (!data) return fallback;

  // Nivel externo: data.message puede ser objeto o string
  const outer = data.message;

  if (typeof outer === 'string') return outer;
  if (Array.isArray(outer)) return outer[0] ?? fallback;

  // Nivel interno: data.message.message (AllExceptionsFilter wrapping)
  if (outer && typeof outer === 'object') {
    const inner = outer.message;
    if (typeof inner === 'string') return inner;
    if (Array.isArray(inner)) return inner[0] ?? fallback;
  }

  return fallback;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.edatia.com';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('manager_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('manager_token');
      localStorage.removeItem('manager_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
