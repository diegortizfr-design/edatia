import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    BarChart3, TrendingUp, DollarSign, Users, Star,
    Download, FileText, Package, Calendar
} from 'lucide-react';

const Reportes = () => {
    const [stats, setStats] = useState({
        ventasMes: 0,
        utilidadNeta: 0,
        nuevosClientes: 0
    });
    const [topProducts, setTopProducts] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = async () => {
        try {
            // Simulated data - in production, these would be real API calls
            setStats({
                ventasMes: 45200000,
                utilidadNeta: 12500000,
                nuevosClientes: 145
            });

            setTopProducts([
                { nombre: 'Camiseta Polo Azul', cantidad: 120, total: 4200000 },
                { nombre: 'Zapatos Deportivos', cantidad: 85, total: 12500000 },
                { nombre: 'Gorra Trucker', cantidad: 210, total: 6100000 }
            ]);

            setMonthlySales([
                { mes: 'Ene', valor: 40 },
                { mes: 'Feb', valor: 60 },
                { mes: 'Mar', valor: 35 },
                { mes: 'Abr', valor: 75 },
                { mes: 'May', valor: 50 },
                { mes: 'Jun', valor: 90 }
            ]);
        } catch (err) {
            console.error('Error loading reports:', err);
        }
    };

    const reports = [
        { icon: <FileText size={24} />, title: 'Informe Fiscal', subtitle: 'Detallado por IVA' },
        { icon: <Users size={24} />, title: 'Rendimiento Vendedores', subtitle: 'Comisiones' },
        { icon: <Package size={24} />, title: 'Inventario', subtitle: 'Valorización stock' }
    ];

    return (
        <div className="reportes-page">
            <div className="page-header" style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-color)', marginBottom: '5px' }}>
                    <BarChart3 size={32} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                    Reportes e Inteligencia
                </h1>
                <p style={{ color: 'var(--text-gray)' }}>Análisis de ventas, inventario y rendimiento del negocio.</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>${(stats.ventasMes / 1000000).toFixed(1)}M</h2>
                        <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Ventas este mes (+12%)</span>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>${(stats.utilidadNeta / 1000000).toFixed(1)}M</h2>
                        <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Utilidad Neta</span>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#EEF2FF', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                        <Users size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>{stats.nuevosClientes}</h2>
                        <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Nuevos Clientes</span>
                    </div>
                </div>
            </div>

            {/* Analytics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* Monthly Sales Chart */}
                <div className="card" style={{ minHeight: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                            <BarChart3 size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-color)' }} />
                            Ventas Mensuales
                        </h3>
                        <button className="btn-secondary" style={{ padding: '8px 15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} /> 2025
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', borderBottom: '1px solid #e5e7eb', marginBottom: '10px' }}>
                        {monthlySales.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'flex-end' }}>
                                <div style={{
                                    width: '40%',
                                    height: `${item.valor}%`,
                                    background: item.valor > 70 ? 'linear-gradient(to top, #10B981, #34D399)' : item.valor < 40 ? 'linear-gradient(to top, #F87171, #FCA5A5)' : 'linear-gradient(to top, var(--primary-color), #818CF8)',
                                    borderRadius: '6px 6px 0 0',
                                    transition: 'height 0.5s ease'
                                }}></div>
                                <span style={{ marginTop: '12px', fontSize: '0.75rem', color: '#6B7280' }}>{item.mes}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                            <Star size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#F59E0B' }} />
                            Más Vendidos
                        </h3>
                        <button className="btn-icon"><Download size={16} /></button>
                    </div>
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th style={{ textAlign: 'right' }}>Cant.</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{p.nombre}</td>
                                    <td style={{ textAlign: 'right' }}>{p.cantidad}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${(p.total / 1000000).toFixed(1)}M</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Reports */}
            <div className="card">
                <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                        <Download size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-color)' }} />
                        Reportes Detallados
                    </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                    {reports.map((report, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '18px',
                            borderBottom: '1px solid #f3f4f6',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            transition: '0.2s'
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'translateX(5px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    background: '#EFF6FF',
                                    color: 'var(--primary-color)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '15px'
                                }}>
                                    {report.icon}
                                </div>
                                <div>
                                    <strong>{report.title}</strong><br />
                                    <small style={{ color: '#6B7280' }}>{report.subtitle}</small>
                                </div>
                            </div>
                            <button className="btn-icon"><Download size={16} /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reportes;
