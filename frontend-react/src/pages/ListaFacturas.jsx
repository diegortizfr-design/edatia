import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GenericTable from '../components/GenericTable';
import { FileText, Search, Calendar, DollarSign, ShoppingBag, Eye, Printer, TrendingUp } from 'lucide-react';

const ListaFacturas = () => {
    const [facturas, setFacturas] = useState([]);
    const [filteredFacturas, setFilteredFacturas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ ventasHoy: 0, totalRecaudado: 0, totalFacturas: 0 });

    useEffect(() => {
        loadFacturas();
    }, []);

    const loadFacturas = async () => {
        try {
            setLoading(true);
            const resp = await api.get('/facturacion');
            if (resp.data.ok || resp.data.success) {
                const all = resp.data.data || [];
                setFacturas(all);
                setFilteredFacturas(all);
                calculateStats(all);
            }
        } catch (err) {
            console.error('Error loading facturas:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const today = data.filter(f => f.fecha && f.fecha.startsWith(todayStr));
        const totalRecaudado = today.reduce((acc, f) => acc + parseFloat(f.total || 0), 0);

        setStats({
            ventasHoy: today.length,
            totalRecaudado,
            totalFacturas: data.length
        });
    };

    const handleFilter = (term = searchTerm, date = dateFilter) => {
        setSearchTerm(term);
        setDateFilter(date);

        const lowTerm = term.toLowerCase();
        let filtered = facturas.filter(f =>
            (f.numero_factura && f.numero_factura.toLowerCase().includes(lowTerm)) ||
            (f.cliente_nombre && f.cliente_nombre.toLowerCase().includes(lowTerm))
        );

        if (date) {
            filtered = filtered.filter(f => f.fecha && f.fecha.startsWith(date));
        }

        setFilteredFacturas(filtered);
    };

    const columns = [
        {
            label: 'Número',
            key: 'numero_factura',
            render: (val) => <strong>{val}</strong>
        },
        {
            label: 'Fecha',
            key: 'fecha',
            render: (val) => new Date(val).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
        },
        {
            label: 'Cliente',
            key: 'cliente_nombre',
            render: (val) => val || 'Cliente Mostrador'
        },
        {
            label: 'Método de Pago',
            key: 'metodo_pago'
        },
        {
            label: 'Total',
            key: 'total',
            render: (val) => <strong>${parseFloat(val).toLocaleString()}</strong>
        },
        {
            label: 'Estado',
            key: 'estado',
            render: (val) => <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>{val || 'Completada'}</span>
        }
    ];

    return (
        <div className="lista-facturas-page">
            <div className="page-header" style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>
                    <FileText size={32} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                    Historial de Facturas
                </h1>
                <p style={{ color: 'var(--text-gray)' }}>Consulta y gestiona todas las ventas realizadas.</p>
            </div>

            {/* KPIs */}
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)' }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div className="kpi-content">
                        <h3>{stats.ventasHoy}</h3>
                        <p>Ventas Hoy</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="kpi-content">
                        <h3>${stats.totalRecaudado.toLocaleString()}</h3>
                        <p>Total Recaudado Hoy</p>
                    </div>
                </div>
                <div className="card kpi-card">
                    <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <h3>{stats.totalFacturas}</h3>
                        <p>Total Facturas</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={18} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por número o cliente..."
                            style={{ paddingLeft: '45px', marginBottom: 0 }}
                            value={searchTerm}
                            onChange={(e) => handleFilter(e.target.value, dateFilter)}
                        />
                    </div>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <Calendar style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={18} />
                        <input
                            type="date"
                            className="form-control"
                            style={{ paddingLeft: '45px', marginBottom: 0 }}
                            value={dateFilter}
                            onChange={(e) => handleFilter(searchTerm, e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>Cargando facturas...</div>
            ) : (
                <GenericTable
                    columns={columns}
                    data={filteredFacturas}
                    actions={['view']}
                    onAction={(type, item) => {
                        if (type === 'view') {
                            alert(`Ver detalle de factura ${item.numero_factura}`);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ListaFacturas;
