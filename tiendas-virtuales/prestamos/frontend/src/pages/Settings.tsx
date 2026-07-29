import React, { useState, useEffect } from 'react';
import { 
  Building, Percent, Users, Save, CheckCircle2, AlertCircle, 
  ShieldCheck, DollarSign, RefreshCw, Calendar, Phone, MapPin, Mail, CreditCard, Sparkles, Check, Coins 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'portfolio' | 'users'>('basic');

  // Basic Info Form State
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Portfolio / Capital & Late Interest Settings State
  const [initialCapital, setInitialCapital] = useState<number | string>(0);
  const [lateInterestEnabled, setLateInterestEnabled] = useState(false);
  const [lateInterestRate, setLateInterestRate] = useState<number>(0);
  const [lateInterestPeriod, setLateInterestPeriod] = useState<string>('MONTHLY');

  // UI Feedback States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch('/api/tenant/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setNit(data.nit || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setInitialCapital(data.initialCapital || 0);
        setLateInterestEnabled(Boolean(data.lateInterestEnabled));
        setLateInterestRate(data.lateInterestRate || 0);
        setLateInterestPeriod(data.lateInterestPeriod || 'MONTHLY');
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setMessage(null);
    setSaving(true);

    try {
      const res = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          nit,
          email,
          phone,
          address,
          initialCapital: Number(initialCapital) || 0,
          lateInterestEnabled,
          lateInterestRate: Number(lateInterestRate),
          lateInterestPeriod
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar la configuración.' });
      }
    } catch (err) {
      console.error('Error al actualizar configuración:', err);
      setMessage({ type: 'error', text: 'Ocurrió un error de conexión.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
          <span className="text-sm font-medium">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-400" />
            Configuración General
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Administra los datos de la empresa, parámetros financieros de cartera e interés de mora
          </p>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'basic'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Building className="w-4 h-4" />
          Información Básica
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'portfolio'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Percent className="w-4 h-4" />
          Cartera & Mora
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-brand-500 text-brand-400 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios & Roles
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">Próximamente</span>
        </button>
      </div>

      {/* Tab 1: Información Básica */}
      {activeTab === 'basic' && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-400" />
              Perfil de la Empresa Prestamista
            </h3>
            <p className="text-xs text-slate-400">
              Datos oficiales de la empresa que aparecerán en los recibos de caja y estados de cuenta de los clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Nombre de la Empresa / Prestamista *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
                placeholder="Ej: Inversiones & Créditos S.A.S."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                NIT o Documento de Identificación *
              </label>
              <input
                type="text"
                value={nit}
                onChange={e => setNit(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
                placeholder="Ej: 900.123.456-7"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Teléfono / Celular de Contacto
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
                placeholder="Ej: 3001234567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Dirección Principal de Oficina / Sede
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
                placeholder="Ej: Calle 45 # 23-10, Oficina 302"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-800 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Información'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Cartera & Mora */}
      {activeTab === 'portfolio' && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Coins className="w-4 h-4 text-brand-400" />
              Capital Base y Configuración de Cartera
            </h3>
            <p className="text-xs text-slate-400">
              Configura el monto de dinero inicial asignado para préstamos y los parámetros de mora
            </p>
          </div>

          {/* Capital Base Box */}
          <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600/10 border border-brand-500/20 rounded-xl flex items-center justify-center text-brand-400 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">Capital Inicial / Base para Préstamos ($)</span>
                <span className="text-xs text-slate-400 block">
                  Monto total disponible o dispuesto para la rotación y colocación de créditos
                </span>
              </div>
            </div>

            <div className="max-w-md pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monto de Capital Inicial ($) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={initialCapital}
                  onChange={e => setInitialCapital(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white font-mono font-semibold focus:outline-none focus:border-brand-500 transition"
                  placeholder="Ej: 10000000"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Este capital base sirve para calcular la rotación, el disponible y los indicadores financieros de tu cartera.
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Percent className="w-4 h-4 text-brand-400" />
              Parámetros de Interés de Mora
            </h4>
            <p className="text-xs text-slate-400">
              Define las reglas automáticas para el cálculo de penalizaciones por retraso en el pago de cuotas
            </p>
          </div>

          {/* Business Rule Notice Banner */}
          <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-brand-300">
              <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Regla Financiera de Mora</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              El porcentaje de interés de mora se calcula <strong>únicamente sobre el monto en mora</strong> (saldo adeudado de las cuotas cuya fecha límite haya vencido). <strong>Nunca</strong> se aplicará mora sobre cuotas futuras ni sobre el saldo completo del crédito a tiempo.
            </p>
          </div>

          {/* Toggle Checkbox */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                lateInterestEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
              }`}>
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm block">Activar Cobro de Interés de Mora</span>
                <span className="text-xs text-slate-400 block">
                  {lateInterestEnabled 
                    ? 'El sistema calculará automáticamente la mora sobre las cuotas atrasadas al momento de cobrar.' 
                    : 'Cobro de mora desactivado. Solo se cobrará el valor estándar de las cuotas.'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={lateInterestEnabled}
                onChange={e => setLateInterestEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Form Fields for Rate & Period */}
          {lateInterestEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-brand-400" />
                  Porcentaje de Interés de Mora (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={lateInterestRate}
                    onChange={e => setLateInterestRate(parseFloat(e.target.value) || 0)}
                    required={lateInterestEnabled}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition pr-8"
                    placeholder="Ej: 5.0"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-sm">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Porcentaje aplicado sobre las cuotas en atraso.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  Frecuencia de Aplicación *
                </label>
                <select
                  value={lateInterestPeriod}
                  onChange={e => setLateInterestPeriod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 transition"
                >
                  <option value="DAILY">Diario (Recargo por cada día de mora)</option>
                  <option value="MONTHLY">Mensual (Recargo fijo mensual sobre la mora)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Modalidad de cálculo según el período de retraso.
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-800 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Configuración de Mora'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Usuarios (Placeholder UI) */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-brand-600/20 text-brand-400 rounded-2xl flex items-center justify-center mx-auto border border-brand-500/30">
            <Users className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> En Preparación Próximamente
            </span>
            <h3 className="text-xl font-bold text-white">Gestión de Usuarios y Roles</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              En esta sección podrás registrar usuarios secundarios con roles diferenciados: Administradores, Supervisores de Cartera, Cobradores de Ruta y Cajeros con permisos independientes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Check className="w-4 h-4 text-brand-400" /> Cobradores
              </div>
              <p className="text-[11px] text-slate-400">Acceso exclusivo a la Ruta del Día asignada para cobros en calle.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Check className="w-4 h-4 text-brand-400" /> Supervisores
              </div>
              <p className="text-[11px] text-slate-400">Aprobación de créditos y monitoreo de cobradores y arqueos.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Check className="w-4 h-4 text-brand-400" /> Cajeros
              </div>
              <p className="text-[11px] text-slate-400">Recepción de abonos en oficina e impresión de comprobantes.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
