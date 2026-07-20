import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Route as RouteIcon, Search, Coins, Phone, MapPin, CheckCircle, AlertTriangle, Printer, Navigation, Download } from 'lucide-react';

interface RouteItem {
  loanId: string;
  loanNumber: string;
  customerId: string;
  customerName: string;
  documentId: string;
  phone: string;
  address: string;
  totalBalance: number;
  installmentAmt: number;
  totalToCollect: number;
  pendingInstallmentsCount: number;
  isOverdue: boolean;
  frequency: string;
}

interface RouteProps {
  setCurrentPage: (page: string) => void;
  setSelectedClientId: (id: string) => void;
}

export const Route: React.FC<RouteProps> = ({ setCurrentPage, setSelectedClientId }) => {
  const [routeItems, setRouteItems] = useState<RouteItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Payment Modal States
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeItem, setActiveItem] = useState<RouteItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState<any>(null);

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
        alert('Error: La librería de generación de PDF no se ha cargado. Por favor, refresca la página (Ctrl + F5) e intenta nuevamente.');
        return;
      }

      // Clone the element
      const clonedElement = element.cloneNode(true) as HTMLElement;

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '300px'; // Standard thermal width in pixels
      container.style.background = 'white';
      container.style.color = 'black';
      container.appendChild(clonedElement);
      document.body.appendChild(container);

      const opt = {
        margin:       [0.1, 0.1, 0.1, 0.1],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2.5, 
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 320
        },
        jsPDF:        { unit: 'in', format: [3.15, 6.0], orientation: 'portrait' }
      };

      html2pdf().set(opt).from(clonedElement).save()
        .then(() => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
        })
        .catch((err: any) => {
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          alert('Error al compilar el ticket: ' + (err.message || err));
        });
    } catch (e: any) {
      alert('Excepción al generar el ticket: ' + e.message);
    }
  };

  const fetchRouteData = async (dateStr: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall(`/route?date=${dateStr}`);
      setRouteItems(data.route);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la ruta de cobranza.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteData(selectedDate);
  }, [selectedDate]);

  const handlePayClick = (item: RouteItem) => {
    setActiveItem(item);
    setPayAmount(String(item.totalToCollect)); // default to full amount to collect
    setPayError('');
    setShowPayModal(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPayLoading(true);

    try {
      const res = await apiCall('/payments', {
        method: 'POST',
        bodyData: {
          loanId: activeItem?.loanId,
          amount: parseFloat(payAmount),
          notes: payNotes
        }
      });

      setShowPayModal(false);
      setPayAmount('');
      setPayNotes('');
      
      // Load receipt data
      setPrintReceiptData({
        clientName: activeItem?.customerName,
        documentId: activeItem?.documentId,
        loanNumber: activeItem?.loanNumber,
        receiptNumber: res.payment.receiptNumber,
        amount: res.payment.amount,
        paymentDate: res.payment.paymentDate,
        notes: res.payment.notes,
        remainingBalance: res.remainingBalance
      });

      // Refresh list
      fetchRouteData(selectedDate);
    } catch (err: any) {
      setPayError(err.message || 'Error al procesar el abono.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleClientClick = (customerId: string) => {
    setSelectedClientId(customerId);
    setCurrentPage('client-detail');
  };

  // Filter items based on search input
  const filteredItems = routeItems.filter(item => 
    item.customerName.toLowerCase().includes(search.toLowerCase()) ||
    item.address.toLowerCase().includes(search.toLowerCase()) ||
    item.documentId.includes(search)
  );

  const totalToCollect = routeItems.reduce((sum, item) => sum + item.totalToCollect, 0);

  // --- RENDERING THERMAL RECEIPT PRINT OVERLAY ---
  if (printReceiptData) {
    const r = printReceiptData;
    return (
      <div className="bg-white text-black min-h-[500px] p-6 max-w-sm mx-auto border border-dashed border-gray-400 font-mono text-sm leading-normal shadow-lg animate-fadeIn">
        {/* Printable Area */}
        <div id="receipt-print-area" className="p-4 bg-white text-black font-mono">
          <div className="text-center pb-4 mb-4" style={{ borderBottom: '1px dashed #9ca3af' }}>
            <h2 className="font-bold text-lg" style={{ color: '#111827' }}>RECIBO DE CAJA</h2>
            <p className="text-xs mt-1" style={{ color: '#4b5563' }}>{r.receiptNumber}</p>
            <p className="text-[10px]" style={{ color: '#6b7280' }}>{new Date(r.paymentDate).toLocaleString('es-CO')}</p>
          </div>

          <div className="space-y-2 pb-4 mb-4 text-xs" style={{ borderBottom: '1px dashed #9ca3af' }}>
            <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Cliente:</span> <span className="font-bold truncate max-w-[180px]" style={{ color: '#111827' }}>{r.clientName}</span></div>
            <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Cédula:</span> <span style={{ color: '#111827' }}>{r.documentId}</span></div>
            <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Crédito Nro:</span> <span style={{ color: '#111827' }}>{r.loanNumber}</span></div>
          </div>

          <div className="text-center py-4 mb-4" style={{ borderBottom: '1px dashed #9ca3af', backgroundColor: '#f9fafb' }}>
            <p className="text-xs uppercase" style={{ color: '#6b7280' }}>Monto Recibido</p>
            <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>${r.amount.toLocaleString('es-CO')}</h1>
          </div>

          <div className="space-y-1.5 text-xs mb-8">
            <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Saldo anterior:</span> <span style={{ color: '#111827' }}>${(r.remainingBalance + r.amount).toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Abono realizado:</span> <span style={{ color: '#111827' }}>-${r.amount.toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid #e5e7eb' }}><span style={{ color: '#111827' }}>Nuevo saldo deuda:</span> <span style={{ color: '#111827' }}>${r.remainingBalance.toLocaleString('es-CO')}</span></div>
            {r.notes && (
              <div className="text-left mt-3 pt-2 italic text-[10px]" style={{ borderTop: '1px solid #f3f4f6', color: '#6b7280' }}>
                Nota: {r.notes}
              </div>
            )}
          </div>

          <div className="text-center text-[10px] mt-12" style={{ color: '#6b7280' }}>
            <div className="w-32 mx-auto mb-2" style={{ borderBottom: '1px dashed #d1d5db' }}></div>
            <p>Firma del Recaudador</p>
            <p className="mt-6 font-bold" style={{ color: '#111827' }}>¡Gracias por su puntualidad!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-12 no-print font-sans">
          <button
            onClick={() => setPrintReceiptData(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition"
          >
            Cerrar Recibo
          </button>
          <button
            onClick={() => handleDownloadReceiptPDF('receipt-print-area', `Recibo_${r.receiptNumber}.pdf`)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-md"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-md"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
            <RouteIcon className="w-8 h-8 text-brand-500" /> Ruta de Cobro
          </h1>
          <p className="text-slate-400 mt-1">Planificador y listado de cobros para el día seleccionado.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-350">Fecha de Ruta:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-450">Cobros Programados</p>
          <h3 className="text-2xl font-bold text-white mt-2">{routeItems.length} clientes</h3>
        </div>
        <div className="glass-card p-5 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-450">Monto Estimado de Recaudo</p>
          <h3 className="text-2xl font-bold text-brand-400 mt-2">${totalToCollect.toLocaleString('es-CO')} COP</h3>
        </div>
      </div>

      {/* Search Filter */}
      <div className="glass-card p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar ruta por cliente o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg">{error}</div>}

      {/* Route List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No hay cobros pendientes programados para esta fecha.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div 
              key={item.loanId} 
              className={`glass-card p-5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 ${
                item.isOverdue ? 'border-red-500/20' : 'border-slate-800'
              }`}
            >
              {/* Customer Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 
                    onClick={() => handleClientClick(item.customerId)}
                    className="font-bold text-white text-lg hover:text-brand-400 cursor-pointer transition"
                  >
                    {item.customerName}
                  </h3>
                  {item.isOverdue && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertTriangle className="w-3 h-3" /> Atrasado
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-850 text-slate-400">
                    {item.loanNumber}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    {item.address}
                  </span>
                  <a 
                    href={`tel:${item.phone}`}
                    className="flex items-center gap-1.5 hover:text-brand-400 transition"
                  >
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    {item.phone}
                  </a>
                </div>
              </div>

              {/* Amount to collect & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-850 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <span className="text-xs text-slate-550 block">Monto a cobrar:</span>
                  <span className={`font-mono text-lg font-bold ${item.isOverdue ? 'text-red-400' : 'text-slate-205'}`}>
                    ${item.totalToCollect.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Cuota: ${item.installmentAmt.toLocaleString('es-CO')} ({item.pendingInstallmentsCount} pendientes)
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 border border-slate-850 hover:border-slate-700 bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition"
                    title="Ver Mapa"
                  >
                    <Navigation className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handlePayClick(item)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition shadow-lg shadow-emerald-600/10"
                  >
                    <Coins className="w-4 h-4" /> Cobrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {showPayModal && activeItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 relative animate-zoomIn">
            <h3 className="text-xl font-bold text-white mb-2">Cobro de Cuota</h3>
            <p className="text-slate-450 text-xs mb-4">Deudor: {activeItem.customerName} | Préstamo: {activeItem.loanNumber}</p>
            
            {payError && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-4">{payError}</div>}

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Monto Cobrado (COP) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono text-lg focus:outline-none focus:border-brand-500"
                  required
                />
                <span className="text-[10px] text-slate-500 block mt-1">Sugerido para hoy (incluye atrasos): ${activeItem.totalToCollect.toLocaleString('es-CO')}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Observaciones</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Abono recibido en la ruta diaria."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/10"
                >
                  {payLoading ? 'Guardando Pago...' : 'Confirmar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
