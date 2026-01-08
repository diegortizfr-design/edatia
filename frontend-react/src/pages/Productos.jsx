import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import Modal from '../components/Modal';
import { Package, Plus, Search, Upload, CheckCircle, XCircle, AlertTriangle, Layers, DollarSign } from 'lucide-react';

const Productos = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState({ total: 0, categories: 0, lowStock: 0 });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        nombre_alterno: '',
        referencia_fabrica: '',
        codigo: '',
        categoria: 'General',
        unidad_medida: 'UND',
        precio1: 0,
        precio2: 0,
        precio3: 0,
        costo: 0,
        impuesto_porcentaje: 0,
        proveedor_id: '',
        stock_minimo: 0,
        imagen_url: '',
        activo: true,
        maneja_inventario: true,
        mostrar_en_tienda: false
    });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prodResp, suppResp] = await Promise.all([
                api.get('/productos'),
                api.get('/terceros')
            ]);

            if (prodResp.data.ok || prodResp.data.success) {
                const all = prodResp.data.data;
                setProducts(all);
                setFilteredProducts(all);
                calculateKPIs(all);
            }

            if (suppResp.data.ok || suppResp.data.success) {
                setSuppliers(suppResp.data.data.filter(t => t.es_proveedor));
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateKPIs = (data) => {
        setKpi({
            total: data.filter(p => p.activo).length,
            categories: new Set(data.map(p => p.categoria)).size,
            lowStock: data.filter(p => p.maneja_inventario && p.stock_actual <= p.stock_minimo).length
        });
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        const lowTerm = term.toLowerCase();
        const filtered = products.filter(p =>
            p.nombre.toLowerCase().includes(lowTerm) ||
            (p.codigo && p.codigo.toLowerCase().includes(lowTerm)) ||
            (p.referencia_fabrica && p.referencia_fabrica.toLowerCase().includes(lowTerm))
        );
        setFilteredProducts(filtered);
    };

    const handleAction = (type, product) => {
        if (type === 'edit') {
            setIsEditing(true);
            setFormData({ ...product });
            setIsModalOpen(true);
        } else if (type === 'delete') {
            handleDelete(product.id);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este producto?')) return;
        try {
            await api.delete(`/productos/${id}`);
            loadData();
        } catch (err) {
            console.error('Error deleting product:', err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/productos/${formData.id}`, formData);
            } else {
                await api.post('/productos', formData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const fd = new FormData();
        fd.append('image', file);
        try {
            const resp = await api.post('/upload', fd);
            if (resp.data.success) {
                setFormData({ ...formData, imagen_url: resp.data.url });
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({
            nombre: '',
            nombre_alterno: '',
            referencia_fabrica: '',
            codigo: '',
            categoria: 'General',
            unidad_medida: 'UND',
            precio1: 0,
            precio2: 0,
            precio3: 0,
            costo: 0,
            impuesto_porcentaje: 0,
            proveedor_id: '',
            stock_minimo: 0,
            imagen_url: '',
            activo: true,
            maneja_inventario: true,
            mostrar_en_tienda: false
        });
        setIsModalOpen(true);
    };

    const columns = [
        {
            label: 'Producto',
            key: 'nombre',
            render: (val, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#eee', backgroundImage: `url(${row.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    <div>
                        <strong>{val}</strong><br />
                        <small style={{ color: '#6B7280' }}>{row.nombre_alterno || ''}</small>
                    </div>
                </div>
            )
        },
        { label: 'Referencia', key: 'referencia_fabrica' },
        {
            label: 'Categoría',
            key: 'categoria',
            render: (val) => <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}>{val}</span>
        },
        {
            label: 'Precio',
            key: 'precio1',
            render: (val) => <strong>${parseFloat(val).toLocaleString()}</strong>
        },
        {
            label: 'Stock',
            key: 'stock_actual',
            render: (val, row) => <span style={{ color: val <= row.stock_minimo ? '#EF4444' : 'inherit', fontWeight: 'bold' }}>{val}</span>
        },
        {
            label: 'Estado',
            key: 'activo',
            render: (val) => val ? (
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}><CheckCircle size={14} /> Activo</span>
            ) : (
                <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}><XCircle size={14} /> Inactivo</span>
            )
        }
    ];

    return (
        <div className="products-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>Configuración de Productos</h1>
                    <p style={{ color: 'var(--text-gray)' }}>Gestiona tu inventario, precios y detalles de productos.</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openCreateModal}>
                    <Plus size={18} /> Nuevo Producto
                </button>
            </div>

            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}><Package size={24} /></div>
                    <div className="kpi-content">
                        <h3>{kpi.total}</h3>
                        <p>Total Activos</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Layers size={24} /></div>
                    <div className="kpi-content">
                        <h3>{kpi.categories}</h3>
                        <p>Categorías</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}><AlertTriangle size={24} /></div>
                    <div className="kpi-content">
                        <h3>{kpi.lowStock}</h3>
                        <p>Bajo Stock</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={18} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nombre, código o referencia..."
                        style={{ paddingLeft: '45px', marginBottom: 0 }}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Cargando productos...</div>
            ) : (
                <GenericTable
                    columns={columns}
                    data={filteredProducts}
                    actions={['edit', 'delete']}
                    onAction={handleAction}
                />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                footer={(
                    <>
                        <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSave}>Guardar Producto</button>
                    </>
                )}
            >
                <form onSubmit={handleSave} className="product-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Nombre del Producto</label>
                        <input type="text" className="form-control" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Referencia Fábrica</label>
                        <input type="text" className="form-control" value={formData.referencia_fabrica} onChange={(e) => setFormData({ ...formData, referencia_fabrica: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Código Interno</label>
                        <input type="text" className="form-control" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Categoría</label>
                        <input type="text" className="form-control" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Costo</label>
                        <input type="number" className="form-control" value={formData.costo} onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Precio Venta (P1)</label>
                        <input type="number" className="form-control" value={formData.precio1} onChange={(e) => setFormData({ ...formData, precio1: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>IVA %</label>
                        <input type="number" className="form-control" value={formData.impuesto_porcentaje} onChange={(e) => setFormData({ ...formData, impuesto_porcentaje: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Stock Mínimo</label>
                        <input type="number" className="form-control" value={formData.stock_minimo} onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label>Imagen</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" className="form-control" value={formData.imagen_url} onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })} style={{ flex: 1 }} />
                            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {isUploading ? '...' : <Upload size={18} />}
                                <input type="file" hidden onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        </div>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} /> Activo
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.maneja_inventario} onChange={(e) => setFormData({ ...formData, maneja_inventario: e.target.checked })} /> Maneja Inventario
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.mostrar_en_tienda} onChange={(e) => setFormData({ ...formData, mostrar_en_tienda: e.target.checked })} /> Ver en Tienda
                        </label>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Productos;
