import React from 'react';
import { PrintInvoiceData, PrintReceiptData } from './clientDetailTypes';
import { Printer, Download } from 'lucide-react';

interface PrintInvoiceViewProps {
  data: PrintInvoiceData;
  onClose: () => void;
}

export const PrintInvoiceView: React.FC<PrintInvoiceViewProps> = ({ data, onClose }) => {
  const { client, loan, isRenewal, excedente, debtSettled } = data;

  const translateFrequency = (freq: string) => {
    const freqs: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      BIWEEKLY: 'Quincenal',
      MONTHLY: 'Mensual'
    };
    return freqs[freq] || freq;
  };

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
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      html2pdf().from(fullHtml).set(opt).save()
        .catch((err: any) => {
          alert('Error al compilar el PDF: ' + (err.message || err));
        });
    } catch (e: any) {
      alert('Excepción al generar el PDF: ' + e.message);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen p-4 sm:p-8 max-w-3xl mx-auto shadow-2xl rounded-xl border border-gray-300">
      <div id="invoice-print-area" className="p-6 bg-white text-slate-900" style={{ backgroundColor: '#ffffff', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div className="flex justify-between items-start pb-6 mb-6" style={{ borderBottom: '1px solid #d1d5db' }}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#003bb8' }}>FACTURA Y CONTRATO DE CRÉDITO</h1>
            <p className="text-sm font-mono mt-1" style={{ color: '#4b5563' }}>Crédito Nro: {loan.loanNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-semibold px-2 py-1 rounded" style={{ backgroundColor: '#e0edff', color: '#003bb8' }}>
              {isRenewal ? 'Renovación de Cartera' : 'Nuevo Préstamo'}
            </span>
            <p className="text-xs mt-1" style={{ color: '#4b5563' }}>{new Date(loan.startDate).toLocaleDateString('es-CO')}</p>
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
            <div className="flex justify-between"><span>Deuda anterior cancelada:</span> <span>${debtSettled?.toLocaleString('es-CO')}</span></div>
            <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid #d1fae5' }}><span>Excedente neto entregado al cliente:</span> <span>${excedente?.toLocaleString('es-CO')}</span></div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="font-bold uppercase tracking-wide text-xs mb-3" style={{ color: '#374151' }}>Cronograma de Amortización (Cuotas)</h3>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="font-bold" style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db', color: '#374151' }}>
                <th className="p-2.5">Nro Cuota</th>
                <th className="p-2.5">Fecha de Vencimiento</th>
                <th className="p-2.5 text-right">Valor Cuota</th>
              </tr>
            </thead>
            <tbody>
              {loan.amortizations.map((am: any) => (
                <tr key={am.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="p-2.5 font-mono" style={{ color: '#111827' }}>Cuota {am.installmentNumber}</td>
                  <td className="p-2.5" style={{ color: '#374151' }}>{new Date(am.dueDate).toLocaleDateString('es-CO')}</td>
                  <td className="p-2.5 text-right font-mono font-semibold" style={{ color: '#111827' }}>${am.amount.toLocaleString('es-CO')}</td>
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

      <div className="flex gap-4 justify-end mt-12 no-print">
        <button
          onClick={onClose}
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
};

interface PrintReceiptViewProps {
  data: PrintReceiptData;
  onClose: () => void;
}

export const PrintReceiptView: React.FC<PrintReceiptViewProps> = ({ data, onClose }) => {
  const r = data;

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
        margin: [0.1, 0.1, 0.1, 0.1],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'in', format: [3.15, 6.0], orientation: 'portrait' }
      };

      html2pdf().from(fullHtml).set(opt).save()
        .catch((err: any) => {
          alert('Error al compilar el ticket: ' + (err.message || err));
        });
    } catch (e: any) {
      alert('Excepción al generar el ticket: ' + e.message);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-[500px] p-6 max-w-sm mx-auto border border-dashed border-gray-400 font-mono text-sm leading-normal shadow-2xl rounded-xl" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
      <div id="receipt-print-area" className="p-4 bg-white text-slate-900 font-mono" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
        <div className="text-center pb-4 mb-4" style={{ borderBottom: '1px dashed #9ca3af' }}>
          <h2 className="font-bold text-lg" style={{ color: '#111827' }}>RECIBO DE CAJA</h2>
          <p className="text-xs mt-1" style={{ color: '#374151' }}>{r.receiptNumber}</p>
          <p className="text-[10px]" style={{ color: '#4b5563' }}>{new Date(r.paymentDate).toLocaleString('es-CO')}</p>
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

      <div className="flex gap-4 justify-center mt-12 no-print font-sans">
        <button
          onClick={onClose}
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
};
