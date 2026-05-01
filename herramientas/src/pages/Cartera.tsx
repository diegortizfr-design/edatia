import React, { useState, useEffect, useMemo } from 'react';
import { Save, Download, Upload, Plus, Trash2, LogIn, X } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import * as XLSX from 'xlsx';

// Tipos
interface CarteraItem {
  id: string;
  cliente: string;
  responsable: string;
  factura: string;
  fechaFactura: string; // YYYY-MM-DD
  terminoPago: string; // días
  fechaCompromiso: string;
  valorFactura: number;
  contactos: string;
  pagoAbono: number;
  fechaPago: string;
  observacion: string;
}

export default function Cartera() {
  const [items, setItems] = useState<CarteraItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'guardar' | 'recuperar'>('guardar');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);

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
      cliente: '',
      responsable: '',
      factura: '',
      fechaFactura: new Date().toISOString().split('T')[0],
      terminoPago: '30',
      fechaCompromiso: '',
      valorFactura: 0,
      contactos: '',
      pagoAbono: 0,
      fechaPago: '',
      observacion: '',
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
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calcularSaldo = (valor: number, abono: number) => {
    return (valor || 0) - (abono || 0);
  };

  const handleExport = () => {
    const dataToExport = items.map((item) => ({
      Cliente: item.cliente,
      'Responsable de clientes': item.responsable,
      Factura: item.factura,
      'Fecha de factura': item.fechaFactura,
      'Término de pago (Días)': item.terminoPago,
      'Fecha compromiso pago': item.fechaCompromiso,
      'Edad de cartera (Días)': calcularEdad(item.fechaFactura),
      'Valor de factura': item.valorFactura,
      Contactos: item.contactos,
      'Pago o abono': item.pagoAbono,
      'Saldo Pendiente': calcularSaldo(item.valorFactura, item.pagoAbono),
      'Fecha de pago': item.fechaPago,
      Observación: item.observacion,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cartera');
    XLSX.writeFile(workbook, 'Gestion_Cartera.xlsx');
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
          cliente: row['Cliente'] || '',
          responsable: row['Responsable de clientes'] || '',
          factura: row['Factura'] || '',
          fechaFactura: row['Fecha de factura'] || new Date().toISOString().split('T')[0],
          terminoPago: row['Término de pago (Días)'] || '30',
          fechaCompromiso: row['Fecha compromiso pago'] || '',
          valorFactura: Number(row['Valor de factura']) || 0,
          contactos: row['Contactos'] || '',
          pagoAbono: Number(row['Pago o abono']) || 0,
          fechaPago: row['Fecha de pago'] || '',
          observacion: row['Observación'] || '',
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

  const totales = useMemo(() => {
    return items.reduce(
      (acc, curr) => ({
        valor: acc.valor + Number(curr.valorFactura || 0),
        abono: acc.abono + Number(curr.pagoAbono || 0),
      }),
      { valor: 0, abono: 0 }
    );
  }, [items]);

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
            Gestión de Cartera
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Controla tus cuentas por cobrar de forma sencilla y gratuita.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-navy-950/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Cliente</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Responsable</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Factura</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Fecha Fact.</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Término</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Vencimiento</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Edad</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Valor Factura</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Contactos</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Abono</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Saldo</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Fecha Pago</th>
                <th className="px-4 py-3 font-medium">Observación</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-navy-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    No hay registros en tu cartera. Agrega uno nuevo o importa un archivo.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const edad = calcularEdad(item.fechaFactura);
                  const saldo = calcularSaldo(item.valorFactura, item.pagoAbono);
                  const isVencida = item.fechaCompromiso && new Date(item.fechaCompromiso) < new Date() && saldo > 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition-colors group">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.cliente}
                          onChange={(e) => updateItem(item.id, 'cliente', e.target.value)}
                          placeholder="Nombre cliente"
                          className="w-full min-w-[150px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 placeholder-gray-400 dark:placeholder-gray-600"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.responsable}
                          onChange={(e) => updateItem(item.id, 'responsable', e.target.value)}
                          placeholder="Responsable"
                          className="w-full min-w-[120px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 placeholder-gray-400 dark:placeholder-gray-600"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.factura}
                          onChange={(e) => updateItem(item.id, 'factura', e.target.value)}
                          placeholder="# Fact"
                          className="w-full min-w-[100px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 font-mono text-xs placeholder-gray-400 dark:placeholder-gray-600"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={item.fechaFactura}
                          onChange={(e) => updateItem(item.id, 'fechaFactura', e.target.value)}
                          className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 w-[130px]"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.terminoPago}
                            onChange={(e) => updateItem(item.id, 'terminoPago', e.target.value)}
                            className="w-16 bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 text-right"
                          />
                          <span className="text-gray-500 text-xs">días</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={item.fechaCompromiso}
                          onChange={(e) => updateItem(item.id, 'fechaCompromiso', e.target.value)}
                          className={`bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 w-[130px] ${
                            isVencida ? 'text-red-500 font-medium' : ''
                          }`}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          edad > 90 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          edad > 60 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          edad > 30 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {edad} días
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.valorFactura || ''}
                          onChange={(e) => updateItem(item.id, 'valorFactura', e.target.value)}
                          placeholder="0.00"
                          className="w-full min-w-[100px] text-right bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.contactos}
                          onChange={(e) => updateItem(item.id, 'contactos', e.target.value)}
                          placeholder="Tel / Email"
                          className="w-full min-w-[150px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 placeholder-gray-400 dark:placeholder-gray-600"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.pagoAbono || ''}
                          onChange={(e) => updateItem(item.id, 'pagoAbono', e.target.value)}
                          placeholder="0.00"
                          className="w-full min-w-[100px] text-right bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 text-green-600 dark:text-green-400"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                        {saldo > 0 ? (
                          <span className="text-gray-900 dark:text-gray-100">${saldo.toLocaleString()}</span>
                        ) : (
                          <span className="text-green-500">Pagado</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="date"
                          value={item.fechaPago}
                          onChange={(e) => updateItem(item.id, 'fechaPago', e.target.value)}
                          className="bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 w-[130px]"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.observacion}
                          onChange={(e) => updateItem(item.id, 'observacion', e.target.value)}
                          placeholder="Notas..."
                          className="w-full min-w-[150px] bg-transparent border-0 focus:ring-1 focus:ring-brand-blue rounded px-2 py-1 placeholder-gray-400 dark:placeholder-gray-600"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-navy-950/80 font-semibold border-t border-gray-200 dark:border-navy-800">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right">TOTALES:</td>
                  <td className="px-4 py-3 text-right text-brand-blue">${totales.valor.toLocaleString()}</td>
                  <td></td>
                  <td className="px-4 py-3 text-right text-green-500">${totales.abono.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${(totales.valor - totales.abono).toLocaleString()}</td>
                  <td colSpan={3}></td>
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
