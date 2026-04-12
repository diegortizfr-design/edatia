import axios from 'axios';

/**
 * Extrae el mensaje de error de una respuesta Axios.
 * El AllExceptionsFilter del backend envuelve los errores así:
 * { message: { statusCode, message: string | string[], error } }
 */
export function getApiError(err: unknown, fallback = 'Ocurrió un error'): string {
  const data = (err as any)?.response?.data;
  if (!data) return fallback;

  const outer = data.message;

  if (typeof outer === 'string') return outer;
  if (Array.isArray(outer)) return outer[0] ?? fallback;

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

// ── Request interceptor: adjunta token en cada petición ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('manager_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: maneja 401 con auto-refresh ────────────────────────
//
// Patrón: si hay un refresh en curso, las peticiones que lleguen mientras tanto
// se encolan y se reintentan cuando el nuevo access token esté listo.
// Si el refresh falla, todos los pendientes se rechazan y se cierra la sesión.

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processRefreshQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

function clearSession() {
  localStorage.removeItem('manager_token');
  localStorage.removeItem('manager_refresh_token');
  localStorage.removeItem('manager_user');
  window.location.href = '/login';
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as any;

    // Solo actuar en 401 y evitar bucle infinito (_retry)
    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    const refreshToken = localStorage.getItem('manager_refresh_token');
    if (!refreshToken) {
      clearSession();
      return Promise.reject(err);
    }

    // Si ya hay un refresh en curso: encolar y esperar
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
        // Si el refresh falla, el error llegará por clearSession → reject nunca
        // se llama explícitamente aquí pero la página navega a /login
        void reject; // satisface lint
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Usar axios directo (no `api`) para evitar interceptar esta petición
      const res = await axios.post(`${BASE_URL}/api/v1/manager/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = res.data as {
        access_token: string;
        refresh_token: string;
      };

      localStorage.setItem('manager_token', access_token);
      localStorage.setItem('manager_refresh_token', newRefreshToken);

      // Procesar cola de peticiones pendientes
      processRefreshQueue(access_token);

      // Reintentar la petición original
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch {
      // Refresh falló — cerrar sesión
      refreshQueue = [];
      clearSession();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
