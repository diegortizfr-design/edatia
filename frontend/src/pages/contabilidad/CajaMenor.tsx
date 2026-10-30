import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coins,
  Plus,
  RotateCcw,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Trash2,
  User,
  Coffee,
  Car,
  FileSpreadsheet,
  Wrench,
  X,
  Building2,
  Wallet,
} from 'lucide-react';
import {
  getCajasMenores,
  createCajaMenor,
  getGastosCajaMenor,
  createGastoCajaMenor,
  deleteGastoCajaMenor,
  reembolsarCajaMenor,
  getReembolsosCajaMenor,
  getCategoriasGasto,
  CajaMenor as CajaMenorType,
  GastoCajaMenor,
} from '../../services/tesoreria.service';
import { getCajasBancos } from '../../services/erp.service';
import { getEmpresaConfig } from '../../services/configuracion.service';
import { CurrencyInput } from '../../components/CurrencyInput';
import { getApiError } from '../../services/api';

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);

function getCategoriaIcon(cat: string) {
  const c = (cat || '').toUpperCase();
  if (c.includes('CAFETERIA') || c.includes('ASEO')) return <Coffee size={14} className="text-amber-600" />;
  if (c.includes('TRANSPORTE') || c.includes('TAXI')) return <Car size={14} className="text-blue-600" />;
  if (c.includes('PAPELERIA') || c.includes('UTIL')) return <FileSpreadsheet size={14} className="text-green-600" />;
  if (c.includes('MANTENIMIENTO')) return <Wrench size={14} className="text-orange-600" />;
  return <Receipt size={14} className="text-indigo-600" />;
}

