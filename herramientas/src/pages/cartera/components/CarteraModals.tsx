import React from 'react';
import { LogIn, Save, X } from 'lucide-react';

interface CarteraModalsProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'guardar' | 'recuperar';
  nombreReporte: string;
  setNombreReporte: (v: string) => void;
  correo: string;
  setCorreo: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CarteraModals: React.FC<CarteraModalsProps> = ({
  isOpen, onClose, mode, nombreReporte, setNombreReporte, correo, setCorreo, password, setPassword, onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-navy-800 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-navy-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {mode === 'guardar' ? <Save className="w-5 h-5 text-brand-blue" /> : <LogIn className="w-5 h-5 text-brand-purple" />}
            {mode === 'guardar' ? 'Guardar mi Gestión' : 'Recuperar mi Gestión'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Reporte / Empresa</label>
            <input
              type="text"
              required
              value={nombreReporte}
              onChange={(e) => setNombreReporte(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="Ej: Reporte Mayo 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tu Correo Electrónico</label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tu Contraseña de Seguridad</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-navy-800 bg-white dark:bg-navy-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
            <p className="text-[10px] text-gray-500 mt-2 italic">
              * Esta contraseña es solo para proteger tus datos de gestión de cartera en nuestra nube. No la olvides, la necesitarás para recuperar tus datos.
            </p>
          </div>
          
          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all transform active:scale-95 mt-2 ${
              mode === 'guardar' 
              ? 'bg-gradient-to-r from-brand-blue to-blue-600 hover:shadow-blue-500/25' 
              : 'bg-gradient-to-r from-brand-purple to-purple-600 hover:shadow-purple-500/25'
            }`}
          >
            {mode === 'guardar' ? 'Guardar en la Nube' : 'Recuperar Datos'}
          </button>
        </form>
      </div>
    </div>
  );
};
