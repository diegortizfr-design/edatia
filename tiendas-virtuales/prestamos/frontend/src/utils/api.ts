const API_BASE = '/api';

export interface ApiOptions extends RequestInit {
  bodyData?: any;
}

export const apiCall = async (endpoint: string, options: ApiOptions = {}) => {
  const token = localStorage.getItem('prestamos_token');
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.bodyData) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.bodyData);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Session expired or invalid
    localStorage.removeItem('prestamos_token');
    localStorage.removeItem('prestamos_tenant');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Sesión expirada.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ha ocurrido un error en el servidor.');
  }

  return data;
};
