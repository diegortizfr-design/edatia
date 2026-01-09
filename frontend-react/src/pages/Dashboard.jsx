import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    TrendingUp, Users, Package, ShoppingCart,
    ArrowUpRight, ArrowDownRight, Activity,
    Calendar, CheckCircle, Clock, Plus
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        ventasHoy: 0,
        clientesNuevos: 0,
        productosBajoStock: 0,
        ordenesPendientes: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [prodResp, compResp, tercResp] = await Promise.all([
                api.get('/productos'),
                api.get('/compras'),
                api.get('/terceros?tipo=cliente')
            ]);

            const products = prodResp.data.data || [];
            const compras = compResp.data.data || [];
            const clientes = tercResp.data.data || [];

            setStats({
                ventasHoy: 1250000, // Simulated as there's no /stats endpoint yet
                clientesNuevos: clientes.length,
                productosBajoStock: products.filter(p => p.stock_actual <= p.stock_minimo).length,
                ordenesPendientes: compras.filter(c => c.estado === 'Orden de Compra').length
            });
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const kpis = [
        { label: 'Ventas de Hoy', value: `$${stats.ventasHoy.toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#10B981', trend: '+12.5%', isUp: true },
        { label: 'Clientes Registrados', value: stats.clientesNuevos, icon: <Users size={24} />, color: 'var(--primary-color)', trend: '+4', isUp: true },
        { label: 'Stock Crítico', value: stats.productosBajoStock, icon: <Package size={24} />, color: '#EF4444', trend: '-2', isUp: false },
        { label: 'Compras Pendientes', value: stats.ordenesPendientes, icon: <ShoppingCart size={24} />, color: '#F59E0B', trend: 'Estable', isUp: true }
    ];

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando tablero...</div>;

    return (
        <div className="dashboard-page">
            <div className="page-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>Panel de Control</h1>
                    <p style={{ color: 'var(--text-gray)' }}>Resumen operativo de tu negocio en tiempo real.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', background: 'white', padding: '8px 15px', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.9rem', alignItems: 'center' }}>
                    <Calendar size={16} /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="card kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="kpi-icon" style={{ background: `${kpi.color}15`, color: kpi.color, padding: '15px', borderRadius: '15px' }}>
                            {kpi.icon}
                        </div>
                        <div className="kpi-info" style={{ flex: 1 }}>
                            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>{kpi.label}</p>
                            <h3 style={{ margin: '5px 0', fontSize: '1.5rem', fontWeight: 700 }}>{kpi.value}</h3>
                            <span style={{ fontSize: '0.8rem', color: kpi.isUp ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {kpi.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {kpi.trend} vs ayer
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
                <div className="card" style={{ minHeight: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} color="var(--primary-color)" /> Actividad Reciente</h3>
                        <button className="btn-icon-small" title="Filtrar"><Clock size={16} /></button>
                    </div>
                    <div className="activity-list">
                        <div style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #F3F4F6' }}>
                            <div style={{ background: '#ECFDF5', color: '#059669', padding: '10px', borderRadius: '10px', height: 'fit-content' }}><CheckCircle size={18} /></div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 600 }}>Venta POS #FE-42 realizada</p>
                                <small style={{ color: '#9CA3AF' }}>Hace 15 minutos | Cliente Mostrador</small>
                            </div>
                            <strong style={{ marginLeft: 'auto' }}>$45.000</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #F3F4F6' }}>
                            <div style={{ background: '#EEF2FF', color: 'var(--primary-color)', padding: '10px', borderRadius: '10px', height: 'fit-content' }}><Package size={18} /></div>
                            <div>
                                <p style={{ margin: 0, fontWeight: 600 }}>Nueva Orden de Compra #105</p>
                                <small style={{ color: '#9CA3AF' }}>Hace 2 horas | Proveedor Alquería</small>
                            </div>
                            <strong style={{ marginLeft: 'auto' }}>Pendiente</strong>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Accesos Rápidos</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', padding: '20px', alignItems: 'center', gap: '10px', borderStyle: 'dashed' }}>
                            <ShoppingCart size={24} /> <span>Vender</span>
                        </button>
                        <button className="btn-secondary" style={{ display: 'flex', flexDirection: 'column', padding: '20px', alignItems: 'center', gap: '10px', borderStyle: 'dashed' }}>
                            <Plus size={24} /> <span>Producto</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
