import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Package, ShoppingCart, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        { path: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { path: '/ecommerce', icon: <Store size={22} />, label: 'E-commerce' },
        { path: '/inventario', icon: <Package size={22} />, label: 'Inventario' },
        { path: '/compras', icon: <ShoppingCart size={22} />, label: 'Compras' },
        { path: '/configuracion', icon: <Settings size={22} />, label: 'Configuración' },
    ];

    return (
        <aside className="sidebar">
            <div className="logo-box">
                <img src="/assets/logo.png" alt="Logo" />
                <h2>ERPod</h2>
            </div>

            <nav className="menu">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                    >
                        <span className="icon">{item.icon}</span>
                        <span className="label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <button className="btn-logout" onClick={logout}>
                <LogOut size={22} />
                <span>Cerrar Sesión</span>
            </button>
        </aside>
    );
};

export default Sidebar;
