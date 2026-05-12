import React, { useState, useEffect, useMemo } from 'react';
import { Save, Download, Upload, Plus, Trash2, LogIn, X, Settings2, Check, ChevronRight, ChevronDown, FoldVertical, UnfoldVertical } from 'lucide-react';
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

const ALL_COLUMNS = [
  { id: 'nit', label: 'NIT' },
  { id: 'fechaCreacionCliente', label: 'Fecha Creación' },
  { id: 'cliente', label: 'Cliente' },
  { id: 'vendedor', label: 'Vendedor' },
  { id: 'terminoPago', label: 'Término' },
  { id: 'factura', label: 'Factura' },
  { id: 'fechaFactura', label: 'Fecha Fact.' },
  { id: 'fechaVencimiento', label: 'Vencimiento' },
  { id: 'bucket_0_30', label: '0 - 30 días' },
  { id: 'bucket_31_60', label: '31 - 60 días' },
  { id: 'bucket_61_90', label: '61 - 90 días' },
  { id: 'bucket_91_plus', label: '91 días o más' },
  { id: 'total', label: 'Total' },
  { id: 'dias_cartera', label: 'Días Cartera' },
  { id: 'dias_vencidos', label: 'Días Vencidos' },
  { id: 'responsable', label: 'Responsable' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'pago', label: 'Pago' },
  { id: 'fechaPago', label: 'Fecha Pago' },
  { id: 'observacion1', label: 'Obs 1' },
  { id: 'observacion2', label: 'Obs 2' },
];

