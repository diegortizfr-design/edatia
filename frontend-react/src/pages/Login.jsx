import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [nit, setNit] = useState('');
    const [usuario, setUsuario] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMsg({ text: 'Procesando... (Esto puede tardar hasta 1 minuto si el servidor está en reposo)', type: 'info' });

        const result = await login({ nit, usuario, contraseña });

        if (result.success) {
            setMsg({ text: '¡Bienvenido! Redirigiendo...', type: 'success' });
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } else {
            setMsg({ text: result.message || 'Credenciales incorrectas', type: 'error' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {/* LADO IZQUIERDO: BRANDING */}
                <div className="login-left">
                    <div className="branding-box">
                        <img src="/assets/logo.png" alt="ERPod Logo" className="login-logo" />
                        <h1>ERPod SOFTWARE.</h1>
                        <p>Gestión inteligente para empresas modernas.</p>
                    </div>
                </div>

                {/* LADO DERECHO: FORMULARIO */}
                <div className="login-right">
                    <div className="form-box">
                        <h2>Iniciar Sesión</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="login-input-group">
                                <label>NIT Empresa</label>
                                <input
                                    type="text"
                                    value={nit}
                                    onChange={(e) => setNit(e.target.value)}
                                    placeholder="Ingresa el NIT"
                                    required
                                />
                            </div>

                            <div className="login-input-group">
                                <label>Usuario</label>
                                <input
                                    type="text"
                                    value={usuario}
                                    onChange={(e) => setUsuario(e.target.value)}
                                    placeholder="Tu usuario"
                                    required
                                />
                            </div>

                            <div className="login-input-group">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    value={contraseña}
                                    onChange={(e) => setContraseña(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {msg.text && (
                                <div className={`login-msg ${msg.type}`}>
                                    {msg.text}
                                </div>
                            )}

                            <button type="submit" className="login-btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Conectando...' : 'Ingresar'}
                            </button>

                            <div className="login-extra">
                                <a href="#">¿Olvidaste tu contraseña?</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <footer className="login-footer">
                <p>© 2025 ERPod SOFTWARE - Diseñado por DIEGO ORTIZ</p>
            </footer>
        </div>
    );
};

export default Login;
