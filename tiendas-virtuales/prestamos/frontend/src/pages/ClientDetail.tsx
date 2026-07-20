import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { 
  ArrowLeft, User, Phone, MapPin, Mail, 
  Coins, RefreshCw, Plus, 
  AlertTriangle, Printer, Sparkles, Download
} from 'lucide-react';

interface Amortization {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: string;
  paidAt: string | null;
}

interface Payment {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  notes: string | null;
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
  renewalFromId: string | null;
  amortizations: Amortization[];
  payments: Payment[];
}

interface ClientFullDetails {
  id: string;
  name: string;
  documentId: string;
  phone: string;
  address: string;
  email: string | null;
  status: string;
  loans: Loan[];
}

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ clientId, onBack }) => {
  const [client, setClient] = useState<ClientFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals Visibility
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);

  // Print Mode State (to render printable overlays)
  const [printInvoiceData, setPrintInvoiceData] = useState<any>(null);
  const [printReceiptData, setPrintReceiptData] = useState<any>(null);

  // Assign Loan Form State
  const [principal, setPrincipal] = useState('500000');
  const [interestRate, setInterestRate] = useState('20');
  const [frequency, setFrequency] = useState('DAILY');
  const [installments, setInstallments] = useState('24');
  const [simulation, setSimulation] = useState<any>(null);
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Pay Form State
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Renew Form State
  const [renewPrincipal, setRenewPrincipal] = useState('');
  const [renewInterestRate, setRenewInterestRate] = useState('20');
  const [renewFrequency, setRenewFrequency] = useState('DAILY');
  const [renewInstallments, setRenewInstallments] = useState('24');
  const [renewError, setRenewError] = useState('');
  const [renewLoading, setRenewLoading] = useState(false);

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
        alert('Error: La librería de generación de PDF no se ha cargado. Por favor, refresca la página (Ctrl + F5) e intenta nuevamente.');
        return;
      }

      // Wrap inner HTML in a clean, standalone document with Tailwind v2 (which uses standard hex/RGB colors)
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
        alert('Error: La librería de generación de PDF no se ha cargado. Por favor, refresca la página (Ctrl + F5) e intenta nuevamente.');
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

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/clients/${clientId}`);
      setClient(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener ficha de cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  // Handle Real-time Loan Assignment Simulation
  useEffect(() => {
    if (showAssignModal && principal && interestRate && installments) {
      const p = parseFloat(principal);
      const r = parseFloat(interestRate);
      const inst = parseInt(installments);
      
      if (!isNaN(p) && !isNaN(r) && !isNaN(inst) && inst > 0) {
        const interestAmount = p * (r / 100);
        const totalAmount = p + interestAmount;
        const installmentAmt = Math.round(totalAmount / inst);
        
        // Generate simulated dates locally to avoid calling backend on every change
        const dates: Date[] = [];
        let currentDate = new Date();
        for (let i = 0; i < inst; i++) {
          currentDate.setDate(currentDate.getDate() + 1);
          if (frequency === 'DAILY' && currentDate.getDay() === 0) {
            currentDate.setDate(currentDate.getDate() + 1); // Skip Sunday
          } else if (frequency === 'WEEKLY') {
            currentDate.setDate(currentDate.getDate() + 6); // Add rest of week
          } else if (frequency === 'BIWEEKLY') {
            currentDate.setDate(currentDate.getDate() + 14);
          } else if (frequency === 'MONTHLY') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          dates.push(new Date(currentDate.getTime()));
        }

        setSimulation({
          principal: p,
          interestRate: r,
          interestAmount,
          totalAmount,
          installmentAmt,
          dates
        });
      }
    }
  }, [showAssignModal, principal, interestRate, frequency, installments]);

  const activeLoan = client?.loans.find(l => l.status === 'ACTIVE' || l.status === 'OVERDUE');

  // Trigger Renewal simulation defaults
  useEffect(() => {
    if (showRenewModal && activeLoan) {
      // Set default new principal equal to current debt rounded up to nearest 100k plus some buffer
      const suggestedAmount = Math.ceil(activeLoan.balance / 100000) * 100000 + 200000;
      setRenewPrincipal(String(suggestedAmount));
    }
  }, [showRenewModal, activeLoan]);

  const handleAssignLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError('');
    setAssignLoading(true);

    try {
      const newLoan = await apiCall('/loans', {
        method: 'POST',
        bodyData: {
          customerId: client?.id,
          principal: parseFloat(principal),
          interestRate: parseFloat(interestRate),
          paymentFrequency: frequency,
          installments: parseInt(installments)
        }
      });
      
      setShowAssignModal(false);
      setPrintInvoiceData({ client, loan: newLoan });
      fetchClientDetails();
    } catch (err: any) {
      setAssignError(err.message || 'Error al asignar préstamo.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPayLoading(true);

    try {
      const res = await apiCall('/payments', {
        method: 'POST',
        bodyData: {
          loanId: activeLoan?.id,
          amount: parseFloat(payAmount),
          notes: payNotes
        }
      });

      setShowPayModal(false);
      setPayAmount('');
      setPayNotes('');
      setPrintReceiptData({
        clientName: client?.name,
        documentId: client?.documentId,
        loanNumber: activeLoan?.loanNumber,
        receiptNumber: res.payment.receiptNumber,
        amount: res.payment.amount,
        paymentDate: res.payment.paymentDate,
        notes: res.payment.notes,
        remainingBalance: res.remainingBalance
      });
      fetchClientDetails();
    } catch (err: any) {
      setPayError(err.message || 'Error al registrar abono.');
    } finally {
      setPayLoading(false);
    }
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenewError('');
    setRenewLoading(true);

    try {
      const res = await apiCall('/loans/renew', {
        method: 'POST',
        bodyData: {
          oldLoanId: activeLoan?.id,
          principal: parseFloat(renewPrincipal),
          interestRate: parseFloat(renewInterestRate),
          paymentFrequency: renewFrequency,
          installments: parseInt(renewInstallments)
        }
      });

      setShowRenewModal(false);
      setPrintInvoiceData({ client, loan: res.loan, isRenewal: true, excedente: res.excedente, debtSettled: res.debtSettled });
      fetchClientDetails();
    } catch (err: any) {
      setRenewError(err.message || 'Error al renovar préstamo.');
    } finally {
      setRenewLoading(false);
    }
  };

  const translateFrequency = (freq: string) => {
    const freqs: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      BIWEEKLY: 'Quincenal',
      MONTHLY: 'Mensual'
    };
    return freqs[freq] || freq;
  };

  const getAmortizationStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PENDING: 'bg-slate-800 text-slate-400 border-slate-700/50',
      PARTIAL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/30'
    };
    const labels: Record<string, string> = {
      PAID: 'Pagado',
      PENDING: 'Pendiente',
      PARTIAL: 'Abonado',
      OVERDUE: 'Atrasado'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-400">Cargando datos del cliente...</span>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver a Clientes
        </button>
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error || 'No se pudo cargar el cliente.'}</p>
        </div>
      </div>
    );
  }

  // --- RENDERING SPECIAL PRINT VIEWS (facturas / recibos) ---
  if (printInvoiceData) {
    const { loan, isRenewal, excedente, debtSettled } = printInvoiceData;
    return (
      <div className="bg-white text-black min-h-screen p-8 max-w-3xl mx-auto shadow-xl rounded-lg border border-gray-200">
        {/* Printable Area */}
        <div id="invoice-print-area" className="p-6 bg-white text-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div className="flex justify-between items-start pb-6 mb-6" style={{ borderBottom: '1px solid #d1d5db' }}>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#003bb8' }}>FACTURA Y CONTRATO DE CRÉDITO</h1>
              <p className="text-sm font-mono mt-1" style={{ color: '#6b7280' }}>Crédito Nro: {loan.loanNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-semibold px-2 py-1 rounded" style={{ backgroundColor: '#e0edff', color: '#003bb8' }}>
                {isRenewal ? 'Renovación de Cartera' : 'Nuevo Préstamo'}
              </span>
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{new Date(loan.startDate).toLocaleDateString('es-CO')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm mb-6">
            <div>
              <h3 className="font-bold uppercase tracking-wide text-xs mb-2" style={{ color: '#374151' }}>Datos del Cliente:</h3>
              <p className="font-semibold" style={{ color: '#111827' }}>{client.name}</p>
              <p style={{ color: '#4b5563' }}>CC: {client.documentId}</p>
              <p style={{ color: '#4b5563' }}>Tel: {client.phone}</p>
              <p style={{ color: '#4b5563' }}>Dirección: {client.address}</p>
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-wide text-xs mb-2" style={{ color: '#374151' }}>Condiciones del Crédito:</h3>
              <div className="space-y-1">
                <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Monto Capital:</span> <span className="font-semibold" style={{ color: '#111827' }}>${loan.principal.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Tasa de Interés:</span> <span className="font-semibold" style={{ color: '#111827' }}>{loan.interestRate}%</span></div>
                <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Monto Interés:</span> <span className="font-semibold" style={{ color: '#111827' }}>${loan.interestAmount.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #e5e7eb' }}><span className="font-bold" style={{ color: '#1f2937' }}>Total a Pagar:</span> <span className="font-bold" style={{ color: '#003bb8' }}>${loan.totalAmount.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Frecuencia de Pago:</span> <span className="font-semibold" style={{ color: '#111827' }}>{translateFrequency(loan.paymentFrequency)}</span></div>
                <div className="flex justify-between"><span style={{ color: '#4b5563' }}>Cuotas:</span> <span className="font-semibold" style={{ color: '#111827' }}>{loan.installments} cuotas de ${loan.installmentAmt.toLocaleString('es-CO')}</span></div>
              </div>
            </div>
          </div>

          {isRenewal && (
            <div className="rounded p-4 text-sm mb-6" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', borderStyle: 'solid', borderWidth: '1px' }}>
              <h4 className="font-bold uppercase text-xs mb-1">Liquidación por Refinanciamiento</h4>
              <div className="flex justify-between"><span>Deuda anterior cancelada:</span> <span>${debtSettled.toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid #d1fae5' }}><span>Excedente neto entregado al cliente:</span> <span>${excedente.toLocaleString('es-CO')}</span></div>
            </div>
          )}

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
                {loan.amortizations.map((am: any) => (
                  <tr key={am.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td className="p-2 font-mono" style={{ color: '#4b5563' }}>Cuota {am.installmentNumber}</td>
                    <td className="p-2" style={{ color: '#4b5563' }}>{new Date(am.dueDate).toLocaleDateString('es-CO')}</td>
                    <td className="p-2 text-right font-mono" style={{ color: '#4b5563' }}>${am.amount.toLocaleString('es-CO')}</td>
                    <td className="p-2 uppercase text-[10px] font-semibold" style={{ color: '#6b7280' }}>Pendiente</td>
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
              <p className="font-semibold" style={{ color: '#374151' }}>{client.name}</p>
              <p style={{ color: '#6b7280' }}>C.C. {client.documentId}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end mt-12 no-print">
          <button
            onClick={() => setPrintInvoiceData(null)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg transition"
          >
            Volver a la Ficha
          </button>
          <button
            onClick={() => handleDownloadPDF('invoice-print-area', `Contrato_Credito_${loan.loanNumber}.pdf`)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition shadow-lg"
          >
            <Download className="w-5 h-5" /> Descargar PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2 rounded-lg transition shadow-lg"
          >
            <Printer className="w-5 h-5" /> Imprimir Documento
          </button>
        </div>
      </div>
    );
  }

  if (printReceiptData) {
    const r = printReceiptData;
    return (
      <div className="bg-white text-black min-h-[500px] p-6 max-w-sm mx-auto border border-dashed border-gray-400 font-mono text-sm leading-normal shadow-lg">
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

  // --- STANDARD FRONTEND VIEW ---
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-350 font-semibold transition"
      >
        <ArrowLeft className="w-5 h-5" /> Volver a Clientes
      </button>

      {/* Ficha Header Card */}
      <div className="glass-card p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-brand-600/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{client.name}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
              <span className="font-mono">CC: {client.documentId}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {client.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {client.address}</span>
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {client.email}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {activeLoan ? (
            <>
              <button
                onClick={() => setShowPayModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-emerald-600/10"
              >
                <Coins className="w-4 h-4" /> Registrar Cobro
              </button>
              <button
                onClick={() => setShowRenewModal(true)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-purple-600/10"
              >
                <RefreshCw className="w-4 h-4" /> Renovar Crédito
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-brand-600/10"
            >
              <Plus className="w-4 h-4" /> Asignar Préstamo
            </button>
          )}
        </div>
      </div>

      {/* active Loan & Amortization Card */}
      {activeLoan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active loan specs */}
          <div className="glass-card p-6 rounded-xl space-y-6 lg:col-span-1 h-fit">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs uppercase font-bold tracking-wider text-brand-400">Préstamo Activo</span>
                <span className="font-mono text-sm font-semibold text-slate-200">{activeLoan.loanNumber}</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white font-mono mt-3">
                ${activeLoan.balance.toLocaleString('es-CO')}
                <span className="text-sm text-slate-400 font-normal block mt-1">saldo deuda restante</span>
              </h3>
            </div>

            <div className="space-y-3.5 border-t border-slate-800 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-450">Monto prestado:</span>
                <span className="font-semibold text-slate-200">${activeLoan.principal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Tasa de interés:</span>
                <span className="font-semibold text-slate-200">{activeLoan.interestRate}% (${activeLoan.interestAmount.toLocaleString('es-CO')})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Total facturado:</span>
                <span className="font-semibold text-slate-250">${activeLoan.totalAmount.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Forma de pago:</span>
                <span className="font-semibold text-slate-200">{translateFrequency(activeLoan.paymentFrequency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Cuotas programadas:</span>
                <span className="font-semibold text-slate-200">{activeLoan.installments} de ${activeLoan.installmentAmt.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Fecha de entrega:</span>
                <span className="font-semibold text-slate-200">{new Date(activeLoan.startDate).toLocaleDateString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Fecha de término:</span>
                <span className="font-semibold text-slate-200">{new Date(activeLoan.endDate).toLocaleDateString('es-CO')}</span>
              </div>
            </div>

            <button
              onClick={() => setPrintInvoiceData({ client, loan: activeLoan })}
              className="w-full flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 bg-slate-850 hover:bg-slate-800 text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              <Printer className="w-4 h-4" /> Ver Factura / Contrato
            </button>
          </div>

          {/* Amortization schedule */}
          <div className="glass-card p-6 rounded-xl lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Plan de Amortización (Cuotas)</h3>
            <div className="overflow-y-auto max-h-[400px] border border-slate-850 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-900/30 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3">Cuota</th>
                    <th className="p-3">Vencimiento</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-right">Pagado</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {activeLoan.amortizations.map((am) => (
                    <tr key={am.id} className="hover:bg-slate-900/20 text-sm">
                      <td className="p-3 font-mono font-medium text-slate-350">Cuota {am.installmentNumber}</td>
                      <td className="p-3 text-slate-400">
                        {new Date(am.dueDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-200">${am.amount.toLocaleString('es-CO')}</td>
                      <td className="p-3 text-right font-mono text-emerald-500/80">
                        {am.amountPaid > 0 ? `$${am.amountPaid.toLocaleString('es-CO')}` : '-'}
                      </td>
                      <td className="p-3">{getAmortizationStatusBadge(am.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center rounded-xl max-w-xl mx-auto">
          <Coins className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No posee préstamos activos</h3>
          <p className="text-slate-450 text-sm max-w-md mx-auto mb-6">
            El deudor no tiene obligaciones vigentes. Puedes asignarle un nuevo producto de crédito seleccionando una de tus plantillas de interés y condiciones de pago.
          </p>
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-brand-500/10 transition"
          >
            Crear Préstamo Comercial
          </button>
        </div>
      )}

      {/* Credit History (Historial) */}
      <div className="glass-card p-6 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-4">Historial de Préstamos</h3>
        {client.loans.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Sin historial de créditos anteriores.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Principal</th>
                  <th className="pb-3">Interés</th>
                  <th className="pb-3">Frecuencia</th>
                  <th className="pb-3">Cuotas</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {client.loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-900/10">
                    <td className="py-3 font-mono font-semibold text-slate-200">{loan.loanNumber}</td>
                    <td className="py-3 font-mono">${loan.principal.toLocaleString('es-CO')}</td>
                    <td className="py-3 font-mono">{loan.interestRate}%</td>
                    <td className="py-3">{translateFrequency(loan.paymentFrequency)}</td>
                    <td className="py-3">{loan.installments}</td>
                    <td className="py-3">
                      {loan.status === 'PAID' && <span className="text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 text-xs">PAGADO</span>}
                      {loan.status === 'ACTIVE' && <span className="text-brand-400 font-semibold bg-brand-500/5 px-2 py-0.5 rounded-full border border-brand-500/10 text-xs">ACTIVO</span>}
                      {loan.status === 'RENEWED' && <span className="text-purple-400 font-semibold bg-purple-500/5 px-2 py-0.5 rounded-full border border-purple-500/10 text-xs">RENOVADO</span>}
                      {loan.status === 'OVERDUE' && <span className="text-red-400 font-semibold bg-red-500/5 px-2 py-0.5 rounded-full border border-red-500/10 text-xs">EN MORA</span>}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setPrintInvoiceData({ client, loan })}
                        className="text-slate-400 hover:text-white transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL 1: ASSIGN LOAN --- */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 grid grid-cols-1 md:grid-cols-5 gap-6 relative animate-zoomIn max-h-[90vh] overflow-y-auto">
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-xl font-bold text-white">Asignar Préstamo</h3>
              {assignError && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg">{assignError}</div>}
              
              <form onSubmit={handleAssignLoanSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Monto Solicitado *</label>
                    <input
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Interés (%) *</label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Frecuencia de Pago *</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white"
                    >
                      <option value="DAILY">Pago Diario (L-S)</option>
                      <option value="WEEKLY">Pago Semanal</option>
                      <option value="BIWEEKLY">Pago Quincenal</option>
                      <option value="MONTHLY">Pago Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nro de Cuotas *</label>
                    <input
                      type="number"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={assignLoading}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white font-semibold rounded-lg shadow-lg shadow-brand-500/10"
                  >
                    {assignLoading ? 'Asignando...' : 'Confirmar Préstamo'}
                  </button>
                </div>
              </form>
            </div>

            {/* Simulation Preview Sidebar */}
            <div className="md:col-span-2 bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5 text-brand-400">
                <Sparkles className="w-4 h-4" /> Simulación de Cuotas
              </h4>
              {simulation ? (
                <div className="space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400"><span>Monto principal:</span> <span className="font-mono text-slate-200 font-semibold">${simulation.principal.toLocaleString('es-CO')}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Interés total ({simulation.interestRate}%):</span> <span className="font-mono text-slate-200 font-semibold">${simulation.interestAmount.toLocaleString('es-CO')}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Monto total:</span> <span className="font-mono text-white font-bold">${simulation.totalAmount.toLocaleString('es-CO')}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Valor por cuota:</span> <span className="font-mono text-brand-400 font-bold text-sm">${simulation.installmentAmt.toLocaleString('es-CO')}</span></div>
                  </div>

                  <div className="border-t border-slate-850 pt-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Primeros Vencimientos:</p>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {simulation.dates.slice(0, 5).map((date: Date, idx: number) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>Cuota {idx + 1}:</span>
                          <span>{date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      ))}
                      {simulation.dates.length > 5 && <div className="text-[10px] text-slate-500 text-center pt-1">... y {simulation.dates.length - 5} cuotas más</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">Ingrese condiciones válidas para generar una simulación.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: REGISTRAR ABONO --- */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 relative animate-zoomIn">
            <h3 className="text-xl font-bold text-white mb-2">Registrar Pago / Abono</h3>
            <p className="text-slate-400 text-xs mb-4">Crédito: {activeLoan?.loanNumber} | Saldo: ${activeLoan?.balance.toLocaleString('es-CO')}</p>
            
            {payError && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-4">{payError}</div>}

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Monto a Abonar (COP) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Valor cuota: $${activeLoan?.installmentAmt.toLocaleString('es-CO')}`}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono text-lg focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Observaciones</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="ej: Abono cuota del día, pagó en efectivo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/10"
                >
                  {payLoading ? 'Procesando...' : 'Registrar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: RENEW CREDIT --- */}
      {showRenewModal && activeLoan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 grid grid-cols-1 md:grid-cols-5 gap-6 relative animate-zoomIn max-h-[90vh] overflow-y-auto">
            <div className="md:col-span-3 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Renovación de Crédito</h3>
                <p className="text-slate-400 text-xs mt-0.5">Liquidación de crédito anterior ({activeLoan.loanNumber}) y creación de nuevas condiciones.</p>
              </div>

              {renewError && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg">{renewError}</div>}
              
              <form onSubmit={handleRenewSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Monto Nuevo Crédito *</label>
                    <input
                      type="number"
                      value={renewPrincipal}
                      onChange={(e) => setRenewPrincipal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nuevo Interés (%) *</label>
                    <input
                      type="number"
                      value={renewInterestRate}
                      onChange={(e) => setRenewInterestRate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nueva Frecuencia *</label>
                    <select
                      value={renewFrequency}
                      onChange={(e) => setRenewFrequency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white"
                    >
                      <option value="DAILY">Pago Diario (L-S)</option>
                      <option value="WEEKLY">Pago Semanal</option>
                      <option value="BIWEEKLY">Pago Quincenal</option>
                      <option value="MONTHLY">Pago Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nro de Cuotas *</label>
                    <input
                      type="number"
                      value={renewInstallments}
                      onChange={(e) => setRenewInstallments(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(false)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={renewLoading || (parseFloat(renewPrincipal) < activeLoan.balance)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/10"
                  >
                    {renewLoading ? 'Procesando...' : 'Confirmar Renovación'}
                  </button>
                </div>
              </form>
            </div>

            {/* Refinancing calculations visual sidebar */}
            <div className="md:col-span-2 bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4">
              <h4 className="font-bold text-white text-sm text-purple-400 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4" /> Cálculo de Liquidación
              </h4>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between text-slate-400"><span>Deuda crédito anterior:</span> <span className="font-mono text-red-400 font-semibold">${activeLoan.balance.toLocaleString('es-CO')}</span></div>
                <div className="flex justify-between text-slate-400"><span>Monto nuevo crédito:</span> <span className="font-mono text-slate-200 font-semibold">${(parseFloat(renewPrincipal) || 0).toLocaleString('es-CO')}</span></div>
                
                <div className="border-t border-slate-850 pt-2.5 flex justify-between font-bold">
                  <span className="text-slate-300">Excedente a entregar:</span> 
                  <span className={`font-mono text-sm ${parseFloat(renewPrincipal) >= activeLoan.balance ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${(Math.max(0, (parseFloat(renewPrincipal) || 0) - activeLoan.balance)).toLocaleString('es-CO')} COP
                  </span>
                </div>

                {parseFloat(renewPrincipal) < activeLoan.balance && (
                  <div className="bg-red-500/10 border border-red-500/20 text-[10px] text-red-350 p-2.5 rounded-lg flex gap-1.5 items-start">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>El nuevo crédito debe ser igual o mayor al saldo actual para comprar la cartera antigua.</span>
                  </div>
                )}
              </div>

              {parseFloat(renewPrincipal) >= activeLoan.balance && (
                <div className="border-t border-slate-850 pt-3 text-[10px] text-slate-500 space-y-1.5">
                  <p className="font-bold text-slate-400 uppercase">Resumen nuevo plan:</p>
                  <div>
                    Interés total: ${( (parseFloat(renewPrincipal) || 0) * (parseFloat(renewInterestRate) / 100) ).toLocaleString('es-CO')} COP
                  </div>
                  <div>
                    Cuota estimada: ${Math.round( ((parseFloat(renewPrincipal) || 0) + ( (parseFloat(renewPrincipal) || 0) * (parseFloat(renewInterestRate) / 100) )) / (parseInt(renewInstallments) || 1) ).toLocaleString('es-CO')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
