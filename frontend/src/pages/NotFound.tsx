import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <p className="text-7xl font-black text-slate-200">404</p>
      <h2 className="text-2xl font-bold text-slate-700 mt-4">Página no encontrada</h2>
      <p className="text-slate-500 mt-2">La ruta que buscas no existe en este sistema.</p>
      <Link
        to="/"
        className="mt-6 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Volver al Dashboard
      </Link>
    </div>
  )
}
