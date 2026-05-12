import React, { useState, useEffect, useMemo } from 'react';
import { Save, Download, Upload, Plus, Trash2, LogIn, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import * as XLSX from 'xlsx';

// Tipos
interface CarteraItem {
  id: string;
  nit: string;
  fechaCreacionCliente: string;
  cliente: string;
  ciudad: string;
  vendedor: string;
  responsable: string;
  terminoPago: string; // días
  factura: string;
  fechaFactura: string; // YYYY-MM-DD
  fechaVencimiento: string;
  valorFactura: number;
  pagoAbono: number;
  contactos: string;
  telefono: string;
  fechaPago: string;
  observacion1: string;
  observacion2: string;
}

const BUCKETS = [
  { label: '0 - 30 días', min: 0, max: 30 },
  { label: '31 - 60 días', min: 31, max: 60 },
  { label: '61 - 90 días', min: 61, max: 90 },
  { label: '91 días o más', min: 91, max: 999999 },
];

export default function Cartera() {
  const [items, setItems] = useState<CarteraItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'guardar' | 'recuperar'>('guardar');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [filtroCiudad, setFiltroCiudad] = useState('Todas');

  // Auto-cargar del LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('edatia_cartera_temp');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing local storage data');
      }
    }
  }, []);

  // Guardar en LocalStorage cada que cambia
  useEffect(() => {
    localStorage.setItem('edatia_cartera_temp', JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    const newItem: CarteraItem = {
      id: crypto.randomUUID(),
      nit: '',
      fechaCreacionCliente: '',
      cliente: '',
      ciudad: '',
      vendedor: '',
      responsable: '',
      terminoPago: '30',
      factura: '',
      fechaFactura: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      valorFactura: 0,
      pagoAbono: 0,
      contactos: '',
      telefono: '',
      fechaPago: '',
      observacion1: '',
      observacion2: '',
    };
    setItems([newItem, ...items]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof CarteraItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const calcularEdad = (fechaFactura: string) => {
    if (!fechaFactura) return 0;
    const date1 = new Date(fechaFactura);
    const date2 = new Date();
    // Reset hours to compare only days
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    const diffTime = date2.getTime() - date1.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calcularDiasVencidos = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return 0;
    const date1 = new Date(fechaVencimiento);
    const date2 = new Date();
    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);
    const diffTime = date2.getTime() - date1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getBucketValue = (item: CarteraItem, bucket: typeof BUCKETS[0]) => {
    const edad = calcularEdad(item.fechaFactura);
    const saldo = (item.valorFactura || 0) - (item.pagoAbono || 0);
    if (edad >= bucket.min && edad <= bucket.max) {
      return saldo;
    }
    return 0;
  };

  const calcularSaldo = (valor: number, abono: number) => {
    return (valor || 0) - (abono || 0);
  };

  const handleExport = () => {
    const filteredItems = filtroCiudad === 'Todas' ? items : items.filter(it => it.ciudad === filtroCiudad);
    
    const dataToExport = filteredItems.map((item) => ({
      'NIT': item.nit,
      'Fecha creación cliente': item.fechaCreacionCliente,
      'Cliente': item.cliente,
      'Ciudad': item.ciudad,
      'Nombre vendedor': item.vendedor,
      'Término de pago': item.terminoPago,
      'Factura': item.factura,
      'Fecha Factura': item.fechaFactura,
      'Fecha de vencimiento': item.fechaVencimiento,
      'Saldo 0 - 30 días': getBucketValue(item, BUCKETS[0]),
      'Saldo 31 - 60 días': getBucketValue(item, BUCKETS[1]),
      'Saldo 61 - 90 días': getBucketValue(item, BUCKETS[2]),
      'Saldo 91 días o más': getBucketValue(item, BUCKETS[3]),
      'Total': calcularSaldo(item.valorFactura, item.pagoAbono),
      'Días en cartera': calcularEdad(item.fechaFactura),
      'Días vencidos': calcularDiasVencidos(item.fechaVencimiento),
      'Responsable': item.responsable,
      'Teléfono': item.telefono,
      'Fecha de pago': item.fechaPago,
      'Observaciones 1': item.observacion1,
      'Observaciones 2': item.observacion2,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cartera');
    
    // Add styling/totals could be complex with XLSX basic, but let's at least keep columns
    XLSX.writeFile(workbook, `Gestion_Cartera_${filtroCiudad}.xlsx`);
    toast.success('Archivo exportado correctamente');
  };

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

        const importedItems: CarteraItem[] = data.map((row: any) => ({
          id: crypto.randomUUID(),
          nit: row['NIT'] || '',
          fechaCreacionCliente: row['Fecha creación cliente'] || '',
          cliente: row['Cliente'] || '',
          ciudad: row['Ciudad'] || '',
          vendedor: row['Nombre vendedor'] || '',
          responsable: row['Responsable'] || '',
          terminoPago: row['Término de pago'] || '30',
          factura: row['Factura'] || '',
          fechaFactura: row['Fecha Factura'] || new Date().toISOString().split('T')[0],
          fechaVencimiento: row['Fecha de vencimiento'] || '',
          valorFactura: Number(row['Valor de factura'] || row['Total'] || 0),
          pagoAbono: 0, // Generalmente se importa el saldo
          contactos: '',
          telefono: row['Teléfono'] || '',
          fechaPago: row['Fecha de pago'] || '',
          observacion1: row['Observaciones 1'] || '',
          observacion2: row['Observaciones 2'] || '',
        }));

        setItems([...importedItems, ...items]);
        toast.success('Datos importados correctamente');
      } catch (error) {
        toast.error('Error al importar el archivo');
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password) {
      toast.error('Por favor ingresa correo y contraseña');
      return;
    }

    try {
      if (modalMode === 'guardar') {
        await axios.post('/api/herramientas/cartera/guardar', {
          correo,
          password,
          datosJson: items,
        });
        toast.success('Gestión de cartera guardada correctamente');
      } else {
        const res = await axios.post('/api/herramientas/cartera/recuperar', {
          correo,
          password,
        });
        setItems(res.data.datosJson || []);
        setDiasRestantes(res.data.diasRestantes);
        toast.success(`Datos recuperados. Te quedan ${res.data.diasRestantes} días de prueba.`);
      }
      setIsModalOpen(false);
      setCorreo('');
      setPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error en la operación');
    }
  };

  const openModal = (mode: 'guardar' | 'recuperar') => {
    setModalMode(mode);
    setIsModalOpen(true);
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
      buckets: bucketsTotals.map(b => ({
        ...b,
        percent: total > 0 ? (b.value / total) * 100 : 0
      }))
    };
  }, [items, filtroCiudad]);

  const ciudadas = useMemo(() => {
    const set = new Set(items.map(it => it.ciudad).filter(Boolean));
    return ['Todas', ...Array.from(set)];
  }, [items]);

  const groupedItems = useMemo(() => {
    const filtered = filtroCiudad === 'Todas' ? items : items.filter(it => it.ciudad === filtroCiudad);
    const groups: Record<string, CarteraItem[]> = {};
    
    filtered.forEach(item => {
      const key = item.cliente || 'Sin Cliente';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups).map(([cliente, records]) => ({
      cliente,
      records,
      total: records.reduce((acc, curr) => acc + calcularSaldo(curr.valorFactura, curr.pagoAbono), 0),
      buckets: BUCKETS.map(b => records.reduce((acc, curr) => acc + getBucketValue(curr, b), 0))
    })).sort((a, b) => b.total - a.total);
  }, [items, filtroCiudad]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {diasRestantes !== null && (
        <div className="bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <p>
            <strong>Periodo de prueba activo:</strong> Te quedan {diasRestantes} días para seguir usando esta herramienta de forma gratuita.
          </p>
          <button onClick={() => setDiasRestantes(null)} className="text-brand-indigo hover:text-brand-indigo/80">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

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
              {ciudadas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImport}
              title="Importar Excel/CSV"
            />
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-navy-600 font-medium text-sm">
              <Upload className="w-4 h-4" /> Importar
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-navy-600 font-medium text-sm"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => openModal('guardar')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-indigo hover:bg-brand-indigo/90 text-white rounded-lg transition-colors font-medium text-sm shadow-glow-brand"
          >
            <Save className="w-4 h-4" /> Guardar gestión
          </button>
          <button
            onClick={() => openModal('recuperar')}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white border border-brand-indigo/30 rounded-lg transition-colors font-medium text-sm"
          >
            <LogIn className="w-4 h-4" /> Continuar gestión
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Saldo Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.total.toLocaleString()}</p>
          <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-navy-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-indigo w-full"></div>
          </div>
        </div>
        {stats.buckets.map((b, i) => (
          <div key={i} className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-navy-800 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase">{b.label}</p>
              <span className="text-[10px] font-bold bg-gray-100 dark:bg-navy-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                {b.percent.toFixed(1)}%
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">${b.value.toLocaleString()}</p>
            <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-navy-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : i === 2 ? 'bg-orange-500' : 'bg-red-500'}`} 
                style={{ width: `${b.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-navy-800 flex justify-between items-center bg-gray-50/50 dark:bg-navy-950/50">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            Registros de Cartera
            <span className="bg-brand-blue/10 text-brand-blue text-xs px-2 py-0.5 rounded-full">{items.length}</span>
          </h2>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-md text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar Registro
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-navy-950/50 uppercase font-bold border-b border-gray-200 dark:border-navy-800">
              <tr>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">NIT</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Fecha Creación</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Cliente</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Vendedor</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Término</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Factura</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Fecha Fact.</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Vencimiento</th>
                {BUCKETS.map((b, i) => (
                  <th key={i} className="px-2 py-3 whitespace-nowrap text-right border-r border-gray-200 dark:border-navy-800 bg-brand-blue/5">
                    {b.label}
                  </th>
                ))}
                <th className="px-2 py-3 whitespace-nowrap text-right border-r border-gray-200 dark:border-navy-800 font-bold bg-gray-100 dark:bg-navy-950">Total</th>
                <th className="px-2 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-navy-800">Días Cartera</th>
                <th className="px-2 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-navy-800">Días Vencidos</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Responsable</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Teléfono</th>
                <th className="px-2 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-navy-800">Pago</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Fecha Pago</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Obs 1</th>
                <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Obs 2</th>
                <th className="px-2 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-800">
              {groupedItems.length === 0 ? (
                <tr>
                  <td colSpan={25} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No hay registros en tu cartera. Agrega uno nuevo o importa un archivo.
                  </td>
                </tr>
              ) : (
                groupedItems.map((group) => (
                  <React.Fragment key={group.cliente}>
                    {group.records.map((item) => {
                      const edad = calcularEdad(item.fechaFactura);
                      const diasVencidos = calcularDiasVencidos(item.fechaVencimiento);
                      const saldo = calcularSaldo(item.valorFactura, item.pagoAbono);
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition-colors group">
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.nit}
                              onChange={(e) => updateItem(item.id, 'nit', e.target.value)}
                              placeholder="NIT"
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.fechaCreacionCliente}
                              onChange={(e) => updateItem(item.id, 'fechaCreacionCliente', e.target.value)}
                              placeholder="dd/mm/aaaa"
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.cliente}
                              onChange={(e) => updateItem(item.id, 'cliente', e.target.value)}
                              placeholder="Cliente"
                              className="w-full min-w-[140px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 font-medium"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.vendedor}
                              onChange={(e) => updateItem(item.id, 'vendedor', e.target.value)}
                              placeholder="Vendedor"
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="number"
                              value={item.terminoPago}
                              onChange={(e) => updateItem(item.id, 'terminoPago', e.target.value)}
                              className="w-12 bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 text-center"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.factura}
                              onChange={(e) => updateItem(item.id, 'factura', e.target.value)}
                              placeholder="Factura"
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 font-mono"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="date"
                              value={item.fechaFactura}
                              onChange={(e) => updateItem(item.id, 'fechaFactura', e.target.value)}
                              className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 w-[110px]"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="date"
                              value={item.fechaVencimiento}
                              onChange={(e) => updateItem(item.id, 'fechaVencimiento', e.target.value)}
                              className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 w-[110px]"
                            />
                          </td>
                          {BUCKETS.map((b, i) => {
                            const val = getBucketValue(item, b);
                            return (
                              <td key={i} className="px-2 py-1 text-right border-r border-gray-100 dark:border-navy-800">
                                {val > 0 ? `$${val.toLocaleString()}` : '-'}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1 text-right border-r border-gray-100 dark:border-navy-800 font-bold bg-gray-50/30 dark:bg-navy-950/30">
                            <input
                              type="number"
                              value={item.valorFactura || ''}
                              onChange={(e) => updateItem(item.id, 'valorFactura', e.target.value)}
                              className="w-full bg-transparent border-0 text-right focus:ring-1 focus:ring-brand-blue rounded px-1"
                            />
                          </td>
                          <td className="px-2 py-1 text-center border-r border-gray-100 dark:border-navy-800">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${edad > 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                              {edad}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center border-r border-gray-100 dark:border-navy-800">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${diasVencidos > 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-700'}`}>
                              {diasVencidos}
                            </span>
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.responsable}
                              onChange={(e) => updateItem(item.id, 'responsable', e.target.value)}
                              placeholder="Responsable"
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.telefono}
                              onChange={(e) => updateItem(item.id, 'telefono', e.target.value)}
                              placeholder="Tel"
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-2 py-1 text-center border-r border-gray-100 dark:border-navy-800">
                            <button 
                              onClick={() => updateItem(item.id, 'pagoAbono', item.pagoAbono === item.valorFactura ? 0 : item.valorFactura)}
                              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                item.pagoAbono >= item.valorFactura && item.valorFactura > 0 
                                  ? 'bg-green-500 border-green-600 text-white' 
                                  : 'border-gray-300 dark:border-navy-700'
                              }`}
                            >
                              {item.pagoAbono >= item.valorFactura && item.valorFactura > 0 ? '✓' : ''}
                            </button>
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="date"
                              value={item.fechaPago}
                              onChange={(e) => updateItem(item.id, 'fechaPago', e.target.value)}
                              className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 w-[110px]"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.observacion1}
                              onChange={(e) => updateItem(item.id, 'observacion1', e.target.value)}
                              placeholder="..."
                              className="w-full min-w-[100px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                            <input
                              type="text"
                              value={item.observacion2}
                              onChange={(e) => updateItem(item.id, 'observacion2', e.target.value)}
                              placeholder="..."
                              className="w-full min-w-[100px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5"
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Fila de Totales del Grupo */}
                    <tr className="bg-brand-blue/5 font-bold text-brand-blue">
                      <td colSpan={8} className="px-2 py-2 text-right uppercase italic">Total {group.cliente}:</td>
                      {group.buckets.map((val, i) => (
                        <td key={i} className="px-2 py-2 text-right border-r border-brand-blue/10">
                          ${val.toLocaleString()}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-right border-r border-brand-blue/10 bg-brand-blue/10">
                        ${group.total.toLocaleString()}
                      </td>
                      <td colSpan={9}></td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
            {groupedItems.length > 0 && (
              <tfoot className="bg-gray-900 text-white font-bold sticky bottom-0">
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-right uppercase tracking-wider">Total General:</td>
                  {stats.buckets.map((b, i) => (
                    <td key={i} className="px-2 py-3 text-right">${b.value.toLocaleString()}</td>
                  ))}
                  <td className="px-2 py-3 text-right bg-brand-indigo">${stats.total.toLocaleString()}</td>
                  <td colSpan={9}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL GUARDAR / RECUPERAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-navy-700 animate-fade-in overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-navy-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {modalMode === 'guardar' ? 'Guardar tu Gestión' : 'Continuar tu Gestión'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {modalMode === 'guardar'
                  ? 'Ingresa tu correo y crea una contraseña para asegurar tus datos. Tienes 3 meses de uso gratuito.'
                  : 'Ingresa el correo y contraseña con el que guardaste tu gestión previamente para retomarla.'}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-navy-950 border border-gray-300 dark:border-navy-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    placeholder="empresa@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-navy-950 border border-gray-300 dark:border-navy-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-brand-indigo hover:bg-brand-indigo/90 text-white rounded-lg transition-colors shadow-glow-brand"
                >
                  {modalMode === 'guardar' ? 'Guardar Datos Seguros' : 'Recuperar Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