export function CajaMenor() {
  const qc = useQueryClient();

  const [cajaSeleccionadaId, setCajaSeleccionadaId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');

  // Modales
  const [showModalNuevaCaja, setShowModalNuevaCaja] = useState(false);
  const [showModalGasto, setShowModalGasto] = useState(false);
  const [showModalReembolso, setShowModalReembolso] = useState(false);
  const [reembolsoImprimir, setReembolsoImprimir] = useState<any | null>(null);

  // Queries
  const { data: cajas = [], isLoading: loadingCajas } = useQuery({
    queryKey: ['cajas-menores'],
    queryFn: getCajasMenores,
    onSuccess: (data) => {
      if (data.length > 0 && !cajaSeleccionadaId) {
        setCajaSeleccionadaId(data[0].id);
      }
    },
  });

  const cajaActiva = useMemo(() => {
    if (!cajaSeleccionadaId && cajas.length > 0) return cajas[0];
    return cajas.find((c) => c.id === cajaSeleccionadaId) || null;
  }, [cajas, cajaSeleccionadaId]);

  const { data: gastos = [], isLoading: loadingGastos } = useQuery({
    queryKey: ['gastos-caja-menor', cajaActiva?.id],
    queryFn: () => getGastosCajaMenor(cajaActiva!.id),
    enabled: !!cajaActiva?.id,
  });

  const { data: reembolsos = [] } = useQuery({
    queryKey: ['reembolsos-caja-menor', cajaActiva?.id],
    queryFn: () => getReembolsosCajaMenor(cajaActiva!.id),
    enabled: !!cajaActiva?.id,
  });

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-gasto'],
    queryFn: getCategoriasGasto,
  });

  const { data: cajasBancos = [] } = useQuery({
    queryKey: ['cajas-bancos-balances'],
    queryFn: getCajasBancos,
  });

  const { data: empresaConfig } = useQuery({
    queryKey: ['empresa-config'],
    queryFn: getEmpresaConfig,
  });

  // Mutación eliminar gasto pendiente
  const mutDeleteGasto = useMutation({
    mutationFn: (id: number) => deleteGastoCajaMenor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos-caja-menor', cajaActiva?.id] });
      qc.invalidateQueries({ queryKey: ['cajas-menores'] });
    },
    onError: (err: any) => alert(getApiError(err)),
  });

  // Gastos pendientes vs reembolsados
  const gastosPendientes = useMemo(() => {
    return gastos.filter((g) => g.estado === 'PENDIENTE');
  }, [gastos]);

  // Porcentaje disponible
  const pctDisponible = useMemo(() => {
    if (!cajaActiva || cajaActiva.montoAsignado <= 0) return 0;
    return Math.round((cajaActiva.saldoDisponible / cajaActiva.montoAsignado) * 100);
  }, [cajaActiva]);

  // Impresión Planilla de Reembolso
  const imprimirPlanillaReembolso = (reem: any) => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;

    const fechaFormateada = new Date(reem.fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Planilla de Reembolso ${reem.consecutivo}</title>
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
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center; }
          .sig-line { border-top: 1px solid #475569; padding-top: 6px; font-weight: 600; font-size: 11px; color: #334155; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${empresaConfig?.nombreComercial || empresaConfig?.nombre || 'EDATIA ERP'}</div>
            <div style="font-size: 12px; color: #64748b;">NIT: ${empresaConfig?.nit || '—'}</div>
            <div style="font-size: 12px; color: #4338ca; font-weight: bold; margin-top: 2px;">Caja Menor: ${cajaActiva?.nombre || ''} (${cajaActiva?.codigo || ''})</div>
          </div>
          <div style="text-align: right;">
            <div class="title">REEMBOLSO DE CAJA MENOR</div>
            <div class="num">${reem.consecutivo}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Fecha: ${fechaFormateada}</div>
            ${reem.comprobante?.numero ? `<div style="font-size: 11px; font-weight:bold; color:#4338ca;">Comprobante Contable: ${reem.comprobante.numero}</div>` : ''}
          </div>
        </div>

        <div class="box">
          <div class="grid2">
            <div>
              <span style="color:#64748b; font-size:11px;">RESPONSABLE DEL FONDO:</span><br/>
              <strong>${cajaActiva?.responsable || 'Encargado'}</strong>
            </div>
            <div>
              <span style="color:#64748b; font-size:11px;">FONDO FIJO ASIGNADO:</span><br/>
              <strong style="font-size: 15px;">${cop(Number(cajaActiva?.montoAsignado ?? 0))}</strong>
            </div>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;" class="grid2">
            <div>
              <span style="color:#64748b; font-size:11px;">REPOSICIÓN GIRADA DESDE:</span><br/>
              <strong>${reem.origenCajaBanco?.nombre || 'Banco Principal'}</strong>
            </div>
            <div style="text-align: right;">
              <span style="color:#64748b; font-size:11px;">TOTAL A REEMBOLSAR:</span><br/>
              <strong style="font-size: 16px; color: #166534;">${cop(Number(reem.totalReembolsado))}</strong>
            </div>
          </div>
        </div>

        <div style="font-size: 12px; font-weight: bold; color: #334155; margin-top: 20px;">RELACIÓN DE RECIBOS Y GASTOS LEGALIZADOS</div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vale / Recibo</th>
              <th>Beneficiario</th>
              <th>Concepto</th>
              <th>Cuenta PUC</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${(reem.gastos || []).map((g: any) => `
              <tr>
                <td>${new Date(g.fecha).toLocaleDateString('es-CO')}</td>
                <td>${g.numeroRecibo || '—'}</td>
                <td><strong>${g.beneficiario}</strong></td>
                <td>${g.concepto}</td>
                <td>${g.cuentaGasto?.codigo || ''} ${g.cuentaGasto?.nombre || ''}</td>
                <td class="text-right text-bold">${cop(Number(g.valor))}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="5" class="text-right">TOTAL GASTOS REEMBOLSADOS:</td>
              <td class="text-right text-bold" style="color:#166534;">${cop(Number(reem.totalReembolsado))}</td>
            </tr>
          </tfoot>
        </table>

        ${reem.observaciones ? `<div style="margin-top: 15px; font-size: 11px; color: #64748b;"><strong>Observaciones:</strong> ${reem.observaciones}</div>` : ''}

        <div class="signatures">
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-line">Responsable de Caja Menor (Entrega Vales)</div>
          </div>
          <div>
            <div style="height: 45px;"></div>
            <div class="sig-line">Aprobado / Contabilidad (Gira Reposición)</div>
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
            <Coins className="text-amber-600" size={26} /> Tesorería: Control y Reembolso de Caja Menor
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Administración de fondos fijos para gastos menores en efectivo (cafetería, aseo, taxis, papelería)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {cajas.length > 1 && (
            <select
              value={cajaActiva?.id || ''}
              onChange={(e) => setCajaSeleccionadaId(Number(e.target.value))}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm outline-none"
            >
              {cajas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.codigo})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowModalNuevaCaja(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus size={14} /> Nueva Caja Menor
          </button>
        </div>
      </div>

      {loadingCajas && (
        <div className="py-16 text-center text-slate-400 font-medium">Cargando cajas menores...</div>
      )}

      {!loadingCajas && cajas.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Coins size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">No tienes una Caja Menor configurada</h2>
          <p className="text-slate-500 text-sm">
            Crea tu primer fondo fijo de caja menor (ej. \$500.000) para registrar gastos diarios en efectivo como tintos, taxis o papelería.
          </p>
          <button
            onClick={() => setShowModalNuevaCaja(true)}
            className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-amber-700"
          >
            + Crear mi primera Caja Menor
          </button>
        </div>
      )}

      {cajaActiva && (
        <>
          {/* Tarjeta Resumen del Fondo Activo */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Info Caja */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Fondo Fijo</span>
                <h3 className="text-2xl font-black text-white">{cajaActiva.nombre}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Código: <span className="font-mono text-slate-200">{cajaActiva.codigo}</span> • Responsable:{' '}
                  <span className="text-slate-200 font-semibold">{cajaActiva.responsable}</span>
                </p>
              </div>

              {/* Monto Asignado */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="text-xs font-semibold text-slate-300 block mb-0.5">Fondo Fijo Asignado</span>
                <span className="text-xl font-extrabold text-white">{cop(cajaActiva.montoAsignado)}</span>
              </div>

              {/* Saldo Disponible */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-xs font-semibold text-slate-300">Saldo Disponible en Efectivo</span>
                  <span className="text-xs font-bold text-green-400">{pctDisponible}%</span>
                </div>
                <span className="text-xl font-extrabold text-green-400">{cop(cajaActiva.saldoDisponible)}</span>
                {/* Progress bar */}
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      pctDisponible > 40 ? 'bg-green-400' : pctDisponible > 15 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, pctDisponible))}%` }}
                  />
                </div>
              </div>

              {/* Gastos por Reembolsar */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-0.5">Gastos por Reembolsar</span>
                  <span className="text-xl font-extrabold text-amber-300">{cop(cajaActiva.totalGastosPendientes)}</span>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    {cajaActiva.conteoGastosPendientes} vale(s) pendientes
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Acciones de la Caja */}
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="text-xs text-slate-300">
                Cuenta contable asignada:{' '}
                <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                  {cajaActiva.cuentaPUC} (Caja Menor)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModalGasto(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-all shadow-md"
                >
                  <Plus size={16} /> Registrar Gasto Menor
                </button>

                <button
                  onClick={() => setShowModalReembolso(true)}
                  disabled={cajaActiva.totalGastosPendientes <= 0}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  <RotateCcw size={16} /> Reembolsar Caja Menor ({cop(cajaActiva.totalGastosPendientes)})
                </button>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'pendientes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Receipt size={16} /> Gastos por Reembolsar ({gastosPendientes.length})
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'historial'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <FileSpreadsheet size={16} /> Historial de Reembolsos ({reembolsos.length})
            </button>
          </div>

          {/* TAB 1: GASTOS PENDIENTES */}
          {activeTab === 'pendientes' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loadingGastos && (
                <div className="py-12 text-center text-slate-400 text-sm">Cargando vales de gastos...</div>
              )}

              {!loadingGastos && gastosPendientes.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-slate-700 font-bold text-sm">No hay gastos pendientes por reembolsar</p>
                  <p className="text-slate-400 text-xs">
                    El fondo de esta caja menor se encuentra al 100% de su saldo disponible.
                  </p>
                </div>
              )}

              {!loadingGastos && gastosPendientes.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Vale / Recibo</th>
                        <th className="py-3 px-4">Beneficiario</th>
                        <th className="py-3 px-4">Concepto del Gasto</th>
                        <th className="py-3 px-4">Categoría / Cuenta PUC</th>
                        <th className="py-3 px-4 text-right">Valor Pagado</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gastosPendientes.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(g.fecha).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {g.numeroRecibo || '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{g.beneficiario}</div>
                            {g.beneficiarioDoc && (
                              <div className="text-[11px] text-slate-400">Doc: {g.beneficiarioDoc}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">{g.concepto}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {getCategoriaIcon(g.categoriaGasto)}
                              <span className="text-xs font-semibold text-slate-700">{g.categoriaGasto}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {g.cuentaGasto?.codigo} • {g.cuentaGasto?.nombre}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                            {cop(Number(g.valor))}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar el vale de gasto por ${cop(Number(g.valor))}?`)) {
                                  mutDeleteGasto.mutate(g.id);
                                }
                              }}
                              title="Eliminar vale de gasto"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold text-slate-800">
                        <td colSpan={5} className="py-3 px-4 text-right">
                          TOTAL A REEMBOLSAR:
                        </td>
                        <td className="py-3 px-4 text-right text-base text-amber-600">
                          {cop(cajaActiva.totalGastosPendientes)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORIAL DE REEMBOLSOS */}
          {activeTab === 'historial' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {reembolsos.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Aún no se han generado reembolsos contables para esta caja menor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">N° Reembolso</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Comprobante Contable</th>
                        <th className="py-3 px-4">Caja/Banco Reembolsador</th>
                        <th className="py-3 px-4 text-center">Vales Legalizados</th>
                        <th className="py-3 px-4 text-right">Total Repuesto</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reembolsos.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {r.consecutivo}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(r.fecha).toLocaleDateString('es-CO')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                            {r.comprobante?.numero || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                            {r.origenCajaBanco?.nombre || 'Banco Principal'}
                          </td>
                          <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-600">
                            {r.gastos?.length || 0} recibos
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-green-700 whitespace-nowrap">
                            {cop(Number(r.totalReembolsado))}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => imprimirPlanillaReembolso(r)}
                              title="Imprimir Planilla de Reembolso"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Printer size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Nueva Caja Menor */}
      {showModalNuevaCaja && (
        <ModalNuevaCajaMenor
          onClose={() => setShowModalNuevaCaja(false)}
          cajasBancos={cajasBancos}
          onSuccess={(creada: any) => {
            setShowModalNuevaCaja(false);
            qc.invalidateQueries({ queryKey: ['cajas-menores'] });
            setCajaSeleccionadaId(creada.id);
          }}
        />
      )}

      {/* Modal Registrar Gasto Menor */}
      {showModalGasto && cajaActiva && (
        <ModalNuevoGastoMenor
          cajaActiva={cajaActiva}
          categoriasData={categoriasData}
          onClose={() => setShowModalGasto(false)}
          onSuccess={() => {
            setShowModalGasto(false);
            qc.invalidateQueries({ queryKey: ['gastos-caja-menor', cajaActiva.id] });
            qc.invalidateQueries({ queryKey: ['cajas-menores'] });
          }}
        />
      )}

      {/* Modal Reembolso */}
      {showModalReembolso && cajaActiva && (
        <ModalReembolsoCajaMenor
          cajaActiva={cajaActiva}
          cajasBancos={cajasBancos}
          onClose={() => setShowModalReembolso(false)}
          onSuccess={(reem: any) => {
            setShowModalReembolso(false);
            qc.invalidateQueries({ queryKey: ['gastos-caja-menor', cajaActiva.id] });
            qc.invalidateQueries({ queryKey: ['reembolsos-caja-menor', cajaActiva.id] });
            qc.invalidateQueries({ queryKey: ['cajas-menores'] });
            qc.invalidateQueries({ queryKey: ['cajas-bancos-balances'] });
            imprimirPlanillaReembolso(reem);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: REGISTRAR GASTO MENOR
// ─────────────────────────────────────────────────────────────────────────────

function ModalNuevoGastoMenor({
  cajaActiva,
  categoriasData,
  onClose,
  onSuccess,
}: {
  cajaActiva: CajaMenorType;
  categoriasData: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [beneficiarioDoc, setBeneficiarioDoc] = useState('');
  const [categoriaGasto, setCategoriaGasto] = useState(
    categoriasData?.categorias?.[0]?.nombre || 'Cafetería y Aseo'
  );
  const [concepto, setConcepto] = useState('');
  const [cuentaGastoId, setCuentaGastoId] = useState<number | null>(null);
  const [valor, setValor] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronizar cuenta contable recomendada
  useEffect(() => {
    if (categoriasData?.categorias && categoriasData.categorias.length > 0) {
      const found = categoriasData.categorias.find((c: any) => c.nombre === categoriaGasto || String(c.id) === categoriaGasto);
      if (found && found.cuentaPUCId) {
        setCuentaGastoId(found.cuentaPUCId);
        return;
      }
    }
    if (categoriasData?.cuentasPUC && categoriasData.cuentasPUC.length > 0 && !cuentaGastoId) {
      setCuentaGastoId(categoriasData.cuentasPUC[0].id);
    }
  }, [categoriaGasto, categoriasData]);

  const mutCrear = useMutation({
    mutationFn: (dto: any) => createGastoCajaMenor(cajaActiva.id, dto),
    onSuccess,
    onError: (err: any) => setErrorMsg(getApiError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (valor <= 0) {
      setErrorMsg('El valor del gasto debe ser mayor a 0');
      return;
    }
    if (valor > cajaActiva.saldoDisponible) {
      setErrorMsg(
        `El valor ($${valor.toLocaleString('es-CO')}) excede el saldo disponible de la caja menor ($${cajaActiva.saldoDisponible.toLocaleString('es-CO')})`
      );
      return;
    }
    if (!beneficiario.trim()) {
      setErrorMsg('Indique a quién se le pagó el dinero');
      return;
    }
    if (!concepto.trim()) {
      setErrorMsg('Indique el concepto del gasto');
      return;
    }
    if (!cuentaGastoId) {
      setErrorMsg('Seleccione la cuenta contable de gasto PUC');
      return;
    }

    mutCrear.mutate({
      fecha,
      numeroRecibo: numeroRecibo.trim() || undefined,
      beneficiario: beneficiario.trim(),
      beneficiarioDoc: beneficiarioDoc.trim() || undefined,
      concepto: concepto.trim(),
      categoriaGasto,
      cuentaGastoId,
      valor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Coins size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Registrar Gasto de Caja Menor</h2>
              <p className="text-xs text-slate-400">Fondo: {cajaActiva.nombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 flex-1">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">N° Vale / Recibo</label>
              <input
                type="text"
                placeholder="Ej. V-012"
                value={numeroRecibo}
                onChange={(e) => setNumeroRecibo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Categoría del Gasto *</label>
            <select
              value={categoriaGasto}
              onChange={(e) => {
                const val = e.target.value;
                setCategoriaGasto(val);
                const found = categoriasData?.categorias?.find((c: any) => c.nombre === val || String(c.id) === val);
                if (found && found.cuentaPUCId) {
                  setCuentaGastoId(found.cuentaPUCId);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              {categoriasData?.categorias && categoriasData.categorias.length > 0 ? (
                categoriasData.categorias.map((c: any) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre} {c.descripcion ? `— ${c.descripcion}` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="Cafetería y Aseo">Cafetería, tintos y aseo</option>
                  <option value="Transporte y Movilidad">Transporte, taxis y mensajería</option>
                  <option value="Papelería y Útiles">Papelería, fotocopias y útiles</option>
                  <option value="Mantenimiento Menor">Mantenimiento menor locativo</option>
                  <option value="Gastos Generales">Otros gastos diversos</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Pagado a (Persona/Negocio) *</label>
              <input
                type="text"
                placeholder="Ej. Tienda de la esquina / Taxista"
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">C.C. o NIT (Opcional)</label>
              <input
                type="text"
                placeholder="10203040"
                value={beneficiarioDoc}
                onChange={(e) => setBeneficiarioDoc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Concepto / Detalle *</label>
            <input
              type="text"
              placeholder="Ej. 1 Libra de café y azúcar para la oficina"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Cuenta PUC Imputada *</label>
            <select
              value={cuentaGastoId || ''}
              onChange={(e) => setCuentaGastoId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl outline-none bg-white"
            >
              {categoriasData?.cuentasPUC?.map((cp: any) => (
                <option key={cp.id} value={cp.id}>
                  {cp.codigo} — {cp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-600">Valor Pagado en Efectivo ($) *</label>
              <span className="text-[11px] text-slate-400">
                Disponible: <strong className="text-green-600">{cop(cajaActiva.saldoDisponible)}</strong>
              </span>
            </div>
            <CurrencyInput
              value={valor}
              onChange={(val) => setValor(val)}
              placeholder="0"
              className="w-full px-3 py-2 text-base font-bold border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          </div>

          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutCrear.isLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {mutCrear.isLoading ? 'Guardando...' : 'Guardar Vale de Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: REEMBOLSAR CAJA MENOR
// ─────────────────────────────────────────────────────────────────────────────

function ModalReembolsoCajaMenor({
  cajaActiva,
  cajasBancos,
  onClose,
  onSuccess,
}: {
  cajaActiva: CajaMenorType;
  cajasBancos: any[];
  onClose: () => void;
  onSuccess: (reem: any) => void;
}) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [origenCajaBancoId, setOrigenCajaBancoId] = useState<string>(
    cajasBancos.length > 0 ? String(cajasBancos[0].id) : ''
  );
  const [observaciones, setObservaciones] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const mutReembolsar = useMutation({
    mutationFn: (dto: any) => reembolsarCajaMenor(cajaActiva.id, dto),
    onSuccess,
    onError: (err: any) => setErrorMsg(getApiError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    mutReembolsar.mutate({
      fecha,
      origenCajaBancoId: origenCajaBancoId ? Number(origenCajaBancoId) : undefined,
      observaciones: observaciones.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RotateCcw size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Reembolso de Caja Menor</h2>
              <p className="text-xs text-slate-400">Reponer fondo a {cop(cajaActiva.montoAsignado)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <span className="text-xs font-semibold text-amber-800 block">Monto Total a Reponer</span>
            <span className="text-2xl font-black text-amber-950">{cop(cajaActiva.totalGastosPendientes)}</span>
            <span className="text-xs text-amber-700 block mt-1">
              Legaliza {cajaActiva.conteoGastosPendientes} vale(s) pendientes
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Fecha del Reembolso *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Girar Dinero Desde (Banco / Caja Principal) *
            </label>
            <select
              value={origenCajaBancoId}
              onChange={(e) => setOrigenCajaBancoId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              {cajasBancos.map((cb: any) => (
                <option key={cb.id} value={cb.id}>
                  {cb.nombre} — Saldo: {cop(Number(cb.saldoContable ?? 0))}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. Cheque / Transferencia para reposición de caja menor"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed">
            Se generará automáticamente un <strong>Comprobante de Egreso Contable [CP]</strong> imputando cada gasto a su
            cuenta 51xx y acreditando el banco seleccionado.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutReembolsar.isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutReembolsar.isLoading ? 'Generando Reembolso...' : 'Confirmar y Girar Reembolso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: NUEVA CAJA MENOR
// ─────────────────────────────────────────────────────────────────────────────

function ModalNuevaCajaMenor({
  onClose,
  cajasBancos,
  onSuccess,
}: {
  onClose: () => void;
  cajasBancos: any[];
  onSuccess: (data: any) => void;
}) {
  const [nombre, setNombre] = useState('Caja Menor Principal');
  const [codigo, setCodigo] = useState('CM-01');
  const [responsable, setResponsable] = useState('');
  const [montoAsignado, setMontoAsignado] = useState<number>(500000);
  const [cuentaPUC, setCuentaPUC] = useState('110510');
  const [cajaBancoId, setCajaBancoId] = useState<string>(
    cajasBancos.length > 0 ? String(cajasBancos[0].id) : ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  const mutCrear = useMutation({
    mutationFn: (dto: any) => createCajaMenor(dto),
    onSuccess,
    onError: (err: any) => setErrorMsg(getApiError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !codigo.trim() || !responsable.trim()) {
      setErrorMsg('Nombre, código y responsable son requeridos');
      return;
    }
    if (montoAsignado < 1000) {
      setErrorMsg('El fondo fijo debe ser al menos de $1.000');
      return;
    }

    mutCrear.mutate({
      nombre: nombre.trim(),
      codigo: codigo.trim(),
      responsable: responsable.trim(),
      montoAsignado,
      cuentaPUC: cuentaPUC.trim() || '110510',
      cajaBancoId: cajaBancoId ? Number(cajaBancoId) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Crear Fondo de Caja Menor</h2>
              <p className="text-xs text-slate-400">Definir responsable y monto fijo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nombre de la Caja Menor *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Código Único *</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Cuenta PUC</label>
              <input
                type="text"
                value={cuentaPUC}
                onChange={(e) => setCuentaPUC(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Persona Responsable del Fondo *</label>
            <input
              type="text"
              placeholder="Ej. María Gómez (Secretaria / Administradora)"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Monto Asignado al Fondo Fijo ($) *</label>
            <CurrencyInput
              value={montoAsignado}
              onChange={(val) => setMontoAsignado(val)}
              className="w-full px-3 py-2 text-base font-bold border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Banco / Caja Principal de Origen</label>
            <select
              value={cajaBancoId}
              onChange={(e) => setCajaBancoId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              <option value="">— Sin banco preferente —</option>
              {cajasBancos.map((cb: any) => (
                <option key={cb.id} value={cb.id}>
                  {cb.nombre} ({cb.tipo})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutCrear.isLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
            >
              {mutCrear.isLoading ? 'Creando...' : 'Crear Caja Menor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

