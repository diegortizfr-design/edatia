import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  TrendingDown,
  FileText,
  Trash2,
  ArrowDownRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getEgresos,
  createEgreso,
  anularEgreso,
  getCategoriasGasto,
  getCategoriasTesoreria,
  getCuentasGastoPUC,
  Egreso,
  CategoriaGasto,
  CuentaGastoPUC,
} from '../../services/tesoreria.service';
import { getCajasBancos } from '../../services/erp.service';
import { getClientes } from '../../services/ventas.service';
import { getEmpresaConfig, getDocumentosConfig, getMediosPago } from '../../services/configuracion.service';
import { CurrencyInput } from '../../components/CurrencyInput';
import { getApiError } from '../../services/api';

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

function numeroALetrasCOP(amount: number): string {
  const n = Math.round(amount);
  if (n === 0) return 'CERO PESOS M/CTE';
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diezY = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function leerCentenas(num: number): string {
    if (num === 100) return 'CIEN';
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;
    let s = centenas[c] ? centenas[c] + ' ' : '';
    if (d === 1) {
      s += diezY[u];
    } else if (d === 2 && u > 0) {
      s += 'VEINTI' + unidades[u];
    } else if (d > 0) {
      s += decenas[d] + (u > 0 ? ' Y ' + unidades[u] : '');
    } else if (u > 0) {
      s += unidades[u];
    }
    return s.trim();
  }

  let res = '';
  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;

  if (millones === 1) res += 'UN MILLON ';
  else if (millones > 1) res += leerCentenas(millones) + ' MILLONES ';

  if (miles === 1) res += 'MIL ';
  else if (miles > 1) res += leerCentenas(miles) + ' MIL ';

  if (resto > 0) res += leerCentenas(resto) + ' ';

  return (res.trim() + ' PESOS M/CTE').toUpperCase();
}

