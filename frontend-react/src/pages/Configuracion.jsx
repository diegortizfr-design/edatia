import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import Modal from '../components/Modal';
import {
    Settings, Building2, MapPin, Users, FileStack,
    Percent, Save, Mail, Globe, Phone, Shield, Plus, Trash2
} from 'lucide-react';

const Configuracion = () => {
    const [activeTab, setActiveTab] = useState('empresa');

    // Empresa State
    const [empresa, setEmpresa] = useState({
        tipo_figura: '',
        nombre_fiscal: '',
        nombre_comercial: '',
        nit: '',
        dv: '',
        direccion: '',
        telefono: '',
        correo: '',
        web: '',
        estado: 'Activo'
    });

    // Sucursales State
    const [sucursales, setSucursales] = useState([]);

    // Usuarios State
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        loadConfig();
    }, [activeTab]);

    const loadConfig = async () => {
        try {
            if (activeTab === 'empresa') {
                const resp = await api.get('/configuracion/empresa');
                if (resp.data.ok || resp.data.success) {
                    if (resp.data.data) setEmpresa(resp.data.data);
                }
            } else if (activeTab === 'sucursales') {
                const resp = await api.get('/sucursales');
                if (resp.data.ok || resp.data.success) setSucursales(resp.data.data);
            } else if (activeTab === 'usuarios') {
                const resp = await api.get('/auth/users');
                if (resp.data.ok || resp.data.success) setUsuarios(resp.data.data);
            }
        } catch (err) {
            console.error('Error loading config:', err);
        }
    };

    const handleSaveEmpresa = async (e) => {
        e.preventDefault();
        try {
            const resp = await api.put('/configuracion/empresa', empresa);
            if (resp.data.ok || resp.data.success) {
                alert('Configuración de empresa guardada');
            }
        } catch (err) {
            console.error('Error saving empresa:', err);
        }
    };

    const renderEmpresa = () => (
        <form onSubmit={handleSaveEmpresa} className="card dashboard-card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                    <label>Tipo de Figura</label>
                    <select className="form-control" value={empresa.tipo_figura} onChange={(e) => setEmpresa({ ...empresa, tipo_figura: e.target.value })}>
                        <option value="Natural">Persona Natural</option>
                        <option value="Juridica">Persona Jurídica</option>
                        <option value="SC">Sin Cámara de Comercio</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Nombre Fiscal</label>
                    <input type="text" className="form-control" value={empresa.nombre_fiscal} onChange={(e) => setEmpresa({ ...empresa, nombre_fiscal: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>Nombre Comercial</label>
                    <input type="text" className="form-control" value={empresa.nombre_comercial} onChange={(e) => setEmpresa({ ...empresa, nombre_comercial: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>NIT / Documento</label>
                    <input type="text" className="form-control" value={empresa.nit} onChange={(e) => setEmpresa({ ...empresa, nit: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>Dirección</label>
                    <input type="text" className="form-control" value={empresa.direccion} onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })} required />
                </div>
                <div className="form-group">
                    <label>Teléfono</label>
                    <input type="text" className="form-control" value={empresa.telefono} onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Email Contacto</label>
                    <input type="email" className="form-control" value={empresa.correo} onChange={(e) => setEmpresa({ ...empresa, correo: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Web</label>
                    <input type="url" className="form-control" value={empresa.web} onChange={(e) => setEmpresa({ ...empresa, web: e.target.value })} />
                </div>
            </div>
            <div style={{ marginTop: '25px' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>
        </form>
    );

    const renderSucursales = () => (
        <div className="card dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Mis Sucursales</h3>
                <button className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.85rem' }}><Plus size={16} /> Nueva Sucursal</button>
            </div>
            <GenericTable
                columns={[
                    { label: 'Nombre', key: 'nombre' },
                    { label: 'Dirección', key: 'direccion' },
                    { label: 'Teléfono', key: 'telefono' },
                    { label: 'Estado', key: 'estado', render: (val) => <span className="badge" style={{ background: val === 'Activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: val === 'Activo' ? '#10B981' : '#EF4444' }}>{val}</span> }
                ]}
                data={sucursales}
                actions={['edit', 'delete']}
                onAction={(type, item) => console.log(type, item)}
            />
        </div>
    );

    const renderUsuarios = () => (
        <div className="card dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Gestión de Accesos</h3>
                <button className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.85rem' }}><Plus size={16} /> Nuevo Usuario</button>
            </div>
            <GenericTable
                columns={[
                    { label: 'Nombre', key: 'username' },
                    { label: 'Email', key: 'email' },
                    { label: 'Rol', key: 'rol', render: (val) => <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}>{val || 'Admin'}</span> },
                    { label: 'Estado', key: 'activo', render: (val) => <span className="badge" style={{ background: val ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: val ? '#10B981' : '#EF4444' }}>{val ? 'Activo' : 'Inactivo'}</span> }
                ]}
                data={usuarios}
                actions={['edit', 'delete']}
                onAction={(type, item) => console.log(type, item)}
            />
        </div>
    );

    return (
        <div className="config-page">
            <div className="page-header" style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>Configuración del Sistema</h1>
                <p style={{ color: 'var(--text-gray)' }}>Centraliza el control de tu empresa, sucursales y permisos.</p>
            </div>

            <div className="config-layout" style={{ display: 'flex', gap: '30px' }}>
                <aside className="config-sidebar" style={{ width: '250px' }}>
                    <div className="card dashboard-card" style={{ padding: '10px' }}>
                        <button className={`nav-tab ${activeTab === 'empresa' ? 'active' : ''}`} onClick={() => setActiveTab('empresa')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500, color: activeTab === 'empresa' ? 'white' : '#6B7280', background: activeTab === 'empresa' ? 'var(--primary-color)' : 'transparent', marginBottom: '5px' }}>
                            <Building2 size={20} /> Empresa
                        </button>
                        <button className={`nav-tab ${activeTab === 'sucursales' ? 'active' : ''}`} onClick={() => setActiveTab('sucursales')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500, color: activeTab === 'sucursales' ? 'white' : '#6B7280', background: activeTab === 'sucursales' ? 'var(--primary-color)' : 'transparent', marginBottom: '5px' }}>
                            <MapPin size={20} /> Sucursales
                        </button>
                        <button className={`nav-tab ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500, color: activeTab === 'usuarios' ? 'white' : '#6B7280', background: activeTab === 'usuarios' ? 'var(--primary-color)' : 'transparent', marginBottom: '5px' }}>
                            <Users size={20} /> Usuarios
                        </button>
                        <button className={`nav-tab ${activeTab === 'documentos' ? 'active' : ''}`} onClick={() => setActiveTab('documentos')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500, color: activeTab === 'documentos' ? 'white' : '#6B7280', background: activeTab === 'documentos' ? 'var(--primary-color)' : 'transparent', marginBottom: '5px' }}>
                            <FileStack size={20} /> Documentos
                        </button>
                        <button className={`nav-tab ${activeTab === 'impuestos' ? 'active' : ''}`} onClick={() => setActiveTab('impuestos')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500, color: activeTab === 'impuestos' ? 'white' : '#6B7280', background: activeTab === 'impuestos' ? 'var(--primary-color)' : 'transparent', marginBottom: '5px' }}>
                            <Percent size={20} /> Impuestos
                        </button>
                    </div>
                </aside>

                <main className="config-content" style={{ flex: 1 }}>
                    {activeTab === 'empresa' && renderEmpresa()}
                    {activeTab === 'sucursales' && renderSucursales()}
                    {activeTab === 'usuarios' && renderUsuarios()}
                    {['documentos', 'impuestos'].includes(activeTab) && (
                        <div className="card dashboard-card" style={{ textAlign: 'center', padding: '50px' }}>
                            <Settings size={40} color="#9CA3AF" style={{ marginBottom: '15px' }} />
                            <h3>Próximamente</h3>
                            <p style={{ color: '#6B7280' }}>Estamos terminando de migrar este módulo de configuración.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Configuracion;
