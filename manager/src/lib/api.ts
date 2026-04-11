import axios from 'axios';

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
