import { Store, FilePlus, Package, Calculator, Globe, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../lib/utils'

export function Dashboard() {
  const { user } = useAuth()

  const quickAccesses = [
    {
      title: 'Punto de Venta (POS)',
      description: 'Ventas rápidas en mostrador, gestión de turnos y control de caja.',
      href: '/pos',
      icon: Store,
      colorClass: 'from-amber-500 to-orange-600',
      actionText: 'Abrir POS',
      bgHoverClass: 'hover:border-amber-200 hover:shadow-amber-100/30',
    },
    {
      title: 'Crear Factura',
      description: 'Emite facturas de venta oficiales, cotizaciones y comprobantes.',
      href: '/ventas/facturas/nueva',
      icon: FilePlus,
      colorClass: 'from-indigo-500 to-indigo-700',
      actionText: 'Crear Factura',
      bgHoverClass: 'hover:border-indigo-200 hover:shadow-indigo-100/30',
    },
    {
      title: 'Ver Inventario',
      description: 'Administración de stock, control de productos, bodegas y alertas.',
      href: '/inventario/dashboard',
      icon: Package,
      colorClass: 'from-emerald-500 to-teal-600',
      actionText: 'Ver Inventario',
      bgHoverClass: 'hover:border-emerald-200 hover:shadow-emerald-100/30',
    },
    {
      title: 'Ver Contabilidad',
      description: 'Consulta el Plan Único de Cuentas (PUC), comprobantes y reportes.',
      href: '/contabilidad/puc',
      icon: Calculator,
      colorClass: 'from-violet-500 to-purple-600',
      actionText: 'Ver Contabilidad',
      bgHoverClass: 'hover:border-violet-200 hover:shadow-violet-100/30',
    },
    {
      title: 'Módulo Digital',
      description: 'Gestión de tienda online, catálogo digital y automatizaciones.',
      href: '/digital/dashboard',
      icon: Globe,
      colorClass: 'from-sky-500 to-blue-600',
      actionText: 'Módulo Digital',
      bgHoverClass: 'hover:border-sky-200 hover:shadow-sky-100/30',
    },
  ]

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 py-2 px-2">
      {/* ── Encabezado principal ── */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
          ¡Bienvenido{user?.nombre ? `, ${user.nombre.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-slate-400 mt-1 text-xs">
          Centro de Control y Accesos Rápidos — {formatDate(new Date())}
        </p>
      </div>

      {/* ── Grilla de accesos rápidos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {quickAccesses.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.href}
              href={item.href}
              className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group ${item.bgHoverClass}`}
            >
              <div>
                {/* Contenedor de Icono Premium */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.colorClass} flex items-center justify-center text-white shadow-sm transform group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Título */}
                <h3 className="font-bold text-slate-800 text-base tracking-tight mt-4 group-hover:text-indigo-900 transition-colors">
                  {item.title}
                </h3>

                {/* Descripción */}
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed min-h-[36px]">
                  {item.description}
                </p>
              </div>

              {/* Botón / Link de Acción */}
              <div className="mt-5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 group-hover:text-indigo-800 transition-colors">
                <span>{item.actionText}</span>
                <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </a>
          )
        })}
      </div>

      {/* ── Nota o soporte inferior ── */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center mt-2">
        <p className="text-[10px] text-slate-400 font-medium">
          ¿Necesitas ayuda con algún módulo? Ponte en contacto con la mesa de soporte técnico de Edatia desde la pantalla de inicio de sesión.
        </p>
      </div>
    </div>
  )
}