export function EgresosGastos() {
  const qc = useQueryClient();

  // Filtros
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cajaBancoId, setCajaBancoId] = useState<string>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Modales
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [egresoSeleccionado, setEgresoSeleccionado] = useState<Egreso | null>(null);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  // Queries
  const { data: egresos = [], isLoading } = useQuery({
    queryKey: ['egresos', desde, hasta, categoria, cajaBancoId, query],
    queryFn: () =>
      getEgresos({
        desde: desde || undefined,
        hasta: hasta || undefined,
        categoria: categoria || undefined,
        cajaBancoId: cajaBancoId ? Number(cajaBancoId) : undefined,
        query: query || undefined,
      }),
  });

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-gasto'],
    queryFn: getCategoriasGasto,
  });

  const { data: cajasBancos = [] } = useQuery({
    queryKey: ['cajas-bancos-balances'],
    queryFn: getCajasBancos,
  });

  const { data: terceros = [] } = useQuery({
    queryKey: ['terceros-todos'],
    queryFn: getClientes,
  });

  const { data: empresaConfig } = useQuery({
    queryKey: ['empresa-config'],
    queryFn: getEmpresaConfig,
  });

  // Mutación anular
  const mutAnular = useMutation({
    mutationFn: (id: number) => anularEgreso(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['egresos'] });
      qc.invalidateQueries({ queryKey: ['cajas-bancos-balances'] });
      setAnulandoId(null);
    },
    onError: (err: any) => {
      alert(getApiError(err));
      setAnulandoId(null);
    },
  });

  // KPIs
  const kpis = useMemo(() => {
    const aprobados = egresos.filter((e) => e.estado === 'APROBADO');
    const totalMonto = aprobados.reduce((acc, e) => acc + Number(e.montoNeto || e.monto), 0);
    const totalArriendosServicios = aprobados
      .filter((e) => e.categoriaGasto.includes('ARRIENDO') || e.categoriaGasto.includes('SERVICIOS'))
      .reduce((acc, e) => acc + Number(e.montoNeto || e.monto), 0);
    return {
      totalMonto,
      totalArriendosServicios,
      conteo: aprobados.length,
    };
  }, [egresos]);

  // Manejador de impresión del Comprobante de Egreso
  const imprimirCE = (e: Egreso) => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;

    const fechaFormateada = new Date(e.fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const valorNeto = Number(e.montoNeto || e.monto);
    const letras = numeroALetrasCOP(valorNeto);

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprobante de Egreso ${e.numero}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 30px; color: #1e293b; font-size: 13px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #4f46e5; }
          .num { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; background-color: #f8fafc; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; border: 1px solid #cbd5e1; color: #475569; }
          td { padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 12px; }
          .text-right { text-align: right; }
          .text-bold { font-weight: bold; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 50px; text-align: center; }
          .sig-line { border-top: 1px solid #475569; padding-top: 6px; font-weight: 600; font-size: 11px; color: #334155; }
          @media print {
            body { margin: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${empresaConfig?.nombreComercial || empresaConfig?.nombre || 'EDATIA ERP'}</div>
            <div style="font-size: 12px; color: #64748b;">NIT: ${empresaConfig?.nit || '—'} ${empresaConfig?.digitoVerificacion ? '-' + empresaConfig.digitoVerificacion : ''}</div>
            <div style="font-size: 11px; color: #64748b;">${empresaConfig?.direccion || ''} ${empresaConfig?.municipio ? '• ' + empresaConfig.municipio : ''}</div>
          </div>
          <div style="text-align: right;">
            <div class="title">${e.documentoConfig?.nombre?.toUpperCase() || 'COMPROBANTE DE EGRESO'}</div>
            <div class="num">${e.numero}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Fecha: ${fechaFormateada}</div>
            ${e.documentoConfig?.resolucionDian ? `<div style="font-size: 10px; color: #94a3b8;">Resolución DIAN: ${e.documentoConfig.resolucionDian}</div>` : ''}
          </div>
        </div>

        <div class="box">
          <div class="grid2">
            <div>
              <span style="color:#64748b; font-size:11px;">PAGADO A:</span><br/>
              <strong style="font-size: 14px;">${e.beneficiarioNombre || e.tercero?.nombre || 'Beneficiario'}</strong><br/>
              <span style="font-size: 12px; color: #475569;">C.C. / NIT: ${e.beneficiarioDoc || e.tercero?.numeroDocumento || '—'}</span>
            </div>
            <div>
              <span style="color:#64748b; font-size:11px;">POR CONCEPTO DE:</span><br/>
              <strong>${e.concepto}</strong><br/>
              <span style="font-size: 11px; color: #475569;">Categoría: ${e.categoriaGasto} ${e.referencia ? '• Ref: ' + e.referencia : ''}</span>
            </div>
          </div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" class="grid2">
            <div>
              <span style="color:#64748b; font-size:11px;">MEDIO DE PAGO / CUENTA:</span><br/>
              <strong>${e.cajaBanco?.nombre || 'Tesorería General'}</strong> (${e.medioPago})
            </div>
            <div style="text-align: right;">
              <span style="color:#64748b; font-size:11px;">VALOR NETO GIRADO:</span><br/>
              <strong style="font-size: 16px; color: #166534;">${cop(valorNeto)}</strong>
            </div>
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #475569; font-style: italic;">
            Son: ${letras}
          </div>
        </div>

        <div style="font-size: 12px; font-weight: bold; color: #334155; margin-top: 20px;">DETALLE DE CAUSACIÓN Y ASIENTO CONTABLE</div>
        <table>
          <thead>
            <tr>
              <th>Código PUC</th>
              <th>Descripción Cuenta / Movimiento</th>
              <th class="text-right">Débito</th>
              <th class="text-right">Crédito</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${e.cuentaGasto?.codigo || '51xxxx'}</strong></td>
              <td>${e.cuentaGasto?.nombre || 'Gasto'} - ${e.concepto}</td>
              <td class="text-right text-bold">${cop(Number(e.monto))}</td>
              <td class="text-right">$ 0</td>
            </tr>
            ${
              Number(e.valorRetencion) > 0
                ? `<tr>
                    <td><strong>${e.cuentaRetencion?.codigo || '2365xx'}</strong></td>
                    <td>Retención en la fuente (${e.tarifaRetencion}%)</td>
                    <td class="text-right">$ 0</td>
                    <td class="text-right text-bold" style="color:#b91c1c;">${cop(Number(e.valorRetencion))}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td><strong>${e.cajaBanco?.cuentaPUC || '11xxxx'}</strong></td>
              <td>Salida ${e.cajaBanco?.nombre || 'Caja/Banco'} - ${e.medioPago}</td>
              <td class="text-right">$ 0</td>
              <td class="text-right text-bold" style="color:#15803d;">${cop(valorNeto)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="2" class="text-right">SUMAS IGUALES:</td>
              <td class="text-right">${cop(Number(e.monto))}</td>
              <td class="text-right">${cop(Number(e.monto))}</td>
            </tr>
          </tfoot>
        </table>

        ${e.notas ? `<div style="margin-top: 15px; font-size: 11px; color: #64748b;"><strong>Notas adicionales:</strong> ${e.notas}</div>` : ''}

        <div class="signatures">
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-line">Elaborado por</div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-line">Revisado / Aprobado</div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-line">Recibí Conforme (Firma y C.C.)</div>
          </div>
        </div>
      </body>
      </html>
    `);

    w.document.close();
    setTimeout(() => {
      w.print();
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-indigo-600" size={26} /> Tesorería: Gastos y Comprobantes de Egreso
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registro contable oficial de arriendos, servicios públicos, honorarios y pagos operacionales [CE]
          </p>
        </div>

        <button
          onClick={() => setShowModalNuevo(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all shadow-indigo-100"
        >
          <Plus size={18} /> Registrar Egreso / Pago
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Total Egresos Pagados
            </span>
            <span className="text-xl font-bold text-slate-800">{cop(kpis.totalMonto)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-cyan-50 text-cyan-600 p-3.5 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Arriendos y Servicios
            </span>
            <span className="text-xl font-bold text-slate-800">{cop(kpis.totalArriendosServicios)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Comprobantes Emitidos
            </span>
            <span className="text-xl font-bold text-slate-800">{kpis.conteo} Comprobantes [CE]</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por comprobante, beneficiario, concepto o ref..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          />
        </div>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium text-slate-700"
        >
          <option value="">Todas las Categorías</option>
          {categoriasData?.categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={cajaBancoId}
          onChange={(e) => setCajaBancoId(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium text-slate-700"
        >
          <option value="">Todas las Cajas / Bancos</option>
          {cajasBancos.map((cb: any) => (
            <option key={cb.id} value={cb.id}>
              {cb.nombre} ({cb.tipo})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Desde:</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="p-1.5 border border-slate-200 rounded-lg outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Hasta:</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="p-1.5 border border-slate-200 rounded-lg outline-none text-xs"
          />
        </div>

        {(query || categoria || cajaBancoId || desde || hasta) && (
          <button
            onClick={() => {
              setQuery('');
              setCategoria('');
              setCajaBancoId('');
              setDesde('');
              setHasta('');
            }}
            className="text-xs text-indigo-600 font-semibold hover:underline px-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de Egresos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && (
          <div className="py-16 text-center text-slate-400 font-medium">Cargando comprobantes de egreso...</div>
        )}

        {!isLoading && egresos.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <CreditCard size={28} />
            </div>
            <p className="text-slate-600 font-semibold">No se encontraron comprobantes de egreso registrados</p>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Comienza registrando los pagos de arriendo, servicios públicos u otros gastos operativos de tu empresa.
            </p>
            <button
              onClick={() => setShowModalNuevo(true)}
              className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100"
            >
              + Registrar primer egreso
            </button>
          </div>
        )}

        {!isLoading && egresos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Beneficiario / Tercero</th>
                  <th className="py-3 px-4">Categoría / Concepto</th>
                  <th className="py-3 px-4">Origen Fondos</th>
                  <th className="py-3 px-4 text-right">Monto Bruto</th>
                  <th className="py-3 px-4 text-right">Neto Pagado</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {egresos.map((e) => {
                  const isAnulado = e.estado === 'ANULADO';
                  const isArriendo = e.categoriaGasto.includes('ARRIENDO');
                  const isServicio = e.categoriaGasto.includes('SERVICIOS');

                  return (
                    <tr key={e.id} className={`hover:bg-slate-50/80 transition-colors ${isAnulado ? 'opacity-60 bg-slate-50/40' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {e.numero}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(e.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {e.beneficiarioNombre || e.tercero?.nombre || 'Beneficiario'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          NIT: {e.beneficiarioDoc || e.tercero?.numeroDocumento || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isArriendo
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : isServicio
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {e.categoriaGasto}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 line-clamp-1">{e.concepto}</div>
                        {e.referencia && (
                          <div className="text-[11px] text-slate-400 italic">Ref: {e.referencia}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-700">{e.cajaBanco?.nombre || 'Tesorería'}</div>
                        <div className="text-[11px] text-slate-400">{e.medioPago}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                        {cop(Number(e.monto))}
                        {Number(e.valorRetencion) > 0 && (
                          <div className="text-[10px] text-red-500">Ret: -{cop(Number(e.valorRetencion))}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {cop(Number(e.montoNeto || e.monto))}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAnulado ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Anulado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Aprobado
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => imprimirCE(e)}
                            title="Imprimir Comprobante de Egreso"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Printer size={16} />
                          </button>

                          {!isAnulado && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Está seguro de anular el Comprobante de Egreso ${e.numero}?`)) {
                                  setAnulandoId(e.id);
                                  mutAnular.mutate(e.id);
                                }
                              }}
                              disabled={anulandoId === e.id}
                              title="Anular comprobante"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Nuevo Egreso */}
      {showModalNuevo && (
        <ModalNuevoEgreso
          onClose={() => setShowModalNuevo(false)}
          categoriasData={categoriasData}
          cajasBancos={cajasBancos}
          terceros={terceros}
          onSuccess={(nuevoEgreso: Egreso) => {
            setShowModalNuevo(false);
            qc.invalidateQueries({ queryKey: ['egresos'] });
            qc.invalidateQueries({ queryKey: ['cajas-bancos-balances'] });
            imprimirCE(nuevoEgreso);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE: MODAL NUEVO EGRESO
// ─────────────────────────────────────────────────────────────────────────────

function ModalNuevoEgreso({
  onClose,
  categoriasData: _categoriasData,
  cajasBancos,
  terceros,
  onSuccess,
}: {
  onClose: () => void;
  categoriasData?: any;
  cajasBancos: any[];
  terceros: any[];
  onSuccess: (nuevo: Egreso) => void;
}) {
  const [documentoConfigId, setDocumentoConfigId] = useState<string>('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [terceroId, setTerceroId] = useState<string>('');
  const [beneficiarioNombre, setBeneficiarioNombre] = useState('');
  const [beneficiarioDoc, setBeneficiarioDoc] = useState('');
  const [categoriaGastoId, setCategoriaGastoId] = useState<string>('');
  const [categoriaGastoNombre, setCategoriaGastoNombre] = useState<string>('');
  const [concepto, setConcepto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [cuentaGastoId, setCuentaGastoId] = useState<number | null>(null);
  const [cajaBancoId, setCajaBancoId] = useState<string>(
    cajasBancos.length > 0 ? String(cajasBancos[0].id) : ''
  );
  const [medioPago, setMedioPago] = useState('');
  const [monto, setMonto] = useState<number>(0);
  const [aplicaRetencion, setAplicaRetencion] = useState(false);
  const [tarifaRetencion, setTarifaRetencion] = useState<number>(3.5);
  const [notas, setNotas] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Documentos Configuración CE estrictos (sigla CE únicamente) ──
  const { data: documentos = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['documentos-config'],
    queryFn: getDocumentosConfig,
  });

  const resolucionesCE = useMemo(() => {
    return (documentos as any[]).filter((d: any) => {
      if (d.estado !== 'ACTIVO' || d.deletedAt) return false;
      const sigla = (d.sigla || '').trim().toUpperCase();
      return sigla === 'CE';
    });
  }, [documentos]);

  useEffect(() => {
    if (resolucionesCE.length > 0) {
      if (!documentoConfigId || !resolucionesCE.some((d: any) => String(d.id) === String(documentoConfigId))) {
        setDocumentoConfigId(String(resolucionesCE[0].id));
      }
    } else {
      setDocumentoConfigId('');
    }
  }, [resolucionesCE, documentoConfigId]);

  // ── Categorías Dinámicas de Tesorería (no quemadas) ──
  const { data: categoriasLista = [], isLoading: loadingCats } = useQuery<CategoriaGasto[]>({
    queryKey: ['categoriasTesoreria'],
    queryFn: getCategoriasTesoreria,
  });

  // ── Cuentas Contables PUC de Gasto reales de la empresa ──
  const { data: cuentasGastoLista = [], isLoading: loadingCuentas } = useQuery<CuentaGastoPUC[]>({
    queryKey: ['cuentasGastoPUC'],
    queryFn: getCuentasGastoPUC,
  });

  // Auto-seleccionar primera categoría activa
  useEffect(() => {
    if (categoriasLista.length > 0 && !categoriaGastoId) {
      const activeCat = categoriasLista.find((c) => c.activo) || categoriasLista[0];
      setCategoriaGastoId(String(activeCat.id));
      setCategoriaGastoNombre(activeCat.nombre);
      if (activeCat.cuentaPUCId) {
        setCuentaGastoId(activeCat.cuentaPUCId);
      } else if (cuentasGastoLista.length > 0) {
        setCuentaGastoId(cuentasGastoLista[0].id);
      }
    }
  }, [categoriasLista, categoriaGastoId, cuentasGastoLista]);

  // Cambio de categoría: sincroniza nombre y cuenta PUC predeterminada
  const handleCategoriaChange = (idStr: string) => {
    setCategoriaGastoId(idStr);
    const cat = categoriasLista.find((c) => String(c.id) === idStr);
    if (cat) {
      setCategoriaGastoNombre(cat.nombre);
      if (cat.cuentaPUCId) {
        setCuentaGastoId(cat.cuentaPUCId);
      }
    } else {
      setCategoriaGastoNombre('');
    }
  };

  // ── Medios de Pago desde Configuración General ──
  const { data: mediosPagoData = [] } = useQuery({
    queryKey: ['config-medios-pago'],
    queryFn: getMediosPago,
  });

  const mediosPagoActivos = useMemo(() => {
    const list = (mediosPagoData as any[]).filter((m: any) => m.activo !== false);
    if (list.length > 0) return list;
    return [
      { id: 1, codigo: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria' },
      { id: 2, codigo: 'EFECTIVO', nombre: 'Efectivo' },
      { id: 3, codigo: 'TARJETA_DEBITO', nombre: 'Tarjeta Débito' },
      { id: 4, codigo: 'TARJETA_CREDITO', nombre: 'Tarjeta Crédito' },
      { id: 5, codigo: 'CHEQUE', nombre: 'Cheque' },
    ];
  }, [mediosPagoData]);

  useEffect(() => {
    if (mediosPagoActivos.length > 0 && (!medioPago || !mediosPagoActivos.some((m: any) => m.codigo === medioPago))) {
      setMedioPago(mediosPagoActivos[0].codigo);
    }
  }, [mediosPagoActivos, medioPago]);

  // Si selecciona tercero del listado, auto-llenar datos
  const handleSelectTercero = (idStr: string) => {
    setTerceroId(idStr);
    if (idStr) {
      const t = terceros.find((x) => String(x.id) === idStr);
      if (t) {
        setBeneficiarioNombre(t.nombre);
        setBeneficiarioDoc(t.numeroDocumento);
      }
    }
  };

  // Caja / Banco seleccionada
  const selectedCajaBanco = useMemo(() => {
    return cajasBancos.find((cb: any) => String(cb.id) === String(cajaBancoId));
  }, [cajasBancos, cajaBancoId]);

  // Cálculo neto
  const valorRetencion = aplicaRetencion ? Math.round(monto * (tarifaRetencion / 100)) : 0;
  const neto = Math.max(0, monto - valorRetencion);

  const mutCrear = useMutation({
    mutationFn: (dto: any) => createEgreso(dto),
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (err: any) => {
      setErrorMsg(getApiError(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!documentoConfigId) {
      setErrorMsg('Debe seleccionar la resolución del documento Comprobante de Egreso (CE). Configure una en Configuración ➔ Documentos.');
      return;
    }
    if (!cajaBancoId) {
      setErrorMsg('Debe seleccionar la Caja o Banco desde donde se realiza el pago');
      return;
    }
    if (selectedCajaBanco && !selectedCajaBanco.cuentaPUC) {
      setErrorMsg(`La caja/banco "${selectedCajaBanco.nombre}" no tiene una cuenta contable PUC asignada. Vaya a Configuración ➔ Cajas y Bancos para vincularla.`);
      return;
    }
    if (!cuentaGastoId) {
      setErrorMsg('Debe seleccionar la cuenta contable de gasto PUC');
      return;
    }
    if (monto <= 0) {
      setErrorMsg('El monto del egreso debe ser mayor a 0');
      return;
    }
    if (!concepto.trim()) {
      setErrorMsg('Debe especificar el concepto del gasto');
      return;
    }

    mutCrear.mutate({
      documentoConfigId: Number(documentoConfigId),
      fecha,
      terceroId: terceroId ? Number(terceroId) : undefined,
      beneficiarioNombre: beneficiarioNombre.trim() || undefined,
      beneficiarioDoc: beneficiarioDoc.trim() || undefined,
      categoriaGasto: categoriaGastoNombre || 'Gasto Operacional',
      categoriaGastoId: categoriaGastoId ? Number(categoriaGastoId) : undefined,
      concepto: concepto.trim(),
      referencia: referencia.trim() || undefined,
      cuentaGastoId,
      cajaBancoId: Number(cajaBancoId),
      medioPago,
      monto,
      aplicaRetencion,
      tarifaRetencion: aplicaRetencion ? tarifaRetencion : 0,
      valorRetencion,
      notas: notas.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Cabecera Fija */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Registrar Comprobante de Egreso</h2>
              <p className="text-xs text-slate-400">Pagar arriendos, servicios públicos o gastos operacionales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario con cuerpo scrollable y pie fijo */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Cuerpo Scrollable */}
          <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Alerta de bloqueo si no hay documento CE en configuración */}
            {!loadingDocs && resolucionesCE.length === 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">No existe ningún documento con sigla "CE" configurado</p>
                  <p className="text-amber-800">
                    No puede emitir comprobantes de egreso sin antes crear una resolución de documento con sigla <strong>CE</strong> en su configuración de documentos.
                  </p>
                  <Link
                    to="/configuracion/documentos"
                    className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:underline pt-0.5"
                  >
                    <span>Ir a Configuración ➔ Documentos</span>
                    <ArrowDownRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Documento / Prefijo CE (DocumentoConfig) */}
              <div className="md:col-span-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Documento / Resolución CE *
                  </label>
                  <Link
                    to="/configuracion/documentos"
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Configurar
                  </Link>
                </div>
                <select
                  value={documentoConfigId}
                  onChange={(e) => setDocumentoConfigId(e.target.value)}
                  disabled={resolucionesCE.length === 0}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {resolucionesCE.length === 0 ? (
                    <option value="">— No hay resoluciones CE configuradas —</option>
                  ) : (
                    <>
                      <option value="">— Seleccionar Resolución CE —</option>
                      {resolucionesCE.map((doc: any) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.nombre} ({doc.prefijo ? `${doc.prefijo}-` : 'CE-'}{doc.consecutivoSiguiente})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Fecha */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Pago *</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              {/* Categoría de Gasto Dinámica */}
              <div className="md:col-span-12">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">Categoría del Gasto *</label>
                  <Link
                    to="/configuracion/tesoreria"
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    + Gestionar Categorías
                  </Link>
                </div>

                {categoriasLista.length === 0 && !loadingCats ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 mb-2">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">No hay categorías de gasto configuradas</p>
                      <p>Cree categorías como "Arriendo", "Servicios Públicos", etc. en <Link to="/configuracion/tesoreria" className="underline font-bold text-indigo-700">Configuración ➔ Tesorería</Link>.</p>
                    </div>
                  </div>
                ) : null}

                <select
                  value={categoriaGastoId}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="">— Seleccionar Categoría de Gasto —</option>
                  {categoriasLista
                    .filter((c) => c.activo)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.descripcion ? `(${c.descripcion})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Beneficiario / Tercero guardado */}
              <div className="md:col-span-12">
                <label className="block text-xs font-bold text-slate-600 mb-1">Tercero / Proveedor Registrado (Opcional)</label>
                <select
                  value={terceroId}
                  onChange={(e) => handleSelectTercero(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="">— Seleccionar tercero o diligenciar abajo —</option>
                  {terceros.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({t.numeroDocumento})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre manual / documento */}
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre / Razón Social Beneficiario *</label>
                <input
                  type="text"
                  placeholder="Ej. Inmobiliaria Central SAS / Enel Colombia"
                  value={beneficiarioNombre}
                  onChange={(e) => setBeneficiarioNombre(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-600 mb-1">C.C. o NIT</label>
                <input
                  type="text"
                  placeholder="900123456"
                  value={beneficiarioDoc}
                  onChange={(e) => setBeneficiarioDoc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              {/* Concepto del gasto */}
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-600 mb-1">Concepto / Motivo del Pago *</label>
                <input
                  type="text"
                  placeholder="Ej. Pago arriendo local mes Octubre 2026"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              {/* N° Factura / Referencia */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-600 mb-1">N° Factura / Cuenta de Cobro</label>
                <input
                  type="text"
                  placeholder="Ej. FAC-9912 o NIC-4421"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              {/* Cuenta PUC Gasto real */}
              <div className="md:col-span-12">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Cuenta PUC de Gasto (Débito) *
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold font-mono">
                    {cuentasGastoLista.length} cuentas en PUC
                  </span>
                </div>
                <select
                  value={cuentaGastoId || ''}
                  onChange={(e) => setCuentaGastoId(e.target.value ? Number(e.target.value) : null)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="">— Seleccionar cuenta contable de gasto de su catálogo PUC —</option>
                  {cuentasGastoLista.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.codigo} — {cp.nombre} ({cp.tipo})
                    </option>
                  ))}
                </select>
                {cuentasGastoLista.length === 0 && !loadingCuentas && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    ⚠️ No hay cuentas de gasto (Clase 5/6) en su catálogo PUC. Vaya a Contabilidad ➔ PUC para crearlas.
                  </p>
                )}
              </div>

              {/* Origen de fondos: Caja o Banco */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-600 mb-1">Pagar Desde (Caja / Banco) *</label>
                <select
                  value={cajaBancoId}
                  onChange={(e) => setCajaBancoId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="">— Seleccionar Caja o Banco —</option>
                  {cajasBancos.map((cb: any) => (
                    <option key={cb.id} value={cb.id}>
                      {cb.nombre} — Saldo: {cop(Number(cb.saldoContable ?? 0))} {cb.cuentaPUC ? `[PUC: ${cb.cuentaPUC}]` : '[Sin cuenta PUC]'}
                    </option>
                  ))}
                </select>
                {selectedCajaBanco && !selectedCajaBanco.cuentaPUC && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-1">
                    ⚠️ Esta caja/banco no tiene una cuenta PUC configurada en Cajas y Bancos.
                  </p>
                )}
              </div>

              {/* Medio de Pago (dinámico desde Configuración) */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-600 mb-1">Medio de Pago *</label>
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  {mediosPagoActivos.map((mp: any) => (
                    <option key={mp.id || mp.codigo} value={mp.codigo}>
                      {mp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto del Gasto */}
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-600 mb-1">Valor Total del Gasto ($) *</label>
                <CurrencyInput
                  value={monto}
                  onChange={(val) => setMonto(val)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>

              {/* Retención Toggle */}
              <div className="md:col-span-6 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 border border-slate-200 rounded-xl select-none">
                  <input
                    type="checkbox"
                    checked={aplicaRetencion}
                    onChange={(e) => setAplicaRetencion(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-700">Aplicar Retención en la Fuente</span>
                </label>
              </div>

              {/* Parámetros de Retención si aplica */}
              {aplicaRetencion && (
                <div className="md:col-span-12 p-3 bg-amber-50/60 border border-amber-200 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Tarifa de Retención (%)</label>
                    <select
                      value={tarifaRetencion}
                      onChange={(e) => setTarifaRetencion(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white font-bold text-amber-900"
                    >
                      <option value={3.5}>3.5% — Arrendamiento de Bienes Raíces</option>
                      <option value={4.0}>4.0% — Servicios en General</option>
                      <option value={6.0}>6.0% — Servicios no declarantes</option>
                      <option value={10.0}>10.0% — Honorarios declarantes</option>
                      <option value={11.0}>11.0% — Honorarios no declarantes</option>
                      <option value={2.5}>2.5% — Compras generales</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-amber-700 font-semibold">Valor Retenido:</span>
                    <span className="text-base font-bold text-red-600">-{cop(valorRetencion)}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Pie Fijo: Resumen y Botones (Siempre visibles en pantalla) */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 shrink-0 space-y-3">
            {/* Resumen Final Neto */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-indigo-700 font-semibold block">Total Neto a Desembolsar</span>
                <span className="text-lg sm:text-xl font-extrabold text-indigo-950">{cop(neto)}</span>
              </div>
              <div className="text-right text-[11px] text-indigo-600 font-medium">
                Genera Comprobante [CE] y asiento balanceado
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutCrear.isLoading || resolucionesCE.length === 0 || !documentoConfigId}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {mutCrear.isLoading ? 'Generando Comprobante...' : 'Guardar y Emitir Egreso [CE]'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

