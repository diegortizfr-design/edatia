import React, { useState } from 'react';
import { apiCall } from '../../utils/api';
import type { ClientFullDetails } from './clientDetailTypes';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteClientModalProps {
  show: boolean;
  client: ClientFullDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  show,
  client,
  onClose,
  onSuccess
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await apiCall(`/clients/${client.id}`, { method: 'DELETE' });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el cliente.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Eliminar Cliente</h3>
              <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-3 text-sm text-slate-300">
          <p>
            ¿Estás seguro de que deseas eliminar permanentemente al cliente{' '}
            <strong className="text-white font-semibold">{client.name}</strong> (C.C. {client.documentId})?
          </p>
          <p className="text-xs text-red-400/90 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
            Se eliminarán todos sus préstamos, historial de amortizaciones, fotos KYC y recibos asociados.
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg text-sm transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
