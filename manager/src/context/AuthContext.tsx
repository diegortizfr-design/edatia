import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface Colaborador {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  perfilCargo?: { id: number; nombre: string } | null;
}

interface AuthContextValue {
  colaborador: Colaborador | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('manager_token');
    const storedUser  = localStorage.getItem('manager_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setColaborador(JSON.parse(storedUser) as Colaborador);
      } catch {
        localStorage.removeItem('manager_token');
        localStorage.removeItem('manager_user');
      }
    }
    setIsLoading(false);
  }, []);

  async function login(identifier: string, password: string) {
    const res = await api.post<{ access_token: string; colaborador: Colaborador }>(
      '/manager/auth/login',
      { identifier, password },
    );
    const { access_token, colaborador: col } = res.data;
    localStorage.setItem('manager_token', access_token);
    localStorage.setItem('manager_user', JSON.stringify(col));
    setToken(access_token);
    setColaborador(col);
  }

  function logout() {
    localStorage.removeItem('manager_token');
    localStorage.removeItem('manager_user');
    setToken(null);
    setColaborador(null);
  }

  return (
    <AuthContext.Provider value={{ colaborador, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
