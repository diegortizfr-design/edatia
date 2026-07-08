import { useQuery } from '@tanstack/react-query'
import { getCajasBancos } from '../../services/erp.service'
import { Wallet, Landmark, TrendingUp, DollarSign, ArrowRightLeft, CheckCircle2, XCircle } from 'lucide-react'

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

export function CajasBancosList() {
  const { data: list = [], isLoading, error } = useQuery({
    queryKey: ['cajas-bancos-balances'],
    queryFn: getCajasBancos,
    refetchInterval: 15000, // Refrescar automáticamente cada 15s para simular tiempo real
  })

  // Cálculos de KPIs
  const totalCajas = list
    .filter((c: any) => c.tipo === 'CAJA' && c.activo)
    .reduce((acc: number, c: any) => acc + Number(c.saldoContable ?? 0), 0)

  const totalBancos = list
    .filter((c: any) => c.tipo === 'BANCO' && c.activo)
    .reduce((acc: number, c: any) => acc + Number(c.saldoContable ?? 0), 0)

  const totalGeneral = totalCajas + totalBancos

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="text-indigo-650" size={26} /> Tesorería: Saldos de Cajas y Bancos
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Visualización y control de saldos monetarios en libros contables en tiempo real
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cajas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Efectivo en Cajas</span>
            <span className="text-xl font-bold text-slate-800">{cop(totalCajas)}</span>
          </div>
        </div>

        {/* Total Bancos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <Landmark size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Saldos en Bancos</span>
            <span className="text-xl font-bold text-slate-800">{cop(totalBancos)}</span>
          </div>
        </div>

        {/* Balance General */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-md p-5 flex items-center gap-4">
          <div className="bg-white/20 text-white p-3 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs text-indigo-100 font-semibold block uppercase tracking-wider">Suma Total de Fondos</span>
            <span className="text-2xl font-black">{cop(totalGeneral)}</span>
          </div>
        </div>
      </div>

      {/* Listado de Cuentas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">Cuentas Financieras Registradas</h2>
          <span className="text-xs text-slate-400 font-semibold">{list.length} Cuenta(s)</span>
        </div>

        {isLoading && (
          <div className="p-16 text-center text-slate-400">
            <ArrowRightLeft className="animate-spin mx-auto mb-3 opacity-30" size={36} />
            <p className="text-sm">Calculando saldos contables en tiempo real...</p>
          </div>
        )}

        {error && (
          <div className="p-16 text-center text-red-500">
            <p className="font-semibold">Error al cargar saldos de tesorería</p>
          </div>
        )}

        {!isLoading && !error && list.length === 0 && (
          <div className="p-16 text-center text-slate-400">
            <Wallet className="mx-auto mb-3 opacity-30" size={40} />
            <p className="text-sm">No hay cuentas de caja o banco configuradas para la empresa.</p>
          </div>
        )}

        {!isLoading && !error && list.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/20">
                  <th className="px-6 py-3.5 text-left font-bold">Nombre / Entidad</th>
                  <th className="px-6 py-3.5 text-left font-bold">Tipo</th>
                  <th className="px-6 py-3.5 text-left font-bold">Detalle Cuenta</th>
                  <th className="px-6 py-3.5 text-left font-bold">Código PUC</th>
                  <th className="px-6 py-3.5 text-right font-bold">Saldo Inicial</th>
                  <th className="px-6 py-3.5 text-right font-bold bg-indigo-50/20 text-indigo-900">Saldo Contable Actual</th>
                  <th className="px-6 py-3.5 text-center font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(list as any[]).map((cb: any) => {
                  const isBanco = cb.tipo === 'BANCO'
                  const isActivo = cb.activo
                  return (
                    <tr key={cb.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isBanco ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {isBanco ? <Landmark size={16} /> : <Wallet size={16} />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{cb.nombre}</span>
                            {isBanco && <span className="text-xs text-slate-400 font-medium">{cb.banco}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isBanco ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                          {cb.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {isBanco ? (
                          <span>
                            {cb.tipoCuenta === 'CORRIENTE' ? 'Corriente' : 'Ahorros'} · #{cb.numeroCuenta}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Caja Física</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                        {cb.cuentaPUC || <span className="text-slate-300 italic">Sin anclar</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {cop(Number(cb.saldoInicial ?? 0))}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 bg-indigo-50/10">
                        <span className={Number(cb.saldoContable ?? 0) < 0 ? 'text-red-650' : 'text-slate-900'}>
                          {cop(Number(cb.saldoContable ?? 0))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex justify-center">
                          {isActivo ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-slate-300" />
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
