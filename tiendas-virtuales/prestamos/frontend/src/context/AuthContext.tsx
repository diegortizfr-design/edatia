import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

export interface Tenant {
  id: string;
  nit: string;
  name: string;
  email: string;
  isPremium: boolean;
  phone?: string;
  address?: string;
  lateInterestEnabled?: boolean;
  lateInterestRate?: number;
  lateInterestPeriod?: string;
}

interface AuthContextType {
  tenant: Tenant | null;
  loading: boolean;
  login: (nit: string, email: string, password: string) => Promise<void>;
  register: (nit: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on load and fetch profile
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('prestamos_token');
      if (token) {
        try {
          const tenantData = await apiCall('/auth/me');
          setTenant(tenantData);
        } catch (error) {
          console.error('Failed to load profile on start:', error);
          localStorage.removeItem('prestamos_token');
          setTenant(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (nit: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiCall('/auth/login', {
        method: 'POST',
        bodyData: { nit, email, password }
      });
      localStorage.setItem('prestamos_token', res.token);
      setTenant(res.tenant);
    } catch (error) {
      setTenant(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (nit: string, name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiCall('/auth/register', {
        method: 'POST',
        bodyData: { nit, name, email, password }
      });
      localStorage.setItem('prestamos_token', res.token);
      setTenant(res.tenant);
    } catch (error) {
      setTenant(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('prestamos_token');
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{
      tenant,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!tenant
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
