import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Boxes, FileText, ShoppingCart, CheckCircle, Instagram, Linkedin, Twitter, ArrowRight } from 'lucide-react';
import './Landing.css';

const Landing = () => {
    return (
        <div className="landing-wrapper">
            {/* NAVBAR */}
            <nav className="landing-navbar">
                <div className="landing-logo">
                    <Box size={24} color="#4F46E5" /> ERPod
                </div>
                <div className="landing-nav-links">
                    <a href="#features">Características</a>
                    <a href="#pricing">Planes</a>
                    <a href="#contact">Contacto</a>
                </div>
                <div className="landing-nav-actions">
                    <Link to="/login" className="landing-btn-login">Iniciar Sesión</Link>
                    <a href="#contact" className="landing-btn-cta">Demo Gratis</a>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="landing-hero">
                <div className="landing-hero-content">
                    <h1>Gestiona tu empresa <br /> <span className="landing-highlight">sin límites</span></h1>
                    <p>ERPod es la plataforma todo-en-uno para Inventarios, Compras, Facturación POS y Tienda Virtual. Diseñado para crecer contigo.</p>
                    <div className="landing-hero-buttons">
                        <a href="#contact" className="landing-btn-primary">Adquirir Software</a>
                        <a href="#features" className="landing-btn-secondary">Ver cómo funciona</a>
                    </div>
                    <div className="landing-stats">
                        <div className="landing-stat-item">
                            <strong>+5</strong>
                            <span>Empresas</span>
                        </div>
                        <div className="landing-stat-item">
                            <strong>99.9%</strong>
                            <span>Uptime</span>
                        </div>
                    </div>
                </div>
                <div className="landing-hero-image">
                    <div className="landing-ui-card landing-glass-card">
                        <div className="landing-card-header">
                            <div className="landing-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="landing-card-body">
                            <div className="landing-chart-mockup">
                                <div className="landing-bar" style={{ height: '40%' }}></div>
                                <div className="landing-bar" style={{ height: '70%' }}></div>
                                <div className="landing-bar" style={{ height: '50%' }}></div>
                                <div className="landing-bar" style={{ height: '85%' }}></div>
                                <div className="landing-bar landing-active" style={{ height: '100%' }}></div>
                            </div>
                            <div className="landing-floating-badge">
                                <CheckCircle size={18} color="#10B981" /> Ventas +120%
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* FEATURES */}
            <section id="features" className="landing-features">
                <h2>Todo lo que necesitas en un solo lugar</h2>
                <div className="landing-feature-grid">
                    <div className="landing-feature-card">
                        <div className="landing-icon-box"><Boxes /></div>
                        <h3>Inventario Real</h3>
                        <p>Control de stock multi-bodega con alertas automáticas de reabastecimiento.</p>
                    </div>
                    <div className="landing-feature-card">
                        <div className="landing-icon-box"><FileText /></div>
                        <h3>Facturación POS</h3>
                        <p>Punto de venta rápido y facturación electrónica cumpliendo norma DIAN.</p>
                    </div>
                    <div className="landing-feature-card">
                        <div className="landing-icon-box"><ShoppingCart /></div>
                        <h3>Tienda Virtual</h3>
                        <p>Conecta tu web existente con nuestro plugin y vende online al instante.</p>
                    </div>
                </div>
            </section>

            {/* CONTACT / LEAD FORM */}
            <section id="contact" className="landing-contact-section">
                <div className="landing-contact-container landing-glass-panel">
                    <div className="landing-contact-text">
                        <h2>¿Listo para digitalizar tu negocio?</h2>
                        <p>Déjanos tus datos y un asesor especializado te contactará para configurar tu demo personalizada.</p>
                        <ul className="landing-benefits-list">
                            <li><CheckCircle size={16} color="#10B981" /> Sin contratos de permanencia</li>
                            <li><CheckCircle size={16} color="#10B981" /> Soporte 24/7 incluido</li>
                            <li><CheckCircle size={16} color="#10B981" /> Migración de datos gratuita</li>
                        </ul>
                    </div>
                    <div className="landing-contact-form-wrapper">
                        <form className="landing-lead-form">
                            <h3>Adquiere nuestro software</h3>
                            <div className="landing-form-group">
                                <label>Nombre Completo</label>
                                <input type="text" placeholder="Ej: Juan Pérez" required />
                            </div>
                            <div className="landing-form-group">
                                <label>Nombre de la Empresa</label>
                                <input type="text" placeholder="Ej: Moda S.A.S" required />
                            </div>
                            <div className="landing-form-group">
                                <label>Correo Electrónico</label>
                                <input type="email" placeholder="juan@empresa.com" required />
                            </div>
                            <div className="landing-form-group">
                                <label>Teléfono / WhatsApp</label>
                                <input type="tel" placeholder="+57 300 123 4567" required />
                            </div>
                            <button type="submit" className="landing-btn-submit">
                                Solicitar Contacto <ArrowRight size={18} />
                            </button>
                            <p className="landing-form-disclaimer">Tus datos están seguros. Política de Privacidad.</p>
                        </form>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="landing-footer-content">
                    <p>&copy; 2025 ERPod Software. Todos los derechos reservados.</p>
                    <div className="landing-socials">
                        <a href="#"><Instagram size={20} /></a>
                        <a href="#"><Linkedin size={20} /></a>
                        <a href="#"><Twitter size={20} /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
