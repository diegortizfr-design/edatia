import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import { Package, AlertTriangle, DollarSign, Box, Search, LayoutGrid } from 'lucide-react';

const Inventario = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalItems: 0, criticalStock: 0, totalValue: 0 });

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const resp = await api.get('/productos');
            if (resp.data.ok || resp.data.success) {
                const all = resp.data.data;
                const activeOnes = all.filter(p => p.activo && p.maneja_inventario);
                setProducts(activeOnes);
                setFilteredProducts(activeOnes);
                calculateStats(activeOnes);
            }
        } catch (err) {
            console.error('Error loading inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalItems = data.length;
        const criticalStock = data.filter(p => p.stock_actual <= p.stock_minimo).length;
        const totalValue = data.reduce((acc, p) => acc + (p.stock_actual * p.costo), 0);
        setStats({ totalItems, criticalStock, totalValue });
    };

    const handleSearch = (term, cat = categoryFilter) => {
        setSearchTerm(term);
        const lowTerm = term.toLowerCase();
        let filtered = products.filter(p =>
            p.nombre.toLowerCase().includes(lowTerm) ||
            p.codigo?.toLowerCase().includes(lowTerm) ||
            p.referencia_fabrica?.toLowerCase().includes(lowTerm)
        );
        if (cat !== 'all') {
            filtered = filtered.filter(p => p.categoria === cat);
        }
        setFilteredProducts(filtered);
    };

    const handleCategoryFilter = (cat) => {
        setCategoryFilter(cat);
        handleSearch(searchTerm, cat);
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
                        <small style={{ color: '#6B7280' }}>{row.codigo || '-'}</small>
                    </div>
                </div>
            )
        },
        { label: 'Categoría', key: 'categoria' },
        {
            label: 'Stock Actual',
            key: 'stock_actual',
            render: (val, row) => (
                <span style={{
                    color: val <= row.stock_minimo ? '#EF4444' : '#10B981',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                    {val} {val <= row.stock_minimo && <AlertTriangle size={14} />}
                </span>
            )
        },
        { label: 'Mínimo', key: 'stock_minimo' },
        {
            label: 'Costo Unit.',
            key: 'costo',
            render: (val) => `$${parseFloat(val).toLocaleString()}`
        },
        {
            label: 'Valor Inventario',
            key: 'id', // Dummy key for calculated column
            render: (_, row) => <strong>${(row.stock_actual * row.costo).toLocaleString()}</strong>
        }
    ];

    const categories = [...new Set(products.map(p => p.categoria).filter(c => c))];

    return (
        <div className="inventory-page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>Inventario de Mercancías</h1>
                    <p style={{ color: 'var(--text-gray)' }}>Vista detallada del stock, valores y alertas de reposición.</p>
                </div>
            </div>

            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}><Box size={24} /></div>
                    <div className="kpi-content">
                        <h3>{stats.totalItems}</h3>
                        <p>Total Referencias</p>
                    </div>
                </div>
                <div className="card kpi-card" style={{ borderColor: stats.criticalStock > 0 ? '#FECACA' : 'transparent' }}>
                    <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}><AlertTriangle size={24} /></div>
                    <div className="kpi-content">
                        <h3>{stats.criticalStock}</h3>
                        <p>Bajo Stock</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><DollarSign size={24} /></div>
                    <div className="kpi-content">
                        <h3>${stats.totalValue.toLocaleString()}</h3>
                        <p>Valorización Total</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={18} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por nombre o SKU..."
                            style={{ paddingLeft: '45px', marginBottom: 0 }}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-control"
                        style={{ width: '250px', marginBottom: 0 }}
                        value={categoryFilter}
                        onChange={(e) => handleCategoryFilter(e.target.value)}
                    >
                        <option value="all">Todas las Categorías</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Cargando inventario...</div>
            ) : (
                <GenericTable
                    columns={columns}
                    data={filteredProducts}
                />
            )}
        </div>
    );
};

export default Inventario;
