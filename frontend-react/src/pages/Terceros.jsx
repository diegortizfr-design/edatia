import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import Modal from '../components/Modal';
import { Users, UserPlus, Search, Phone, MapPin, Mail, CreditCard, CheckCircle } from 'lucide-react';

const Terceros = ({ initialMode = 'all' }) => {
    const [terceros, setTerceros] = useState([]);
    const [filteredTerceros, setFilteredTerceros] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState(initialMode); // 'all', 'cliente', 'proveedor'
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nombre_comercial: '',
        razon_social: '',
        tipo_documento: 'NIT',
        documento: '',
        telefono: '',
        direccion: '',
        email: '',
        es_cliente: true,
        es_proveedor: false
    });

    useEffect(() => {
        loadTerceros();
    }, [mode]);

    const loadTerceros = async () => {
        try {
            setLoading(true);
            let url = '/terceros';
            if (mode === 'cliente') url += '?tipo=cliente';
            if (mode === 'proveedor') url += '?tipo=proveedor';

            const resp = await api.get(url);
            if (resp.data.ok || resp.data.success) {
                setTerceros(resp.data.data);
                setFilteredTerceros(resp.data.data);
            }
        } catch (err) {
            console.error('Error loading terceros:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        const lowTerm = term.toLowerCase();
        const filtered = terceros.filter(t =>
            t.nombre_comercial.toLowerCase().includes(lowTerm) ||
            t.documento.includes(term) ||
            (t.razon_social && t.razon_social.toLowerCase().includes(lowTerm))
        );
        setFilteredTerceros(filtered);
    };

    const handleAction = (type, tercero) => {
        if (type === 'edit') {
            setIsEditing(true);
            setFormData({ ...tercero });
            setIsModalOpen(true);
        } else if (type === 'delete') {
            handleDelete(tercero.id);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Desea eliminar este registro?')) return;
        try {
            await api.delete(`/terceros/${id}`);
            loadTerceros();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/terceros/${formData.id}`, formData);
            } else {
                await api.post('/terceros', formData);
            }
            setIsModalOpen(false);
            loadTerceros();
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({
            nombre_comercial: '',
            razon_social: '',
            tipo_documento: 'NIT',
            documento: '',
            telefono: '',
            direccion: '',
            email: '',
            es_cliente: mode !== 'proveedor',
            es_proveedor: mode === 'proveedor'
        });
        setIsModalOpen(true);
    };

    const columns = [
        {
            label: 'Identificación',
            key: 'documento',
            render: (val, row) => (
                <div>
                    <strong>{val}</strong><br />
                    <small style={{ color: '#6B7280' }}>{row.tipo_documento}</small>
                </div>
            )
        },
        {
            label: 'Tercero',
            key: 'nombre_comercial',
            render: (val, row) => (
                <div>
                    <strong>{val}</strong><br />
                    <small style={{ color: '#6B7280' }}>{row.razon_social || ''}</small>
                </div>
            )
        },
        {
            label: 'Tipo',
            key: 'es_cliente',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {row.es_cliente && <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB' }}>Cliente</span>}
                    {row.es_proveedor && <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#7C3AED' }}>Proveedor</span>}
                </div>
            )
        },
        {
            label: 'Contacto',
            key: 'telefono',
            render: (val, row) => (
                <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={12} /> {val || '-'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={12} /> {row.email || '-'}</div>
                </div>
            )
        }
    ];

    return (
        <div className="terceros-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>
                        {mode === 'cliente' ? 'Gestión de Clientes' : mode === 'proveedor' ? 'Gestión de Proveedores' : 'Terceros (Clientes y Proveedores)'}
                    </h1>
                    <p style={{ color: 'var(--text-gray)' }}>Administra la información de contacto y fiscal de tus aliados comerciales.</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openCreateModal}>
                    <UserPlus size={18} /> {mode === 'proveedor' ? 'Nuevo Proveedor' : 'Nuevo Cliente'}
                </button>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={18} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por nombre, NIT o razón social..."
                            style={{ paddingLeft: '45px', marginBottom: 0 }}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    {initialMode === 'all' && (
                        <div className="btn-group" style={{ display: 'flex', background: '#f3f4f6', padding: '5px', borderRadius: '10px' }}>
                            <button className={`btn-tab ${mode === 'all' ? 'active' : ''}`} onClick={() => setMode('all')}>Todos</button>
                            <button className={`btn-tab ${mode === 'cliente' ? 'active' : ''}`} onClick={() => setMode('cliente')}>Clientes</button>
                            <button className={`btn-tab ${mode === 'proveedor' ? 'active' : ''}`} onClick={() => setMode('proveedor')}>Proveedores</button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Cargando registros...</div>
            ) : (
                <GenericTable
                    columns={columns}
                    data={filteredTerceros}
                    actions={['edit', 'delete']}
                    onAction={handleAction}
                />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Editar Tercero' : 'Registrar Tercero'}
                footer={(
                    <>
                        <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave}>Guardar Registro</button>
                    </>
                )}
            >
                <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Nombre Comercial / Nombre Completo</label>
                        <input type="text" className="form-control" value={formData.nombre_comercial} onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Razón Social (Opcional)</label>
                        <input type="text" className="form-control" value={formData.razon_social} onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Tipo Documento</label>
                        <select className="form-control" value={formData.tipo_documento} onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}>
                            <option value="NIT">NIT</option>
                            <option value="CC">Cédula de Ciudadanía</option>
                            <option value="CE">Cédula de Extranjería</option>
                            <option value="PP">Pasaporte</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Número Documento</label>
                        <input type="text" className="form-control" value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Teléfono</label>
                        <input type="text" className="form-control" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Dirección</label>
                        <input type="text" className="form-control" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', paddingTop: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.es_cliente} onChange={(e) => setFormData({ ...formData, es_cliente: e.target.checked })} /> Es Cliente
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.es_proveedor} onChange={(e) => setFormData({ ...formData, es_proveedor: e.target.checked })} /> Es Proveedor
                        </label>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Terceros;
