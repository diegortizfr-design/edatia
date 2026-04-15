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
  // withCredentials permite que el navegador envíe cookies httpOnly en peticiones
  // cross-origin (mismo site: manager.edatia.com ↔ api.edatia.com).
  // La cookie manager_refresh tiene path=/api/v1/manager/auth, así que el navegador
  // solo la enviará en peticiones a esa ruta aunque withCredentials sea global.
  withCredentials: true,
});

// ── Request interceptor: adjunta access token en cada petición ───────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('manager_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: maneja 401 con auto-refresh ────────────────────────
//
// Patrón cola: si hay un refresh en curso y llegan más peticiones con 401,
// se encolan y se reintentan cuando el nuevo access token esté listo.
// Si el refresh falla, se cierra sesión completamente.

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processRefreshQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

function clearSession() {
  // Intentar invalidar el refresh token en el servidor (best-effort)
  const token = localStorage.getItem('manager_token');
  axios
    .post(
      `${BASE_URL}/api/v1/manager/auth/logout`,
      {},
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    )
    .catch(() => {
      // Ignorar errores — el acceso ya no es válido
    });

  localStorage.removeItem('manager_token');
  localStorage.removeItem('manager_user');
  window.location.href = '/login';
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config as any;

    // Solo actuar en 401 y evitar bucle infinito (_retry flag)
    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    // No intentar refresh si el propio refresh/login falló
    const url: string = originalRequest.url ?? '';
    if (url.includes('/manager/auth/refresh') || url.includes('/manager/auth/login')) {
      clearSession();
      return Promise.reject(err);
    }

    // Si ya hay un refresh en curso: encolar la petición y esperar
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // El refresh token viaja en la cookie httpOnly — no se lee desde localStorage.
      // withCredentials: true hace que el navegador adjunte la cookie automáticamente.
      const res = await axios.post(
        `${BASE_URL}/api/v1/manager/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const { access_token } = res.data as { access_token: string };

      localStorage.setItem('manager_token', access_token);

      // Procesar cola de peticiones que estaban esperando el nuevo token
      processRefreshQueue(access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch {
      // Refresh falló — la cookie puede haber expirado o ser inválida
      refreshQueue = [];
      clearSession();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
