import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, User, Phone, MapPin, Mail, 
  Coins, RefreshCw, Plus, Edit3, Trash2, ShieldCheck, FolderHeart, Receipt, Printer 
} from 'lucide-react';

import { 
  ClientFullDetails, Loan, PrintInvoiceData, PrintReceiptData 
} from '../components/client-detail/clientDetailTypes';
import { EditClientModal } from '../components/client-detail/EditClientModal';
import { DeleteClientModal } from '../components/client-detail/DeleteClientModal';
import { CameraModal } from '../components/client-detail/CameraModal';
import { KycAttachmentsTab } from '../components/client-detail/KycAttachmentsTab';
import { NewLoanModal } from '../components/client-detail/NewLoanModal';
import { RenewLoanModal } from '../components/client-detail/RenewLoanModal';
import { PaymentModal } from '../components/client-detail/PaymentModal';
import { AmortizationTable } from '../components/client-detail/AmortizationTable';
import { PrintInvoiceView, PrintReceiptView } from '../components/client-detail/PrintViews';

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ clientId, onBack }) => {
  const { tenant } = useAuth();
  const [client, setClient] = useState<ClientFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs Navigation
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'attachments'>('info');

  // Modals Visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);

  // Print Views Data
  const [printInvoiceData, setPrintInvoiceData] = useState<PrintInvoiceData | null>(null);
  const [printReceiptData, setPrintReceiptData] = useState<PrintReceiptData | null>(null);

  // Camera & Attachments State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'idFront' | 'idBack' | 'photo' | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [savingAttachment, setSavingAttachment] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Camera Stream Controls
  const startCamera = async (target: 'idFront' | 'idBack' | 'photo', mode: 'user' | 'environment' = 'environment') => {
    setCameraTarget(target);
    setFacingMode(mode);
    setShowCameraModal(true);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      alert('No se pudo abrir la cámara: ' + (err.message || 'Verifique los permisos de su navegador.'));
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraTarget(null);
  };

  const updateClientField = async (field: string, value: any) => {
    if (!client) return;
    setSavingAttachment(true);
    try {
      await apiCall(`/clients/${client.id}`, {
        method: 'PUT',
        bodyData: { [field]: value }
      });
      setClient(prev => prev ? { ...prev, [field]: value } : null);
    } catch (err: any) {
      alert('Error al guardar adjunto: ' + (err.message || err));
    } finally {
      setSavingAttachment(false);
    }
  };

  const capturePhotoFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraTarget || !client) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const target = cameraTarget;
      stopCamera();
      await updateClientField(target, dataUrl);
    }
  };

  const handleFileUpload = (field: 'idFront' | 'idBack' | 'photo', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe superar los 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      await updateClientField(field, reader.result as string);
    };
    reader.readAsDataURL(file);
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

  // --- PRINTABLE OVERLAYS (Factura / Recibo) ---
  if (printInvoiceData) {
    return <PrintInvoiceView data={printInvoiceData} onClose={() => setPrintInvoiceData(null)} />;
  }

  if (printReceiptData) {
    return <PrintReceiptView data={printReceiptData} onClose={() => setPrintReceiptData(null)} />;
  }

  const activeLoan = client.loans.find(l => l.status === 'ACTIVE' || l.status === 'OVERDUE') || null;

  const allClientPayments = client.loans
    .flatMap(loan => (loan.payments || []).map(p => ({
      ...p,
      loanNumber: loan.loanNumber,
      loanBalance: loan.balance
    })))
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back link */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-350 font-semibold transition"
      >
        <ArrowLeft className="w-5 h-5" /> Volver a Clientes
      </button>

      {/* Header Profile Card */}
      <div className="glass-card p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-brand-600/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-400 flex-shrink-0">
            {client.photo ? (
              <img src={client.photo} alt={client.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{client.name}</h2>
              <span className="inline-flex items-center text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Cobro {client.defaultFrequency === 'WEEKLY' ? 'Semanal' : client.defaultFrequency === 'BIWEEKLY' ? 'Quincenal' : client.defaultFrequency === 'MONTHLY' ? 'Mensual' : 'Diario'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400 mt-1">
              <span className="font-mono">CC: {client.documentId}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {client.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {client.address}</span>
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {client.email}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {activeLoan ? (
            <>
              <button
                onClick={() => setShowPayModal(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg font-semibold text-xs md:text-sm transition shadow-md shadow-emerald-600/10"
              >
                <Coins className="w-4 h-4" /> Registrar Cobro
              </button>
              <button
                onClick={() => setShowRenewModal(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg font-semibold text-xs md:text-sm transition shadow-md shadow-purple-600/10"
              >
                <RefreshCw className="w-4 h-4" /> Renovar Crédito
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md shadow-brand-600/10"
            >
              <Plus className="w-4 h-4" /> Asignar Préstamo
            </button>
          )}

          <button
            onClick={() => setShowEditModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg font-semibold text-xs md:text-sm transition"
            title="Editar información del cliente"
          >
            <Edit3 className="w-4 h-4 text-brand-400" /> Editar
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg font-semibold text-xs md:text-sm transition"
            title="Eliminar este cliente"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition shrink-0 ${
            activeTab === 'info'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderHeart className="w-4 h-4" /> Información y Préstamos ({client.loans.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition shrink-0 ${
            activeTab === 'payments'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" /> Historial de Recibos de Caja ({allClientPayments.length})
        </button>

        <button
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition shrink-0 ${
            activeTab === 'attachments'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Documentos & KYC
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'attachments' ? (
        <KycAttachmentsTab
          client={client}
          startCamera={startCamera}
          handleFileUpload={handleFileUpload}
          onUpdateClientField={updateClientField}
          savingAttachment={savingAttachment}
        />
      ) : activeTab === 'payments' ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  Historial de Recibos de Caja
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Todos los comprobantes de abono registrados para {client.name}
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full w-fit">
                {allClientPayments.length} Recibos
              </span>
            </div>

            {allClientPayments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No hay recibos de caja registrados para este cliente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Recibo Nro</th>
                      <th className="px-4 py-3">Crédito Nro</th>
                      <th className="px-4 py-3">Fecha y Hora</th>
                      <th className="px-4 py-3 text-right">Monto Abonado</th>
                      <th className="px-4 py-3">Notas</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {allClientPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono font-bold text-white">{p.receiptNumber}</td>
                        <td className="px-4 py-3 font-mono text-brand-400">{p.loanNumber}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{new Date(p.paymentDate).toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">+${p.amount.toLocaleString('es-CO')}</td>
                        <td className="px-4 py-3 italic text-slate-400">{p.notes || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setPrintReceiptData({
                              clientName: client.name,
                              documentId: client.documentId,
                              loanNumber: p.loanNumber,
                              receiptNumber: p.receiptNumber,
                              amount: p.amount,
                              paymentDate: p.paymentDate,
                              notes: p.notes,
                              remainingBalance: p.loanBalance
                            })}
                            className="inline-flex items-center gap-1.5 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition"
                          >
                            <Printer className="w-3.5 h-3.5" /> Imprimir Recibo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {client.loans && client.loans.length > 0 ? (
            client.loans.map(loan => (
              <AmortizationTable
                key={loan.id}
                loan={loan}
                onPrintContract={() => setPrintInvoiceData({ client, loan })}
              />
            ))
          ) : (
            <div className="glass-card p-12 text-center space-y-4 rounded-xl">
              <Coins className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-white">Sin Préstamos Asignados</h3>
                <p className="text-sm text-slate-400 mt-1">Este cliente no posee créditos o historial registrado.</p>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2.5 rounded-lg transition shadow-md"
              >
                <Plus className="w-4 h-4" /> Asignar Primer Préstamo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subcomponent Modals */}
      <EditClientModal
        show={showEditModal}
        client={client}
        onClose={() => setShowEditModal(false)}
        onSuccess={fetchClientDetails}
      />

      <DeleteClientModal
        show={showDeleteModal}
        client={client}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={onBack}
      />

      <CameraModal
        show={showCameraModal}
        target={cameraTarget}
        cameraStream={cameraStream}
        facingMode={facingMode}
        onClose={stopCamera}
        onCapture={capturePhotoFromCamera}
        onSwitchCamera={() => {
          if (cameraTarget) {
            startCamera(cameraTarget, facingMode === 'environment' ? 'user' : 'environment');
          }
        }}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />

      <NewLoanModal
        show={showAssignModal}
        client={client}
        onClose={() => setShowAssignModal(false)}
        onSuccess={newLoan => {
          setPrintInvoiceData({ client, loan: newLoan });
          fetchClientDetails();
        }}
      />

      <RenewLoanModal
        show={showRenewModal}
        client={client}
        activeLoan={activeLoan}
        onClose={() => setShowRenewModal(false)}
        onSuccess={res => {
          setPrintInvoiceData({
            client,
            loan: res.loan,
            isRenewal: true,
            excedente: res.excedente,
            debtSettled: res.debtSettled
          });
          fetchClientDetails();
        }}
      />

      <PaymentModal
        show={showPayModal}
        client={client}
        activeLoan={activeLoan}
        onClose={() => setShowPayModal(false)}
        onSuccess={receiptData => {
          setPrintReceiptData(receiptData);
          fetchClientDetails();
        }}
      />
    </div>
  );
};
