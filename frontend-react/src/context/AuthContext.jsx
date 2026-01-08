import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                setUser(JSON.parse(userData));
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const resp = await api.post('/auth/login', credentials);
            // Backend uses { ok: true, data: {...}, token: "..." }
            if (resp.data.ok) {
                const { token, data } = resp.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(data));
                setUser(data);
                return { success: true };
            }
            return { success: false, message: resp.data.message };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Error de conexión con el servidor';
            return { success: false, message: errorMsg };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
