import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Store, Package, ShoppingCart, Settings, LogOut,
    Wallet, Users, Layers, FileText, BarChart3, ChevronDown, ChevronRight,
    Building2, MapPin, FileStack
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { logout } = useAuth();
    const [configOpen, setConfigOpen] = useState(false);

    const mainMenuItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { path: '/facturacion', icon: <Wallet size={22} />, label: 'Ventas (POS)' },
        { path: '/lista-facturas', icon: <FileText size={22} />, label: 'Facturas' },
        { path: '/ecommerce', icon: <Store size={22} />, label: 'E-commerce' },
        { path: '/compras', icon: <ShoppingCart size={22} />, label: 'Compras' },
        { path: '/inventario', icon: <Layers size={22} />, label: 'Inventario' },
        { path: '/reportes', icon: <BarChart3 size={22} />, label: 'Reportes' },
    ];

    const configMenuItems = [
        { path: '/configuracion', icon: <Building2 size={20} />, label: 'Empresa', query: '?tab=empresa' },
        { path: '/configuracion', icon: <MapPin size={20} />, label: 'Sucursales', query: '?tab=sucursales' },
        { path: '/configuracion', icon: <FileStack size={20} />, label: 'Documentos', query: '?tab=documentos' },
        { path: '/productos', icon: <Package size={20} />, label: 'Productos' },
        { path: '/terceros', icon: <Users size={20} />, label: 'Terceros' },
    ];

    return (
        <aside className="sidebar">
            <div className="logo-box">
                <img src="/assets/logo.png" alt="Logo" />
                <h2>ERPod</h2>
            </div>

            <nav className="menu">
                {mainMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="icon">{item.icon}</span>
                        <span className="label">{item.label}</span>
                    </NavLink>
                ))}

                {/* Configuración Collapsible Section */}
                <div className="menu-section">
                    <button
                        className={`menu-link menu-toggle ${configOpen ? 'open' : ''}`}
                        onClick={() => setConfigOpen(!configOpen)}
                    >
                        <span className="icon"><Settings size={22} /></span>
                        <span className="label">Configuración</span>
                        <span className="chevron">
                            {configOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                    </button>

                    {configOpen && (
                        <div className="submenu">
                            {configMenuItems.map((item, idx) => (
                                <NavLink
                                    key={idx}
                                    to={item.path + (item.query || '')}
                                    className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
                                >
                                    <span className="icon">{item.icon}</span>
                                    <span className="label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            <button className="btn-logout" onClick={logout}>
                <LogOut size={22} />
                <span>Cerrar Sesión</span>
            </button>
        </aside>
    );
};

export default Sidebar;
