import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import Modal from '../components/Modal';
import {
    Settings, Building2, MapPin, Users, FileStack,
    Percent, Save, Plus, Trash2, CreditCard, FileText, DollarSign, Edit
} from 'lucide-react';

const Configuracion = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('empresa');

    // Read tab from URL query params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [location]);

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
    const [isSucursalModalOpen, setIsSucursalModalOpen] = useState(false);
    const [currentSucursal, setCurrentSucursal] = useState(null);

    // Usuarios State
    const [usuarios, setUsuarios] = useState([]);

    // Documentos State
    const [documentos, setDocumentos] = useState([]);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState(null);

    // Impuestos State
    const [impuestos, setImpuestos] = useState([]);
    const [isImpuestoModalOpen, setIsImpuestoModalOpen] = useState(false);
    const [currentImpuesto, setCurrentImpuesto] = useState(null);

    // Métodos de Pago State
    const [metodosPago, setMetodosPago] = useState([]);
    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
    const [currentPago, setCurrentPago] = useState(null);

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
                if (resp.data.ok || resp.data.success) setSucursales(resp.data.data || []);
            } else if (activeTab === 'usuarios') {
                const resp = await api.get('/auth/users');
                if (resp.data.ok || resp.data.success) setUsuarios(resp.data.data || []);
            } else if (activeTab === 'documentos') {
                const resp = await api.get('/documentos');
                if (resp.data.ok || resp.data.success) setDocumentos(resp.data.data || []);
            } else if (activeTab === 'impuestos') {
                const resp = await api.get('/impuestos');
                if (resp.data.ok || resp.data.success) setImpuestos(resp.data.data || []);
            } else if (activeTab === 'pagos') {
                const resp = await api.get('/metodos-pago');
                if (resp.data.ok || resp.data.success) setMetodosPago(resp.data.data || []);
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

    // ===== EMPRESA =====
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

    // ===== SUCURSALES =====
    const renderSucursales = () => (
        <div className="card dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Mis Sucursales</h3>
                <button className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.85rem' }} onClick={() => { setCurrentSucursal(null); setIsSucursalModalOpen(true); }}>
                    <Plus size={16} /> Nueva Sucursal
                </button>
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
                onAction={(type, item) => {
                    if (type === 'edit') {
                        setCurrentSucursal(item);
                        setIsSucursalModalOpen(true);
                    } else if (type === 'delete') {
                        handleDeleteSucursal(item.id);
                    }
                }}
            />
        </div>
    );

    const handleDeleteSucursal = async (id) => {
        if (!confirm('¿Eliminar sucursal?')) return;
        try {
            await api.delete(`/sucursales/${id}`);
            loadConfig();
        } catch (err) {
            console.error(err);
        }
    };

    // ===== USUARIOS =====
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

    // ===== DOCUMENTOS =====
    const renderDocumentos = () => (
        <div className="card dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Configuración de Documentos</h3>
                <button className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.85rem' }} onClick={() => { setCurrentDoc(null); setIsDocModalOpen(true); }}>
                    <Plus size={16} /> Nuevo Documento
                </button>
            </div>
            <GenericTable
                columns={[
                    { label: 'Categoría', key: 'categoria' },
                    { label: 'Nombre', key: 'nombre' },
                    { label: 'Prefijo', key: 'prefijo' },
                    { label: 'Consecutivo', key: 'consecutivo_actual' },
                    { label: 'Resolución', key: 'resolucion_numero', render: (val) => val || '-' },
                    { label: 'Estado', key: 'estado', render: (val) => <span className="badge" style={{ background: val ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: val ? '#10B981' : '#EF4444' }}>{val ? 'Activo' : 'Inactivo'}</span> }
                ]}
                data={documentos}
                actions={['edit', 'delete']}
                onAction={(type, item) => {
                    if (type === 'edit') {
                        setCurrentDoc(item);
                        setIsDocModalOpen(true);
                    } else if (type === 'delete') {
                        handleDeleteDoc(item.id);
                    }
                }}
            />
        </div>
    );

    const handleDeleteDoc = async (id) => {
        if (!confirm('¿Eliminar documento?')) return;
        try {
            await api.delete(`/documentos/${id}`);
            loadConfig();
        } catch (err) {
            console.error(err);
        }
    };

    // ===== IMPUESTOS =====
    const renderImpuestos = () => (
        <div className="card dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Configuración de Impuestos</h3>
                <button className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.85rem' }} onClick={() => { setCurrentImpuesto(null); setIsImpuestoModalOpen(true); }}>
                    <Plus size={16} /> Nuevo Impuesto
                </button>
            </div>
            <GenericTable
                columns={[
                    { label: 'Nombre', key: 'nombre' },
                    { label: 'Descripción', key: 'descripcion' },
                    { label: 'Porcentaje', key: 'porcentaje', render: (val) => `${val}%` },
                    { label: 'Tipo', key: 'tipo' },
                    { label: 'Estado', key: 'activo', render: (val) => <span className="badge" style={{ background: val ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: val ? '#10B981' : '#EF4444' }}>{val ? 'Activo' : 'Inactivo'}</span> }
                ]}
                data={impuestos}
                actions={['edit', 'delete']}
                onAction={(type, item) => {
                    if (type === 'edit') {
                        setCurrentImpuesto(item);
                        setIsImpuestoModalOpen(true);
                    }
                }}
            />
        </div>
    );

    // ===== MÉTODOS DE PAGO =====
    const renderPagos = () => (
        <div className="card dashboard-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Métodos de Pago</h3>
                <button className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.85rem' }} onClick={() => { setCurrentPago(null); setIsPagoModalOpen(true); }}>
                    <Plus size={16} /> Nuevo Método
                </button>
            </div>
            <GenericTable
                columns={[
                    { label: 'Método', key: 'nombre' },
                    { label: 'Tipo', key: 'tipo' },
                    { label: 'Cuenta', key: 'cuenta_contable' },
                    { label: 'Visible POS', key: 'visible_pos', render: (val) => <span className="badge" style={{ background: val ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: val ? '#10B981' : '#EF4444' }}>{val ? 'Sí' : 'No'}</span> }
                ]}
                data={metodosPago}
                actions={['edit']}
                onAction={(type, item) => {
                    if (type === 'edit') {
                        setCurrentPago(item);
                        setIsPagoModalOpen(true);
                    }
                }}
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
                        <button className={`nav-tab ${activeTab === 'pagos' ? 'active' : ''}`} onClick={() => setActiveTab('pagos')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s', fontWeight: 500, color: activeTab === 'pagos' ? 'white' : '#6B7280', background: activeTab === 'pagos' ? 'var(--primary-color)' : 'transparent', marginBottom: '5px' }}>
                            <CreditCard size={20} /> Métodos de Pago
                        </button>
                    </div>
                </aside>

                <main className="config-content" style={{ flex: 1 }}>
                    {activeTab === 'empresa' && renderEmpresa()}
                    {activeTab === 'sucursales' && renderSucursales()}
                    {activeTab === 'usuarios' && renderUsuarios()}
                    {activeTab === 'documentos' && renderDocumentos()}
                    {activeTab === 'impuestos' && renderImpuestos()}
                    {activeTab === 'pagos' && renderPagos()}
                </main>
            </div>

            {/* Modals would go here - simplified for now */}
        </div>
    );
};

export default Configuracion;
