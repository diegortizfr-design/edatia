import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import Modal from '../components/Modal';
import {
    Truck, Plus, FileText, Eye, CheckCircle, XCircle,
    Search, Trash2, ShoppingCart, Calendar, MapPin,
    ArrowRight, Box, DollarSign, Upload, ClipboardCheck
} from 'lucide-react';

const Compras = () => {
    const [compras, setCompras] = useState([]);
    const [filteredCompras, setFilteredCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ porPagar: 0, pendientes: 0, completadas: 0 });

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);

    // Create Form State
    const [proveedores, setProveedores] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [formData, setFormData] = useState({
        proveedor_id: '',
        sucursal_id: '',
        fecha: new Date().toISOString().split('T')[0],
        referencia: '',
        items: []
    });

    // Product Search
    const [searchProd, setSearchProd] = useState('');
    const [searchResult, setSearchResult] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [compResp, provResp, sucResp] = await Promise.all([
                api.get('/compras'),
                api.get('/terceros?tipo=proveedor'),
                api.get('/sucursales')
            ]);

            if (compResp.data.ok || compResp.data.success) {
                setCompras(compResp.data.data);
                setFilteredCompras(compResp.data.data);
                calculateStats(compResp.data.data);
            }
            if (provResp.data.ok || provResp.data.success) setProveedores(provResp.data.data);
            if (sucResp.data.ok || sucResp.data.success) setSucursales(sucResp.data.data);

        } catch (err) {
            console.error('Error loading compras data:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const porPagar = data.filter(c => c.estado_pago !== 'Pago').reduce((acc, c) => acc + parseFloat(c.total), 0);
        const pendientes = data.filter(c => c.estado === 'Orden de Compra').length;
        const completadas = data.filter(c => c.estado === 'Completada').length;
        setStats({ porPagar, pendientes, completadas });
    };

    const handleSearchProduct = async (term) => {
        setSearchProd(term);
        if (term.length < 2) {
            setSearchResult([]);
            return;
        }
        try {
            const resp = await api.get(`/productos?busqueda=${encodeURIComponent(term)}`);
            if (resp.data.ok || resp.data.success) {
                setSearchResult(resp.data.data);
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    };

    const addItem = (prod) => {
        const existing = formData.items.find(i => i.producto_id === prod.id);
        if (existing) {
            setFormData({
                ...formData,
                items: formData.items.map(i => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.costo } : i)
            });
        } else {
            setFormData({
                ...formData,
                items: [...formData.items, {
                    producto_id: prod.id,
                    nombre: prod.nombre,
                    cantidad: 1,
                    costo: parseFloat(prod.costo || 0),
                    subtotal: parseFloat(prod.costo || 0)
                }]
            });
        }
        setSearchProd('');
        setSearchResult([]);
    };

    const updateItem = (index, field, val) => {
        const newItems = [...formData.items];
        newItems[index][field] = parseFloat(val);
        newItems[index].subtotal = newItems[index].cantidad * newItems[index].costo;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = (index) => {
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    };

    const handleSaveCompra = async () => {
        if (!formData.proveedor_id || !formData.sucursal_id || formData.items.length === 0) {
            alert('Por favor complete todos los datos.');
            return;
        }

        const total = formData.items.reduce((acc, i) => acc + i.subtotal, 0);
        try {
            const resp = await api.post('/compras', { ...formData, total });
            if (resp.data.ok || resp.data.success) {
                alert('Compra registrada');
                setIsCreateModalOpen(false);
                setFormData({ proveedor_id: '', sucursal_id: '', fecha: new Date().toISOString().split('T')[0], items: [] });
                loadData();
            }
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const handleAction = async (type, compra) => {
        if (type === 'view') {
            setSelectedCompra(compra);
            setIsViewModalOpen(true);
        }
    };

    const updateStatus = async (id, field, value) => {
        try {
            const resp = await api.put(`/compras/${id}`, { [field]: value });
            if (resp.data.ok || resp.data.success) {
                const updated = { ...selectedCompra, [field]: value };
                setSelectedCompra(updated);
                loadData();
            }
        } catch (err) {
            console.error('Update status error:', err);
        }
    };

    const getBadgeStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (['completada', 'recibida', 'pago'].some(x => s.includes(x))) return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' };
        if (['aprobada', 'realizada'].some(x => s.includes(x))) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' };
        if (['rechazada', 'cancelada'].some(x => s.includes(x))) return { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626' };
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#4B5563' };
    };

    const columns = [
        { label: 'ID', key: 'id', render: (val) => <strong>#{val}</strong> },
        { label: 'Proveedor', key: 'proveedor_nombre' },
        { label: 'Fecha', key: 'fecha', render: (val) => new Date(val).toLocaleDateString() },
        { label: 'Total', key: 'total', render: (val) => <strong>${parseFloat(val).toLocaleString()}</strong> },
        {
            label: 'Estado',
            key: 'estado',
            render: (val) => {
                const st = getBadgeStyle(val);
                return <span className="badge" style={{ background: st.bg, color: st.color }}>{val || 'Orden'}</span>
            }
        },
        {
            label: 'Pago',
            key: 'estado_pago',
            render: (val) => {
                const st = getBadgeStyle(val);
                return <span className="badge" style={{ background: st.bg, color: st.color }}>{val || 'Debe'}</span>
            }
        }
    ];

    const totalCompra = formData.items.reduce((acc, i) => acc + i.subtotal, 0);

    return (
        <div className="compras-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>Órdenes de Compra</h1>
                    <p style={{ color: 'var(--text-gray)' }}>Gestiona el abastecimiento y relación con proveedores.</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} /> Nueva Orden
                </button>
            </div>

            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}><DollarSign size={24} /></div>
                    <div className="kpi-content">
                        <h3>${stats.porPagar.toLocaleString()}</h3>
                        <p>Total por Pagar</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#D97706' }}><Truck size={24} /></div>
                    <div className="kpi-content">
                        <h3>{stats.pendientes}</h3>
                        <p>Órdenes Pendientes</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><CheckCircle size={24} /></div>
                    <div className="kpi-content">
                        <h3>{stats.completadas}</h3>
                        <p>Recepciones Exitosas</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Cargando órdenes...</div>
            ) : (
                <GenericTable
                    columns={columns}
                    data={filteredCompras}
                    actions={['view']}
                    onAction={handleAction}
                />
            )}

            {/* MODAL NUEVA COMPRA */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Nueva Orden de Compra"
                footer={(
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div>
                            <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Total de la Orden</span><br />
                            <strong style={{ fontSize: '1.4rem', color: 'var(--primary-color)' }}>${totalCompra.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSaveCompra}>Guardar Orden</button>
                        </div>
                    </div>
                )}
            >
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div className="form-group">
                        <label>Proveedor</label>
                        <select className="form-control" value={formData.proveedor_id} onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}>
                            <option value="">Seleccione...</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_comercial}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Sucursal Destino</label>
                        <select className="form-control" value={formData.sucursal_id} onChange={(e) => setFormData({ ...formData, sucursal_id: e.target.value })}>
                            <option value="">Seleccione...</option>
                            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Fecha de Compra</label>
                        <input type="date" className="form-control" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Referencia / Factura</label>
                        <input type="text" className="form-control" placeholder="Opcional" value={formData.referencia} onChange={(e) => setFormData({ ...formData, referencia: e.target.value })} />
                    </div>
                </div>

                <div className="search-section" style={{ position: 'relative', marginBottom: '20px' }}>
                    <div className="search-box" style={{ background: '#f9fafb', border: '1px dashed #d1d5db', padding: '10px', borderRadius: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={16} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Escribe el nombre del producto para agregar..."
                                style={{ paddingLeft: '35px', marginBottom: 0 }}
                                value={searchProd}
                                onChange={(e) => handleSearchProduct(e.target.value)}
                            />
                        </div>
                        {searchResult.length > 0 && (
                            <div className="search-results-floating" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                {searchResult.map(p => (
                                    <div key={p.id} style={{ padding: '10px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => addItem(p)}>
                                        <span>{p.nombre}</span>
                                        <strong>${parseFloat(p.costo).toLocaleString()}</strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="items-table" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="glass-table" style={{ fontSize: '0.9rem' }}>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Costo</th>
                                <th>Subtotal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.nombre}</td>
                                    <td><input type="number" className="form-control" style={{ width: '70px', padding: '5px', marginBottom: 0 }} value={item.cantidad} onChange={(e) => updateItem(idx, 'cantidad', e.target.value)} /></td>
                                    <td><input type="number" className="form-control" style={{ width: '100px', padding: '5px', marginBottom: 0 }} value={item.costo} onChange={(e) => updateItem(idx, 'costo', e.target.value)} /></td>
                                    <td>${item.subtotal.toLocaleString()}</td>
                                    <td><button className="btn-icon" style={{ color: '#EF4444' }} onClick={() => removeItem(idx)}><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                            {formData.items.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF' }}>No hay productos en la orden</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>

            {/* MODAL VER DETALLE */}
            {selectedCompra && (
                <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title={`Detalle de Orden #${selectedCompra.id}`}
                    footer={(
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
                            <button className="btn-secondary" onClick={() => setIsViewModalOpen(false)}>Cerrar</button>
                        </div>
                    )}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', background: '#f9fafb', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                        <div>
                            <small style={{ color: '#6B7280' }}>Proveedor</small><br />
                            <strong>{selectedCompra.proveedor_nombre}</strong>
                        </div>
                        <div>
                            <small style={{ color: '#6B7280' }}>Fecha</small><br />
                            <strong>{new Date(selectedCompra.fecha).toLocaleDateString()}</strong>
                        </div>
                        <div>
                            <small style={{ color: '#6B7280' }}>Total</small><br />
                            <strong style={{ color: 'var(--primary-color)' }}>${parseFloat(selectedCompra.total).toLocaleString()}</strong>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <div style={{ flex: 1, padding: '15px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                            <small style={{ color: '#6B7280' }}>Estado de la Orden</small>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                <span className="badge" style={getBadgeStyle(selectedCompra.estado)}>{selectedCompra.estado || 'Orden'}</span>
                                {selectedCompra.estado === 'Orden de Compra' && (
                                    <>
                                        <button className="btn-icon-small" onClick={() => updateStatus(selectedCompra.id, 'estado', 'Aprobada')} style={{ color: '#10B981' }}><CheckCircle size={14} /></button>
                                        <button className="btn-icon-small" onClick={() => updateStatus(selectedCompra.id, 'estado', 'Cancelada')} style={{ color: '#EF4444' }}><XCircle size={14} /></button>
                                    </>
                                )}
                                {selectedCompra.estado === 'Aprobada' && (
                                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => updateStatus(selectedCompra.id, 'estado', 'Realizada')}>Registrar Factura</button>
                                )}
                                {selectedCompra.estado === 'Realizada' && (
                                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => updateStatus(selectedCompra.id, 'estado', 'Recibida')}>Recibir Mercancía</button>
                                )}
                                {selectedCompra.estado === 'Recibida' && (
                                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => updateStatus(selectedCompra.id, 'estado', 'Completada')}>Ingresar al Inventario</button>
                                )}
                            </div>
                        </div>
                        <div style={{ flex: 1, padding: '15px', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
                            <small style={{ color: '#6B7280' }}>Estado de Pago</small>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                <span className="badge" style={getBadgeStyle(selectedCompra.estado_pago)}>{selectedCompra.estado_pago || 'Debe'}</span>
                                {selectedCompra.estado_pago !== 'Pago' && (
                                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={() => updateStatus(selectedCompra.id, 'estado_pago', 'Pago')}>Registrar Pago</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TODO: Add Items Display for Selected Compra if API supports /detalles */}
                    <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>Los ítems de la orden se visualizan en la orden física.</p>
                </Modal>
            )}
        </div>
    );
};

export default Compras;
