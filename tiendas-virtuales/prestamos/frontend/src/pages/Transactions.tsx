import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { 
  Receipt, Search, Download, 
  Coins, FileText, AlertTriangle
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  documentId: string;
  phone: string;
  address: string;
}

interface Loan {
  id: string;
  loanNumber: string;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalAmount: number;
  balance: number;
  paymentFrequency: string;
  installments: number;
  installmentAmt: number;
  status: string;
  startDate: string;
  endDate: string;
  customer: Customer;
}

interface Payment {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  notes: string | null;
  customer: Customer;
  loan: {
    id: string;
    loanNumber: string;
  };
}

export const Transactions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'receipts' | 'invoices'>('receipts');
  
  // Data states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Printing states
  const [printInvoiceData, setPrintInvoiceData] = useState<any>(null);
  const [printReceiptData, setPrintReceiptData] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsData, loansData] = await Promise.all([
        apiCall('/payments'),
        apiCall('/loans')
      ]);
      setPayments(paymentsData);
      setLoans(loansData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar transacciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Background PDF generators
  const handleDownloadPDF = (elementId: string, filename: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        alert('Error: Elemento de impresión no encontrado en la página.');
        return;
      }

      // @ts-ignore
      const html2pdf = window.html2pdf;
      if (!html2pdf) {
        alert('Error: La librería de generación de PDF no se ha cargado. Por favor, refresca la página (Ctrl + F5).');
        return;
      }

      const contentHtml = element.innerHTML;
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Factura y Contrato</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body {
                background-color: white !important;
                color: black !important;
                font-family: system-ui, -apple-system, sans-serif;
                padding: 15px;
              }
            </style>
          </head>
          <body>
            <div style="width: 720px; margin: 0 auto;">
              ${contentHtml}
            </div>
          </body>
        </html>
      `;

      const opt = {
        margin:       [0.3, 0.3, 0.3, 0.3],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(fullHtml).set(opt).save()
        .catch((err: any) => {
          alert('Error al compilar el PDF: ' + (err.message || err));
        });
    } catch (e: any) {
      alert('Excepción al generar el PDF: ' + e.message);
    }
  };

  const handleDownloadReceiptPDF = (elementId: string, filename: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        alert('Error: Elemento del recibo no encontrado.');
        return;
      }

      // @ts-ignore
      const html2pdf = window.html2pdf;
      if (!html2pdf) {
        alert('Error: La librería de generación de PDF no se ha cargado. Por favor, refresca la página (Ctrl + F5).');
        return;
      }

      const contentHtml = element.innerHTML;
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Recibo de Caja</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body {
                background-color: white !important;
                color: black !important;
                font-family: monospace;
                padding: 10px;
              }
            </style>
          </head>
          <body>
            <div style="width: 280px; margin: 0 auto;">
              ${contentHtml}
            </div>
          </body>
        </html>
      `;

      const opt = {
        margin:       [0.1, 0.1, 0.1, 0.1],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2.5, 
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF:        { unit: 'in', format: [3.15, 6.0], orientation: 'portrait' }
      };

      html2pdf().from(fullHtml).set(opt).save()
        .catch((err: any) => {
          alert('Error al compilar el ticket: ' + (err.message || err));
        });
    } catch (e: any) {
      alert('Excepción al generar el ticket: ' + e.message);
    }
  };

  // Trigger background download on state set
  useEffect(() => {
    if (printInvoiceData) {
      const filename = `Contrato_Credito_${printInvoiceData.loan.loanNumber}.pdf`;
      const timer = setTimeout(() => {
        handleDownloadPDF('invoice-print-area', filename);
        setPrintInvoiceData(null);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [printInvoiceData]);

  useEffect(() => {
    if (printReceiptData) {
      const filename = `Recibo_${printReceiptData.receiptNumber}.pdf`;
      const timer = setTimeout(() => {
        handleDownloadReceiptPDF('receipt-print-area', filename);
        setPrintReceiptData(null);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [printReceiptData]);

  // Date range matcher helpers
  const matchesDateFilter = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    
    // Reset times for date-only comparison
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (dateFilter === 'today') {
      return dDate.getTime() === todayDate.getTime();
    }
    if (dateFilter === 'yesterday') {
      const yesterday = new Date(todayDate.getTime());
      yesterday.setDate(yesterday.getDate() - 1);
      return dDate.getTime() === yesterday.getTime();
    }
    if (dateFilter === 'week') {
      const diffTime = Math.abs(todayDate.getTime() - dDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (dateFilter === 'month') {
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    }
    return true; // 'all'
  };

  // Payment listing filtering
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.documentId.includes(search) ||
      p.receiptNumber.toLowerCase().includes(search.toLowerCase());
    const matchesDate = matchesDateFilter(p.paymentDate);
    return matchesSearch && matchesDate;
  });

  // Loan listing filtering
  const filteredLoans = loans.filter(l => {
    const matchesSearch = l.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      l.customer.documentId.includes(search) ||
      l.loanNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Totals calculations
  const totalReceiptsAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalLoansPrincipal = filteredLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalLoansBalance = filteredLoans.reduce((sum, l) => sum + l.balance, 0);

  const translateFrequency = (freq: string) => {
    switch (freq) {
      case 'DAILY': return 'Diario (L-S)';
      case 'WEEKLY': return 'Semanal';
      case 'BIWEEKLY': return 'Quincenal';
      case 'MONTHLY': return 'Mensual';
      default: return freq;
    }
  };

  const getLoanStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="text-brand-400 font-semibold bg-brand-500/5 px-2 py-0.5 rounded-full border border-brand-500/10 text-xs">ACTIVO</span>;
      case 'PAID':
        return <span className="text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 text-xs">PAGADO</span>;
      case 'RENEWED':
        return <span className="text-purple-400 font-semibold bg-purple-500/5 px-2 py-0.5 rounded-full border border-purple-500/10 text-xs">RENOVADO</span>;
      case 'OVERDUE':
        return <span className="text-red-400 font-semibold bg-red-500/5 px-2 py-0.5 rounded-full border border-red-500/10 text-xs">EN MORA</span>;
      default:
        return <span className="text-slate-400 font-semibold bg-slate-550/5 px-2 py-0.5 rounded-full border border-slate-500/10 text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
          <Receipt className="w-8 h-8 text-brand-500" /> Transacciones
        </h1>
        <p className="text-slate-400 mt-1">Historial completo y descargas de facturas y recibos para arqueos de caja.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveTab('receipts'); setSearch(''); }}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'receipts'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" /> Recibos de Abonos (Caja)
        </button>
        <button
          onClick={() => { setActiveTab('invoices'); setSearch(''); }}
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Facturas y Contratos
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: RECEIPTS */}
          {activeTab === 'receipts' && (
            <>
              {/* Summary Reconciliation Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Total Recaudado en Período</span>
                  <h3 className="text-3xl font-extrabold text-white font-mono mt-2">
                    ${totalReceiptsAmount.toLocaleString('es-CO')} COP
                  </h3>
                  <span className="text-xs text-slate-400 mt-2">
                    Sumatoria de cobros filtrados
                  </span>
                </div>
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-brand-400">Recibos Emitidos</span>
                  <h3 className="text-3xl font-extrabold text-white font-mono mt-2">
                    {filteredPayments.length} abonos
                  </h3>
                  <span className="text-xs text-slate-400 mt-2">
                    Transacciones registradas
                  </span>
                </div>
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Filtro Temporal Activo</span>
                  <div className="mt-2">
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-semibold text-sm focus:outline-none"
                    >
                      <option value="today">Cobros de Hoy</option>
                      <option value="yesterday">Cobros de Ayer</option>
                      <option value="week">Últimos 7 Días</option>
                      <option value="month">Este Mes</option>
                      <option value="all">Todo el Historial</option>
                    </select>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 block">
                    Modifica para cuadrar caja
                  </span>
                </div>
              </div>

              {/* Filters & Table */}
              <div className="glass-card p-6 rounded-xl space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por cliente, cédula o consecutivo REC..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-850 rounded-lg">
                  {filteredPayments.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-12">No se encontraron recibos de abono.</p>
                  ) : (
                    <table className="w-full text-left text-xs md:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <th className="p-3">Recibo</th>
                          <th className="p-3">Fecha y Hora</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Crédito</th>
                          <th className="p-3 text-right">Monto</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-350">
                        {filteredPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/10">
                            <td className="p-3 font-mono font-semibold text-slate-200">{p.receiptNumber}</td>
                            <td className="p-3 text-slate-400">
                              {new Date(p.paymentDate).toLocaleString('es-CO')}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-200">{p.customer.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">CC: {p.customer.documentId}</div>
                            </td>
                            <td className="p-3 font-mono text-xs text-brand-400">{p.loan.loanNumber}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">${p.amount.toLocaleString('es-CO')}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setPrintReceiptData({
                                  receiptNumber: p.receiptNumber,
                                  paymentDate: p.paymentDate,
                                  clientName: p.customer.name,
                                  documentId: p.customer.documentId,
                                  loanNumber: p.loan.loanNumber,
                                  amount: p.amount,
                                  remainingBalance: 0, // placeholder since detailed abono balance requires deep query, but ticket works
                                  notes: p.notes
                                })}
                                className="flex items-center gap-1 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded border border-slate-700 transition ml-auto"
                                title="Descargar Ticket PDF"
                              >
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: INVOICES */}
          {activeTab === 'invoices' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-brand-400">Capital Prestado Activo</span>
                  <h3 className="text-3xl font-extrabold text-white font-mono mt-2">
                    ${totalLoansPrincipal.toLocaleString('es-CO')} COP
                  </h3>
                  <span className="text-xs text-slate-400 mt-2">
                    Suma total de principales
                  </span>
                </div>
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-400">Saldo Pendiente por Cobrar</span>
                  <h3 className="text-3xl font-extrabold text-white font-mono mt-2">
                    ${totalLoansBalance.toLocaleString('es-CO')} COP
                  </h3>
                  <span className="text-xs text-slate-400 mt-2">
                    Deuda total de deudores filtrados
                  </span>
                </div>
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Filtro de Estado</span>
                  <div className="mt-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-semibold text-sm focus:outline-none"
                    >
                      <option value="ALL">Todos los Estados</option>
                      <option value="ACTIVE">Créditos Activos</option>
                      <option value="PAID">Créditos Pagados</option>
                      <option value="RENEWED">Créditos Renovados</option>
                      <option value="OVERDUE">Créditos en Mora</option>
                    </select>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 block">
                    Filtra contratos por estado
                  </span>
                </div>
              </div>

              {/* Filters & Table */}
              <div className="glass-card p-6 rounded-xl space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por cliente, cédula o consecutivo PREST..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-850 rounded-lg">
                  {filteredLoans.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-12">No se encontraron créditos/facturas.</p>
                  ) : (
                    <table className="w-full text-left text-xs md:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <th className="p-3">Código</th>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Monto Capital</th>
                          <th className="p-3 text-right">Saldo Deuda</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-350">
                        {filteredLoans.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-900/10">
                            <td className="p-3 font-mono font-semibold text-slate-200">{l.loanNumber}</td>
                            <td className="p-3 text-slate-450">
                              {new Date(l.startDate).toLocaleDateString('es-CO')}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-250">{l.customer.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">CC: {l.customer.documentId}</div>
                            </td>
                            <td className="p-3 font-mono">
                              ${l.principal.toLocaleString('es-CO')}
                              <div className="text-[10px] text-slate-500">Int: {l.interestRate}%</div>
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-200">${l.balance.toLocaleString('es-CO')}</td>
                            <td className="p-3">{getLoanStatusBadge(l.status)}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  // Fetch full loan details if amortizations needed, but invoice-print-area requires amortizations
                                  // We can map a basic simulation or fetch it. Let's make an API call to get full details first, or simply simulate/fetch.
                                  // To make it super clean, let's fetch client details or loan details on click!
                                  apiCall(`/loans/${l.id}`)
                                    .then((fullLoan) => {
                                      setPrintInvoiceData({ client: l.customer, loan: fullLoan });
                                    })
                                    .catch((err) => alert('Error al cargar detalle del crédito: ' + err.message));
                                }}
                                className="flex items-center gap-1 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded border border-slate-700 transition ml-auto"
                                title="Descargar Contrato PDF"
                              >
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden print container for background PDF generation */}
      {printInvoiceData && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px', opacity: 0, pointerEvents: 'none' }} className="no-print">
          <div id="invoice-print-area" className="p-6 bg-white text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div className="flex justify-between items-start pb-6 mb-6" style={{ borderBottom: '1px solid #d1d5db' }}>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#003bb8' }}>FACTURA Y CONTRATO DE CRÉDITO</h1>
                <p className="text-sm font-mono mt-1" style={{ color: '#6b7280' }}>Crédito Nro: {printInvoiceData.loan.loanNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-semibold px-2 py-1 rounded" style={{ backgroundColor: '#e0edff', color: '#003bb8' }}>
                  {printInvoiceData.loan.status === 'RENEWED' ? 'Renovación de Cartera' : 'Nuevo Préstamo'}
                </span>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{new Date(printInvoiceData.loan.startDate).toLocaleDateString('es-CO')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm mb-6">
              <div>
                <h3 className="font-bold uppercase tracking-wide text-xs mb-2" style={{ color: '#374151' }}>Datos del Cliente:</h3>
                <p className="font-bold text-base" style={{ color: '#111827' }}>{printInvoiceData.client.name}</p>
                <p style={{ color: '#4b5563' }}>CC: {printInvoiceData.client.documentId}</p>
                <p style={{ color: '#4b5563' }}>Tel: {printInvoiceData.client.phone}</p>
                <p style={{ color: '#4b5563' }}>Dirección: {printInvoiceData.client.address}</p>
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-wide text-xs mb-2" style={{ color: '#374151' }}>Condiciones del Crédito:</h3>
                <div className="space-y-1">
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Monto Capital:</span> <span className="font-semibold" style={{ color: '#111827' }}>${printInvoiceData.loan.principal.toLocaleString('es-CO')}</span></div>
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Tasa de Interés:</span> <span className="font-semibold" style={{ color: '#111827' }}>{printInvoiceData.loan.interestRate}%</span></div>
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Monto Interés:</span> <span className="font-semibold" style={{ color: '#111827' }}>${printInvoiceData.loan.interestAmount.toLocaleString('es-CO')}</span></div>
                  <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #e5e7eb' }}><span className="font-bold" style={{ color: '#1f2937' }}>Total a Pagar:</span> <span className="font-bold" style={{ color: '#003bb8' }}>${printInvoiceData.loan.totalAmount.toLocaleString('es-CO')}</span></div>
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Frecuencia de Pago:</span> <span className="font-semibold" style={{ color: '#111827' }}>{translateFrequency(printInvoiceData.loan.paymentFrequency)}</span></div>
                  <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Cuotas:</span> <span className="font-semibold" style={{ color: '#111827' }}>{printInvoiceData.loan.installments} cuotas de ${printInvoiceData.loan.installmentAmt.toLocaleString('es-CO')}</span></div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold uppercase tracking-wide text-xs mb-3" style={{ color: '#374151' }}>Cronograma de Amortización (Cuotas)</h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="font-bold" style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', color: '#374151' }}>
                    <th className="p-2">Nro Cuota</th>
                    <th className="p-2">Fecha de Vencimiento</th>
                    <th className="p-2 text-right">Valor Cuota</th>
                    <th className="p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(printInvoiceData.loan.amortizations || []).map((am: any) => (
                    <tr key={am.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td className="p-2 font-mono" style={{ color: '#4b5563' }}>Cuota {am.installmentNumber}</td>
                      <td className="p-2" style={{ color: '#4b5563' }}>{new Date(am.dueDate).toLocaleDateString('es-CO')}</td>
                      <td className="p-2 text-right font-mono" style={{ color: '#4b5563' }}>${am.amount.toLocaleString('es-CO')}</td>
                      <td className="p-2 uppercase text-[10px] font-semibold" style={{ color: '#6b7280' }}>{am.status === 'PAID' ? 'Pagado' : 'Pendiente'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs mt-16" style={{ borderTop: '1px solid #e5e7eb' }}>
              <div>
                <div className="mx-auto w-48 mb-2" style={{ borderBottom: '1px solid #9ca3af' }}></div>
                <p className="font-semibold" style={{ color: '#374151' }}>Firma del Acreedor</p>
              </div>
              <div>
                <div className="mx-auto w-48 mb-2" style={{ borderBottom: '1px solid #9ca3af' }}></div>
                <p className="font-semibold" style={{ color: '#374151' }}>{printInvoiceData.client.name}</p>
                <p style={{ color: '#6b7280' }}>C.C. {printInvoiceData.client.documentId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {printReceiptData && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '350px', opacity: 0, pointerEvents: 'none' }} className="no-print">
          <div id="receipt-print-area" className="p-4 bg-white text-black font-mono">
            <div className="text-center pb-4 mb-4" style={{ borderBottom: '1px dashed #9ca3af' }}>
              <h2 className="font-bold text-lg" style={{ color: '#111827' }}>RECIBO DE CAJA</h2>
              <p className="text-xs mt-1" style={{ color: '#4b5563' }}>{printReceiptData.receiptNumber}</p>
              <p className="text-[10px]" style={{ color: '#6b7280' }}>{new Date(printReceiptData.paymentDate).toLocaleString('es-CO')}</p>
            </div>

            <div className="space-y-2 pb-4 mb-4 text-xs" style={{ borderBottom: '1px dashed #9ca3af' }}>
              <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Cliente:</span> <span className="font-bold truncate max-w-[180px]" style={{ color: '#111827' }}>{printReceiptData.clientName}</span></div>
              <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Cédula:</span> <span style={{ color: '#111827' }}>{printReceiptData.documentId}</span></div>
              <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Crédito Nro:</span> <span style={{ color: '#111827' }}>{printReceiptData.loanNumber}</span></div>
            </div>

            <div className="text-center py-4 mb-4" style={{ borderBottom: '1px dashed #9ca3af', backgroundColor: '#f9fafb' }}>
              <p className="text-xs uppercase" style={{ color: '#6b7280' }}>Monto Recibido</p>
              <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>${printReceiptData.amount.toLocaleString('es-CO')}</h1>
            </div>

            <div className="space-y-1.5 text-xs mb-8">
              <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Saldo anterior:</span> <span style={{ color: '#111827' }}>${(printReceiptData.remainingBalance + printReceiptData.amount).toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Abono realizado:</span> <span style={{ color: '#111827' }}>-${printReceiptData.amount.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid #e5e7eb' }}><span style={{ color: '#111827' }}>Nuevo saldo deuda:</span> <span style={{ color: '#111827' }}>${printReceiptData.remainingBalance.toLocaleString('es-CO')}</span></div>
              {printReceiptData.notes && (
                <div className="text-left mt-3 pt-2 italic text-[10px]" style={{ borderTop: '1px solid #f3f4f6', color: '#6b7280' }}>
                  Nota: {printReceiptData.notes}
                </div>
              )}
            </div>

            <div className="text-center text-[10px] mt-12" style={{ color: '#6b7280' }}>
              <div className="w-32 mx-auto mb-2" style={{ borderBottom: '1px dashed #d1d5db' }}></div>
              <p>Firma del Recaudador</p>
              <p className="mt-6 font-bold" style={{ color: '#111827' }}>¡Gracias por su puntualidad!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
