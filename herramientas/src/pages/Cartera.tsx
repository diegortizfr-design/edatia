import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, Check, ChevronRight, ChevronDown, FoldVertical, UnfoldVertical, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import * as XLSX from 'xlsx';

// Modulares
import { CarteraItem, BUCKETS, ALL_COLUMNS, calcularSaldo, getBucketValue, formatCOP } from './cartera/types';
import { CarteraStats } from './cartera/components/CarteraStats';
import { CarteraModals } from './cartera/components/CarteraModals';
import { CarteraToolbar } from './cartera/components/CarteraToolbar';

export default function Cartera() {
  const [items, setItems] = useState<CarteraItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'guardar' | 'recuperar'>('guardar');
  const [correo, setCorreo] = useState('');
  const [nombreReporte, setNombreReporte] = useState('');
  const [password, setPassword] = useState('');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [filtroCiudad, setFiltroCiudad] = useState('Todas');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Auto-cargar del LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('edatia_cartera_temp');
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch (e) { console.error('Error parsing local storage data'); }
    }
    const savedCols = localStorage.getItem('edatia_cartera_cols');
    if (savedCols) {
      try { setVisibleColumns(JSON.parse(savedCols)); } catch (e) { setVisibleColumns(ALL_COLUMNS.map(c => c.id)); }
    } else {
      setVisibleColumns(ALL_COLUMNS.map(c => c.id));
    }
  }, []);

  // Guardar en LocalStorage cada que cambia
  useEffect(() => {
    localStorage.setItem('edatia_cartera_temp', JSON.stringify(items));
  }, [items]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Mapeo inteligente (ejemplo simplificado)
        const mapped = data.map((row: any, idx) => ({
          id: String(idx + Date.now()),
          nit: String(row['NIT'] || row['Nit'] || row['nit'] || ''),
          fechaCreacionCliente: row['Fecha Creación'] || row['Fecha Creacion'] || '',
          cliente: row['Cliente'] || row['Nombre'] || 'Sin Nombre',
          ciudad: row['Ciudad'] || '',
          vendedor: row['Vendedor'] || '',
          responsable: row['Responsable'] || '',
          terminoPago: String(row['Término Pago'] || row['Termino'] || '0'),
          factura: String(row['Factura'] || row['Nro'] || ''),
          fechaFactura: row['Fecha Factura'] || row['Fecha'] || '',
          fechaVencimiento: row['Fecha Vencimiento'] || row['Vencimiento'] || '',
          valorFactura: Number(row['Valor Factura'] || row['Valor'] || 0),
          pagoAbono: Number(row['Pago/Abono'] || row['Abono'] || 0),
          contactos: row['Contactos'] || '',
          telefono: String(row['Teléfono'] || row['Telefono'] || ''),
          fechaPago: row['Fecha Pago'] || '',
          observacion1: row['Observación 1'] || '',
          observacion2: row['Observación 2'] || '',
        }));
        
        setItems(mapped);
        toast.success('Datos procesados y limpiados correctamente');
      } catch (error) {
        toast.error('Error al importar el archivo');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password || !nombreReporte) {
      toast.error('Por favor ingresa nombre, correo y contraseña');
      return;
    }

    try {
      if (modalMode === 'guardar') {
        await axios.post('/api/v1/herramientas/cartera/guardar', {
          nombre: nombreReporte, correo, password, datosJson: items,
        });
        toast.success('Gestión de cartera guardada correctamente');
      } else {
        const res = await axios.post('/api/v1/herramientas/cartera/recuperar', {
          nombre: nombreReporte, correo, password,
        });
        setItems([]);
        setTimeout(() => {
          const recoveredData = res.data.datosJson || [];
          setItems(recoveredData);
          setDiasRestantes(res.data.diasRestantes);
          localStorage.setItem('edatia_cartera_temp', JSON.stringify(recoveredData));
          toast.success(`¡Éxito! Se han recuperado ${recoveredData.length} registros.`);
        }, 100);
      }
      setIsModalOpen(false);
      setPassword('');
      if (modalMode === 'recuperar') setHasActiveSession(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error en la operación';
      toast.error(message);
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(items);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cartera");
    XLSX.writeFile(wb, `Cartera_Edatia_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleClear = () => {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos? Esta acción no se puede deshacer.')) {
      setItems([]);
      localStorage.removeItem('edatia_cartera_temp');
      toast.success('Datos limpiados');
    }
  };

  const stats = useMemo(() => {
    const filtered = filtroCiudad === 'Todas' ? items : items.filter(it => it.ciudad === filtroCiudad);
    const total = filtered.reduce((acc, curr) => acc + calcularSaldo(curr.valorFactura, curr.pagoAbono), 0);
    const bucketsTotals = BUCKETS.map(b => ({
      label: b.label,
      value: filtered.reduce((acc, curr) => acc + getBucketValue(curr, b), 0)
    }));
    return {
      total,
      buckets: bucketsTotals.map(b => ({ ...b, percent: total > 0 ? (b.value / total) * 100 : 0 }))
    };
  }, [items, filtroCiudad]);

  const ciudades = useMemo(() => {
    const set = new Set(items.map(it => it.ciudad).filter(Boolean));
    return ['Todas', ...Array.from(set)];
  }, [items]);

  const groupedItems = useMemo(() => {
    let filtered = items.filter(it => filtroCiudad === 'Todas' || it.ciudad === filtroCiudad);
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof CarteraItem] || '';
        let bVal = b[sortConfig.key as keyof CarteraItem] || '';
        if (typeof aVal === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        const sa = String(aVal).toLowerCase(); const sb = String(bVal).toLowerCase();
        if (sa < sb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (sa > sb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    const groups: Record<string, { records: CarteraItem[]; total: number; buckets: number[] }> = {};
    filtered.forEach(item => {
      const key = item.cliente || 'Sin Cliente';
      if (!groups[key]) groups[key] = { records: [], total: 0, buckets: [0, 0, 0, 0] };
      groups[key].records.push(item);
      groups[key].total += calcularSaldo(item.valorFactura, item.pagoAbono);
      BUCKETS.forEach((b, i) => { groups[key].buckets[i] += getBucketValue(item, b); });
    });
    let result = Object.entries(groups).map(([cliente, data]) => ({ cliente, ...data }));
    if (sortConfig && (sortConfig.key === 'cliente' || sortConfig.key === 'valorFactura')) {
      result.sort((a, b) => {
        const aVal = sortConfig.key === 'cliente' ? a.cliente : a.total;
        const bVal = sortConfig.key === 'cliente' ? b.cliente : b.total;
        if (typeof aVal === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        const sa = String(aVal).toLowerCase(); const sb = String(bVal).toLowerCase();
        if (sa < sb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (sa > sb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (!sortConfig) { result.sort((a, b) => b.total - a.total); }
    return result;
  }, [items, filtroCiudad, sortConfig]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {diasRestantes !== null && (
        <div className="bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <p><strong>Periodo de prueba activo:</strong> Te quedan {diasRestantes} días para seguir usando esta herramienta de forma gratuita.</p>
          <button onClick={() => setDiasRestantes(null)} className="text-brand-indigo hover:text-brand-indigo/80"><X className="w-5 h-5" /></button>
        </div>
      )}

      <CarteraToolbar 
        filtroCiudad={filtroCiudad} setFiltroCiudad={setFiltroCiudad} ciudades={ciudades}
        onImport={handleImport} onExport={handleExport} onClear={handleClear}
        onOpenModal={(m) => { setModalMode(m); setIsModalOpen(true); }}
        onOpenColumnMenu={() => setIsColumnMenuOpen(true)}
        hasActiveSession={hasActiveSession} onLogout={() => setHasActiveSession(false)}
        correo={correo}
      />

      <CarteraStats stats={stats} />

      {/* Grid de Cartera */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-xl border border-gray-100 dark:border-navy-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             {/* ... La tabla sigue aquí, pero el archivo es mucho más manejable ... */}
             <thead>
               <tr className="bg-gray-50/50 dark:bg-navy-800/50 border-b border-gray-100 dark:border-navy-800">
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest w-10"></th>
                 {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => (
                   <th key={col.id} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                     {col.label}
                   </th>
                 ))}
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50 dark:divide-navy-800">
               {groupedItems.map(group => (
                 <React.Fragment key={group.cliente}>
                   <tr className="bg-gray-50/30 dark:bg-navy-800/20 hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors group cursor-pointer"
                       onClick={() => setExpandedGroups(prev => prev.includes(group.cliente) ? prev.filter(c => c !== group.cliente) : [...prev, group.cliente])}>
                     <td className="p-4">
                        {expandedGroups.includes(group.cliente) ? <ChevronDown className="w-4 h-4 text-brand-blue" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                     </td>
                     {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => (
                       <td key={col.id} className="p-4 font-bold text-sm text-gray-900 dark:text-white">
                         {col.id === 'cliente' ? group.cliente : 
                          col.id === 'total' ? formatCOP(group.total) : 
                          col.id.startsWith('bucket_') ? formatCOP(group.buckets[BUCKETS.findIndex(b => b.label === col.label)] || 0) : '-'}
                       </td>
                     ))}
                   </tr>
                   {expandedGroups.includes(group.cliente) && group.records.map(rec => (
                     <tr key={rec.id} className="hover:bg-blue-50/30 dark:hover:bg-brand-blue/5 transition-colors border-l-4 border-transparent hover:border-brand-blue">
                       <td className="p-4"></td>
                       {ALL_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => (
                         <td key={col.id} className="p-4 text-sm text-gray-600 dark:text-gray-400">
                           {col.id === 'total' ? formatCOP(calcularSaldo(rec.valorFactura, rec.pagoAbono)) : 
                            col.id.startsWith('bucket_') ? formatCOP(getBucketValue(rec, BUCKETS[BUCKETS.findIndex(b => b.label === col.label)])) :
                            String(rec[col.id as keyof CarteraItem] || '')}
                         </td>
                       ))}
                     </tr>
                   ))}
                 </React.Fragment>
               ))}
             </tbody>
          </table>
        </div>
      </div>

      <CarteraModals 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} mode={modalMode}
        nombreReporte={nombreReporte} setNombreReporte={setNombreReporte}
        correo={correo} setCorreo={setCorreo}
        password={password} setPassword={setPassword}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
