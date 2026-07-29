import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { ClientFullDetails } from './clientDetailTypes';
import { User, Phone, MapPin, Mail, X } from 'lucide-react';

interface EditClientModalProps {
  show: boolean;
  client: ClientFullDetails;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({
  show,
  client,
  onClose,
  onSuccess
}) => {
  const [editName, setEditName] = useState('');
  const [editDocumentId, setEditDocumentId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDefaultFrequency, setEditDefaultFrequency] = useState('DAILY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && client) {
      setEditName(client.name || '');
      setEditDocumentId(client.documentId || '');
      setEditPhone(client.phone || '');
      setEditAddress(client.address || '');
      setEditEmail(client.email || '');
      setEditDefaultFrequency(client.defaultFrequency || 'DAILY');
      setError('');
    }
  }, [show, client]);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiCall(`/clients/${client.id}`, {
        method: 'PUT',
        bodyData: {
          name: editName,
          documentId: editDocumentId,
          phone: editPhone,
          address: editAddress,
          email: editEmail || null,
          defaultFrequency: editDefaultFrequency
        }
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la información del cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Editar Información del Cliente</h3>
              <p className="text-xs text-slate-400">Actualizar datos de contacto y registro</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Documento / Cédula / NIT *</label>
            <input
              type="text"
              required
              value={editDocumentId}
              onChange={e => setEditDocumentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / Celular *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                  placeholder="opcional@email.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Clasificación / Periodicidad de Cobro *</label>
            <select
              value={editDefaultFrequency}
              onChange={e => setEditDefaultFrequency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            >
              <option value="DAILY">Diario (Lunes a Sábado)</option>
              <option value="WEEKLY">Semanal</option>
              <option value="BIWEEKLY">Quincenal</option>
              <option value="MONTHLY">Mensual</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Periodicidad habitual asignada a este cliente para segmentación y reportes.
            </span>
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
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 shadow-lg shadow-brand-600/20"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
