import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="glass-header">
            <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input type="text" placeholder="Buscar en el ERP..." />
            </div>

            <div className="header-actions">
                <button className="icon-btn"><Bell size={20} /></button>
                <div className="user-profile">
                    <div className="user-info">
                        <span className="user-name">{user?.nombre || 'Administrador'}</span>
                        <span className="user-role">{user?.rol || 'Admin'}</span>
                    </div>
                    <div className="avatar">
                        <User size={24} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