export default function Cartera() {
  const [items, setItems] = useState<CarteraItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'guardar' | 'recuperar'>('guardar');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
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
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing local storage data');
      }
    }

    const savedCols = localStorage.getItem('edatia_cartera_cols');
    if (savedCols) {
      try {
        setVisibleColumns(JSON.parse(savedCols));
      } catch (e) {
        setVisibleColumns(ALL_COLUMNS.map(c => c.id));
      }
    } else {
      setVisibleColumns(ALL_COLUMNS.map(c => c.id));
    }
  }, []);

  // Guardar en LocalStorage cada que cambia
  useEffect(() => {
    localStorage.setItem('edatia_cartera_temp', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (visibleColumns.length > 0) {
      localStorage.setItem('edatia_cartera_cols', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const isVisible = (id: string) => visibleColumns.includes(id);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleGroup = (cliente: string) => {
    setExpandedGroups(prev => 
      prev.includes(cliente) ? prev.filter(c => c !== cliente) : [...prev, cliente]
    );
  };

  const expandAll = () => setExpandedGroups(groupedItems.map(g => g.cliente));
  const collapseAll = () => setExpandedGroups([]);

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
    setItems(items.filter((it) => it.id !== id));
  };

  const clearItems = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODOS los registros? Esta acción no se puede deshacer.')) {
      setItems([]);
      toast.success('Tabla limpiada correctamente');
    }
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
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Limpiar y filtrar datos antes de procesar
        const cleanData = data.filter((row: any) => {
          const cliente = String(row['Cliente'] || '').toLowerCase();
          const factura = String(row['Factura'] || '');
          const nit = String(row['NIT'] || '');
          
          // Ignorar filas de totales o vacías
          if (cliente.includes('total')) return false;
          if (!nit && !factura && !cliente) return false;
          
          return true;
        });

        const findKey = (row: any, keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const k of keys) {
            const match = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase());
            if (match) return row[match];
          }
          return undefined;
        };

        const formatDate = (val: any) => {
          if (!val) return '';
          if (val instanceof Date) return val.toISOString().split('T')[0];
          if (typeof val === 'number' && val > 40000) {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
            return date.toISOString().split('T')[0];
          }
          return String(val);
        };

        const importedItems: CarteraItem[] = cleanData.map((row: any) => {
          const nit = String(findKey(row, ['NIT', 'Nit', 'Id']) || '').trim();
          const cliente = String(findKey(row, ['Cliente', 'CLIENTE', 'Nombre', 'RAZON SOCIAL']) || '').trim();
          const factura = String(findKey(row, ['Factura', 'FACTURA', 'Documento', 'Referencia']) || '').trim();
          
          return {
            id: crypto.randomUUID(),
            nit,
            fechaCreacionCliente: formatDate(findKey(row, ['Fecha creación cliente', 'Fecha Creación', 'CREACION'])),
            cliente,
            ciudad: String(findKey(row, ['Ciudad', 'CIUDAD', 'Sede']) || '').trim(),
            vendedor: String(findKey(row, ['Nombre vendedor', 'Vendedor', 'VENDEDOR']) || '').trim(),
            responsable: String(findKey(row, ['Responsable', 'RESPONSABLE', 'Encargado', 'Cobrador', 'Responsable Cartera']) || '').trim(),
            terminoPago: String(findKey(row, ['Término de pago', 'Termino', 'Dias Pago']) || '30'),
            factura,
            fechaFactura: formatDate(findKey(row, ['Fecha Factura', 'Fecha factura', 'FECHA'])),
            fechaVencimiento: formatDate(findKey(row, ['Fecha de vencimiento', 'Vencimiento', 'VENCIMIENTO'])),
            valorFactura: Number(findKey(row, ['Valor de factura', 'Total', 'TOTAL', 'Saldo', 'Valor']) || 0),
            pagoAbono: 0,
            contactos: '',
            telefono: String(findKey(row, ['Teléfono', 'TELEFONO', 'Telefono', 'Celular']) || '').trim(),
            fechaPago: formatDate(findKey(row, ['Fecha de pago', 'Pago'])),
            observacion1: String(findKey(row, ['Observaciones 1', 'Observacion 1', 'OBS 1', 'Nota 1', 'Observación']) || '').trim(),
            observacion2: String(findKey(row, ['Observaciones 2', 'Observacion 2', 'OBS 2', 'Nota 2']) || '').trim(),
          };
        });

        if (importedItems.length === 0) {
          toast.error('No se encontraron datos válidos para importar');
          return;
        }

        // El usuario prefiere "limpiar" antes de importar si trae un reporte completo
        if (window.confirm(`Se encontraron ${importedItems.length} registros. ¿Deseas REEMPLAZAR la lista actual con estos datos? (Cancela para ADJUNTARLOS)`)) {
          setItems(importedItems);
        } else {
          setItems([...importedItems, ...items]);
        }
        
        toast.success('Datos procesados y limpiados correctamente');
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Error al importar el archivo');
      }
    };
    reader.readAsBinaryString(file);
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
    let filtered = items.filter(it => filtroCiudad === 'Todas' || it.ciudad === filtroCiudad);
    
    // Aplicar ordenamiento a los registros individuales
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key as keyof CarteraItem] || '';
        let bVal = b[sortConfig.key as keyof CarteraItem] || '';
        
        // Manejar números
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // Manejar strings
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const groups: Record<string, { records: CarteraItem[]; total: number; buckets: number[] }> = {};
    
    filtered.forEach(item => {
      const key = item.cliente || 'Sin Cliente';
      if (!groups[key]) {
        groups[key] = {
          records: [],
          total: 0,
          buckets: [0, 0, 0, 0]
        };
      }
      groups[key].records.push(item);
      groups[key].total += calcularSaldo(item.valorFactura, item.pagoAbono);
      BUCKETS.forEach((b, i) => {
        groups[key].buckets[i] += getBucketValue(item, b);
      });
    });

    let result = Object.entries(groups).map(([cliente, data]) => ({
      cliente,
      ...data
    }));

    // Ordenar los grupos si el criterio es cliente o total (valorFactura)
    if (sortConfig && (sortConfig.key === 'cliente' || sortConfig.key === 'valorFactura')) {
      result.sort((a, b) => {
        const aVal = sortConfig.key === 'cliente' ? a.cliente : a.total;
        const bVal = sortConfig.key === 'cliente' ? b.cliente : b.total;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const sa = String(aVal).toLowerCase();
        const sb = String(bVal).toLowerCase();
        if (sa < sb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (sa > sb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (!sortConfig) {
      // Orden por defecto: Total descendente
      result.sort((a, b) => b.total - a.total);
    }

    return result;
  }, [items, filtroCiudad, sortConfig]);

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
            <button 
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 dark:bg-navy-900 dark:hover:bg-navy-800 text-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-navy-600 font-medium text-sm shadow-sm"
            >
              <Settings2 className="w-4 h-4" /> Columnas
            </button>
            
            {isColumnMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsColumnMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-xl shadow-xl z-20 py-3 animate-fade-in">
                  <div className="px-4 pb-2 mb-2 border-b border-gray-100 dark:border-navy-800">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visualización de Columnas</h4>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto px-2 space-y-0.5">
                    {ALL_COLUMNS.map(col => (
                      <button
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                          isVisible(col.id) 
                            ? 'text-brand-indigo font-semibold bg-brand-indigo/5' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-navy-800'
                        }`}
                      >
                        {col.label}
                        {isVisible(col.id) && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="px-3 pt-3 mt-2 border-t border-gray-100 dark:border-navy-800 flex gap-2">
                    <button 
                      onClick={() => setVisibleColumns(ALL_COLUMNS.map(c => c.id))}
                      className="text-[10px] font-bold text-brand-indigo hover:underline"
                    >
                      Mostrar todas
                    </button>
                    <button 
                      onClick={() => setVisibleColumns(['cliente', 'total'])}
                      className="text-[10px] font-bold text-gray-400 hover:underline"
                    >
                      Mínimo
                    </button>
                  </div>
                </div>
              </>
            )}
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
          
          <button
            onClick={clearItems}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors font-medium text-sm"
            title="Eliminar todos los registros"
          >
            <Trash2 className="w-4 h-4" /> Limpiar Tabla
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
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-indigo hover:bg-brand-indigo/5 rounded-lg transition-colors border border-brand-indigo/20"
            >
              <UnfoldVertical className="w-3.5 h-3.5" /> Expandir Todo
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors border border-gray-200 dark:border-navy-700"
            >
              <FoldVertical className="w-3.5 h-3.5" /> Contraer Todo
            </button>
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-indigo text-white rounded-lg hover:bg-brand-indigo/90 transition-colors shadow-sm font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar registro
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-navy-950/50 uppercase font-bold border-b border-gray-200 dark:border-navy-800">
              <tr>
                <th className="px-2 py-3 w-8 border-r border-gray-200 dark:border-navy-800"></th>
                {isVisible('nit') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('nit')}
                  >
                    <div className="flex items-center gap-1">NIT {sortConfig?.key === 'nit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('fechaCreacionCliente') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('fechaCreacionCliente')}
                  >
                    <div className="flex items-center gap-1">Fecha Creación {sortConfig?.key === 'fechaCreacionCliente' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('cliente') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('cliente')}
                  >
                    <div className="flex items-center gap-1">Cliente {sortConfig?.key === 'cliente' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('vendedor') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('vendedor')}
                  >
                    <div className="flex items-center gap-1">Vendedor {sortConfig?.key === 'vendedor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('terminoPago') && <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Término</th>}
                {isVisible('factura') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('factura')}
                  >
                    <div className="flex items-center gap-1">Factura {sortConfig?.key === 'factura' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('fechaFactura') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('fechaFactura')}
                  >
                    <div className="flex items-center gap-1">Fecha Fact. {sortConfig?.key === 'fechaFactura' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('fechaVencimiento') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('fechaVencimiento')}
                  >
                    <div className="flex items-center gap-1">Vencimiento {sortConfig?.key === 'fechaVencimiento' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                
                {isVisible('bucket_0_30') && <th className="px-2 py-3 whitespace-nowrap text-right border-r border-gray-200 dark:border-navy-800 bg-brand-blue/5">0-30 días</th>}
                {isVisible('bucket_31_60') && <th className="px-2 py-3 whitespace-nowrap text-right border-r border-gray-200 dark:border-navy-800 bg-brand-blue/5">31-60 días</th>}
                {isVisible('bucket_61_90') && <th className="px-2 py-3 whitespace-nowrap text-right border-r border-gray-200 dark:border-navy-800 bg-brand-blue/5">61-90 días</th>}
                {isVisible('bucket_91_plus') && <th className="px-2 py-3 whitespace-nowrap text-right border-r border-gray-200 dark:border-navy-800 bg-brand-blue/5">91+ días</th>}
                
                {isVisible('total') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap text-right border-r border-gray-200 dark:border-navy-800 font-bold bg-gray-100 dark:bg-navy-950 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => handleSort('valorFactura')}
                  >
                    <div className="flex items-center justify-end gap-1">Total {sortConfig?.key === 'valorFactura' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('dias_cartera') && <th className="px-2 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-navy-800">Días Cartera</th>}
                {isVisible('dias_vencidos') && <th className="px-2 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-navy-800">Días Vencidos</th>}
                {isVisible('responsable') && (
                  <th 
                    className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('responsable')}
                  >
                    <div className="flex items-center gap-1">Responsable {sortConfig?.key === 'responsable' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                  </th>
                )}
                {isVisible('telefono') && <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Teléfono</th>}
                {isVisible('pago') && <th className="px-2 py-3 whitespace-nowrap text-center border-r border-gray-200 dark:border-navy-800">Pago</th>}
                {isVisible('fechaPago') && <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Fecha Pago</th>}
                {isVisible('observacion1') && <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Obs 1</th>}
                {isVisible('observacion2') && <th className="px-2 py-3 whitespace-nowrap border-r border-gray-200 dark:border-navy-800">Obs 2</th>}
                <th className="px-2 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-800">
              {groupedItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No hay registros en tu cartera. Agrega uno nuevo o importa un archivo.
                  </td>
                </tr>
              ) : (
                groupedItems.map((group) => {
                  const isExpanded = expandedGroups.includes(group.cliente);
                  return (
                    <React.Fragment key={group.cliente}>
                      {/* FILA DE GRUPO (CABECERA DEL CLIENTE) */}
                      <tr className="bg-brand-indigo/5 hover:bg-brand-indigo/10 transition-colors group/header font-bold text-brand-indigo">
                        <td className="px-2 py-2 text-center border-r border-brand-indigo/10 cursor-pointer" onClick={() => toggleGroup(group.cliente)}>
                          {isExpanded ? <ChevronDown className="w-4 h-4 mx-auto" /> : <ChevronRight className="w-4 h-4 mx-auto" />}
                        </td>
                        <td colSpan={visibleColumns.filter(c => ['nit', 'fechaCreacionCliente', 'cliente', 'vendedor', 'terminoPago', 'factura', 'fechaFactura', 'fechaVencimiento'].includes(c)).length} className="px-2 py-2 border-r border-brand-indigo/10">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleGroup(group.cliente)}>
                             <span className="uppercase tracking-wider">Cliente: {group.cliente}</span>
                             <span className="text-[10px] font-normal bg-brand-indigo/10 px-1.5 py-0.5 rounded-full">
                               {group.records.length} facturas
                             </span>
                          </div>
                        </td>
                        
                        {isVisible('bucket_0_30') && <td className="px-2 py-2 text-right border-r border-brand-indigo/10">${group.buckets[0].toLocaleString()}</td>}
                        {isVisible('bucket_31_60') && <td className="px-2 py-2 text-right border-r border-brand-indigo/10">${group.buckets[1].toLocaleString()}</td>}
                        {isVisible('bucket_61_90') && <td className="px-2 py-2 text-right border-r border-brand-indigo/10">${group.buckets[2].toLocaleString()}</td>}
                        {isVisible('bucket_91_plus') && <td className="px-2 py-2 text-right border-r border-brand-indigo/10">${group.buckets[3].toLocaleString()}</td>}
                        
                        {isVisible('total') && <td className="px-2 py-2 text-right border-r border-brand-indigo/10 bg-brand-indigo/10">
                          ${group.total.toLocaleString()}
                        </td>}
                        
                        <td colSpan={visibleColumns.filter(c => ['dias_cartera', 'dias_vencidos', 'responsable', 'telefono', 'pago', 'fechaPago', 'observacion1', 'observacion2'].includes(c)).length + 1}></td>
                      </tr>

                      {/* FILAS DE DETALLE (FACTURAS) */}
                      {isExpanded && group.records.map((item) => {
                        const edad = calcularEdad(item.fechaFactura);
                        const diasVencidos = calcularDiasVencidos(item.fechaVencimiento);
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition-colors group">
                            <td className="border-r border-gray-100 dark:border-navy-800"></td>
                            {isVisible('nit') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.nit} onChange={(e) => updateItem(item.id, 'nit', e.target.value)} placeholder="NIT" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5" />
                            </td>}
                            {isVisible('fechaCreacionCliente') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.fechaCreacionCliente} onChange={(e) => updateItem(item.id, 'fechaCreacionCliente', e.target.value)} placeholder="dd/mm/aaaa" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5" />
                            </td>}
                            {isVisible('cliente') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.cliente} onChange={(e) => updateItem(item.id, 'cliente', e.target.value)} placeholder="Cliente" className="w-full min-w-[140px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 font-medium" />
                            </td>}
                            {isVisible('vendedor') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.vendedor} onChange={(e) => updateItem(item.id, 'vendedor', e.target.value)} placeholder="Vendedor" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5" />
                            </td>}
                            {isVisible('terminoPago') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="number" value={item.terminoPago} onChange={(e) => updateItem(item.id, 'terminoPago', e.target.value)} className="w-12 bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 text-center" />
                            </td>}
                            {isVisible('factura') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.factura} onChange={(e) => updateItem(item.id, 'factura', e.target.value)} placeholder="Factura" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 font-mono" />
                            </td>}
                            {isVisible('fechaFactura') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="date" value={item.fechaFactura} onChange={(e) => updateItem(item.id, 'fechaFactura', e.target.value)} className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 w-[110px]" />
                            </td>}
                            {isVisible('fechaVencimiento') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="date" value={item.fechaVencimiento} onChange={(e) => updateItem(item.id, 'fechaVencimiento', e.target.value)} className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 w-[110px]" />
                            </td>}
                            
                            {isVisible('bucket_0_30') && <td className="px-2 py-1 text-right border-r border-gray-100 dark:border-navy-800">{getBucketValue(item, BUCKETS[0]) > 0 ? `$${getBucketValue(item, BUCKETS[0]).toLocaleString()}` : '-'}</td>}
                            {isVisible('bucket_31_60') && <td className="px-2 py-1 text-right border-r border-gray-100 dark:border-navy-800">{getBucketValue(item, BUCKETS[1]) > 0 ? `$${getBucketValue(item, BUCKETS[1]).toLocaleString()}` : '-'}</td>}
                            {isVisible('bucket_61_90') && <td className="px-2 py-1 text-right border-r border-gray-100 dark:border-navy-800">{getBucketValue(item, BUCKETS[2]) > 0 ? `$${getBucketValue(item, BUCKETS[2]).toLocaleString()}` : '-'}</td>}
                            {isVisible('bucket_91_plus') && <td className="px-2 py-1 text-right border-r border-gray-100 dark:border-navy-800">{getBucketValue(item, BUCKETS[3]) > 0 ? `$${getBucketValue(item, BUCKETS[3]).toLocaleString()}` : '-'}</td>}
                            
                            {isVisible('total') && <td className="px-2 py-1 text-right border-r border-gray-100 dark:border-navy-800 font-bold bg-gray-50/30 dark:bg-navy-950/30">
                              <input type="number" value={item.valorFactura || ''} onChange={(e) => updateItem(item.id, 'valorFactura', e.target.value)} className="w-full bg-transparent border-0 text-right focus:ring-1 focus:ring-brand-blue rounded px-1" />
                            </td>}
                            {isVisible('dias_cartera') && <td className="px-2 py-1 text-center border-r border-gray-100 dark:border-navy-800">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${edad > 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{edad}</span>
                            </td>}
                            {isVisible('dias_vencidos') && <td className="px-2 py-1 text-center border-r border-gray-100 dark:border-navy-800">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${diasVencidos > 0 ? 'bg-red-500 text-white' : 'bg-green-100 text-green-700'}`}>{diasVencidos}</span>
                            </td>}
                            {isVisible('responsable') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.responsable} onChange={(e) => updateItem(item.id, 'responsable', e.target.value)} placeholder="Responsable" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5" />
                            </td>}
                            {isVisible('telefono') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.telefono} onChange={(e) => updateItem(item.id, 'telefono', e.target.value)} placeholder="Tel" className="w-full bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5" />
                            </td>}
                            {isVisible('pago') && (
                              <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                                <div className="flex items-center gap-1 group/pago">
                                  <input 
                                    type="number" 
                                    value={item.pagoAbono || ''} 
                                    onChange={(e) => updateItem(item.id, 'pagoAbono', Number(e.target.value))} 
                                    placeholder="Abono"
                                    className="w-16 bg-transparent border-0 text-right focus:ring-1 focus:ring-green-500 rounded px-1 py-0.5 text-[10px] text-green-600 font-bold" 
                                  />
                                  <button 
                                    onClick={() => updateItem(item.id, 'pagoAbono', item.pagoAbono === item.valorFactura ? 0 : item.valorFactura)}
                                    className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                                      item.pagoAbono >= item.valorFactura && item.valorFactura > 0 
                                        ? 'bg-green-500 border-green-600 text-white' 
                                        : 'border-gray-300 hover:border-green-500 text-transparent hover:text-green-500'
                                    }`}
                                    title="Pagar total"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                            {isVisible('fechaPago') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="date" value={item.fechaPago} onChange={(e) => updateItem(item.id, 'fechaPago', e.target.value)} className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5 w-[110px]" />
                            </td>}
                            {isVisible('observacion1') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.observacion1} onChange={(e) => updateItem(item.id, 'observacion1', e.target.value)} placeholder="..." className="w-full min-w-[100px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5" />
                            </td>}
                            {isVisible('observacion2') && <td className="px-1 py-1 border-r border-gray-100 dark:border-navy-800">
                              <input type="text" value={item.observacion2} onChange={(e) => updateItem(item.id, 'observacion2', e.target.value)} placeholder="..." className="w-full min-w-[100px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-1 py-0.5" />
                            </td>}
                            
                            <td className="px-2 py-1 text-center">
                              <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {groupedItems.length > 0 && (
              <tfoot className="bg-gray-900 text-white font-bold sticky bottom-0">
                <tr>
                  <td className="border-r border-gray-800"></td>
                  <td colSpan={visibleColumns.filter(c => ['nit', 'fechaCreacionCliente', 'cliente', 'vendedor', 'terminoPago', 'factura', 'fechaFactura', 'fechaVencimiento'].includes(c)).length} className="px-4 py-3 text-right uppercase tracking-wider">Total General:</td>
                  {isVisible('bucket_0_30') && <td className="px-2 py-3 text-right">${stats.buckets[0].value.toLocaleString()}</td>}
                  {isVisible('bucket_31_60') && <td className="px-2 py-3 text-right">${stats.buckets[1].value.toLocaleString()}</td>}
                  {isVisible('bucket_61_90') && <td className="px-2 py-3 text-right">${stats.buckets[2].value.toLocaleString()}</td>}
                  {isVisible('bucket_91_plus') && <td className="px-2 py-3 text-right">${stats.buckets[3].value.toLocaleString()}</td>}
                  
                  {isVisible('total') && <td className="px-2 py-3 text-right bg-brand-indigo">${stats.total.toLocaleString()}</td>}
                  <td colSpan={visibleColumns.filter(c => ['dias_cartera', 'dias_vencidos', 'responsable', 'telefono', 'pago', 'fechaPago', 'observacion1', 'observacion2'].includes(c)).length + 1}></td>
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
