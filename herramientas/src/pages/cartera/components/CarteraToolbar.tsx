import React from 'react';
import { Download, Upload, Plus, Trash2, LogIn, Save, Settings2 } from 'lucide-react';

interface CarteraToolbarProps {
  filtroCiudad: string;
  setFiltroCiudad: (v: string) => void;
  ciudades: string[];
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onClear: () => void;
  onOpenModal: (mode: 'guardar' | 'recuperar') => void;
  onOpenColumnMenu: () => void;
  hasActiveSession: boolean;
  onLogout: () => void;
  correo: string;
}

export const CarteraToolbar: React.FC<CarteraToolbarProps> = ({
  filtroCiudad, setFiltroCiudad, ciudades, onImport, onExport, onClear, onOpenModal, onOpenColumnMenu, hasActiveSession, onLogout, correo
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple">
          Análisis de Cartera (Aging)
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Control integral de cuentas por cobrar y antigüedad.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-4 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase">Filtrar Ciudad:</span>
          <select 
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
            className="bg-transparent border-0 text-sm font-medium focus:ring-0 cursor-pointer"
          >
            {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button 
          onClick={onOpenColumnMenu}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800 transition-all shadow-sm"
        >
          <Settings2 className="w-4 h-4" />
          <span className="text-sm font-semibold">Columnas</span>
        </button>

        <label className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 cursor-pointer transition-all shadow-lg shadow-blue-500/20 active:scale-95">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-semibold">Importar Excel</span>
          <input type="file" accept=".xlsx,.xls" onChange={onImport} className="hidden" />
        </label>

        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-semibold">Exportar</span>
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-navy-800 mx-1"></div>

        {!hasActiveSession ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onOpenModal('recuperar')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy-900 border border-brand-purple/30 text-brand-purple rounded-xl hover:bg-brand-purple/5 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-semibold">Recuperar</span>
            </button>
            <button 
              onClick={() => onOpenModal('guardar')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-xl hover:bg-brand-purple/90 transition-all shadow-lg shadow-purple-500/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-semibold">Guardar Nube</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-brand-purple tracking-tighter">Sesión Activa</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 max-w-[120px] truncate">{correo}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
              title="Cerrar Sesión"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <button 
          onClick={onClear}
          className="p-2.5 bg-gray-100 dark:bg-navy-800 text-gray-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95"
          title="Limpiar Datos Locales"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
