import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Search, User, Phone, MapPin, ChevronRight } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  documentId: string;
  phone: string;
  address: string;
  email: string | null;
  status: string;
  activeLoansCount: number;
  totalDebt: number;
}

interface ClientsProps {
  setCurrentPage: (page: string) => void;
  setSelectedClientId: (id: string) => void;
}

export const Clients: React.FC<ClientsProps> = ({ setCurrentPage, setSelectedClientId }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async (query = '') => {
    try {
      const data = await apiCall(`/clients${query ? `?search=${query}` : ''}`);
      setClients(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients(search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!name || !documentId || !phone || !address) {
      setFormError('Por favor complete todos los campos obligatorios.');
      setSubmitting(false);
      return;
    }

    try {
      await apiCall('/clients', {
        method: 'POST',
        bodyData: { name, documentId, phone, address, email }
      });
      
      // Reset form
      setName('');
      setDocumentId('');
      setPhone('');
      setAddress('');
      setEmail('');
      setIsModalOpen(false);
      fetchClients(search); // Refresh list
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectClient = (id: string) => {
    setSelectedClientId(id);
    setCurrentPage('client-detail');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            Clientes / Deudores
          </h1>
          <p className="text-slate-400 mt-1">Directorio principal de clientes de cartera.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-brand-500/20 transition duration-200"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-450 font-medium">No se encontraron clientes registrados.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-brand-400 hover:text-brand-300 font-semibold"
          >
            Crear el primer cliente ahora
          </button>
        </div>
      ) : (
        /* Clients Table */
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Nombre / Cédula</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">Dirección</th>
                    <th className="p-4 text-center">Créditos Activos</th>
                    <th className="p-4 text-right">Saldo Pendiente</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => handleSelectClient(client.id)}
                      className="hover:bg-slate-900/30 cursor-pointer transition group"
                    >
                      <td className="p-4">
                        <div className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                          {client.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          CC: {client.documentId}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                            {client.email}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-300 max-w-[220px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {client.address}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold leading-none ${
                            client.activeLoansCount > 0
                              ? 'bg-brand-500/10 text-brand-400'
                              : 'bg-slate-850 text-slate-500'
                          }`}
                        >
                          {client.activeLoansCount}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-200">
                        {client.totalDebt > 0 ? (
                          <span className="text-brand-400">
                            ${client.totalDebt.toLocaleString('es-CO')}
                          </span>
                        ) : (
                          <span className="text-slate-500">$0</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client.id)}
                className="glass-card p-4 rounded-xl border border-slate-800 active:border-brand-500 transition space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">{client.name}</h4>
                    <span className="text-xs text-slate-500 font-mono">CC: {client.documentId}</span>
                  </div>
                  {client.activeLoansCount > 0 ? (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {client.activeLoansCount} Activos
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-850 text-slate-500">
                      Sin Créditos
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-slate-850 text-xs text-slate-400">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-305">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {client.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 max-w-[180px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {client.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-550 block">Saldo Pendiente:</span>
                    {client.totalDebt > 0 ? (
                      <span className="font-mono font-bold text-sm text-brand-400">
                        ${client.totalDebt.toLocaleString('es-CO')}
                      </span>
                    ) : (
                      <span className="text-slate-500">$0</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 relative animate-zoomIn">
            <h3 className="text-xl font-bold text-white mb-4">Registrar Nuevo Cliente</h3>
            
            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Juan Pérez"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Cédula / NIT de Identificación *
                </label>
                <input
                  type="text"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  placeholder="ej: 1.032.456.789"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ej: 3123456789"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="opcional"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Dirección de Residencia / Cobro *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ej: Calle 45 # 12 - 34, Barrio Centro"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white font-semibold rounded-lg shadow-lg shadow-brand-500/10 transition"
                >
                  {submitting ? 'Guardando...' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
