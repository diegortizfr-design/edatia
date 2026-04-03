import { Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-indigo-600">Edatia ERP</h1>
          <nav className="hidden md:flex gap-4 ml-6 uppercase text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-indigo-600">Dashboard</Link>
            <Link to="/login" className="hover:text-indigo-600">Acceso</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-sm font-medium text-slate-600">Admin</span>
           <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200" />
        </div>
      </header>

      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer className="p-6 text-center text-slate-400 text-xs border-t border-slate-200">
        &copy; 2026 Edatia SaaS Premium. Todos los derechos reservados.
      </footer>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold tracking-tighter">Bienvenido a Edatia</h2>
      <p className="text-slate-500 text-lg">La plataforma SaaS para la gestión integral de tu empresa.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
         <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-400 uppercase text-xs">Ventas Hoy</h3>
            <p className="text-2xl font-bold mt-2">$2,450.00</p>
         </div>
         <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-400 uppercase text-xs">Productos</h3>
            <p className="text-2xl font-bold mt-2">1,240</p>
         </div>
         <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-400 uppercase text-xs">Terceros</h3>
            <p className="text-2xl font-bold mt-2">452</p>
         </div>
      </div>
    </div>
  )
}

function Login() {
  return (
    <div className="max-w-md mx-auto p-10 bg-white rounded-3xl shadow-xl border border-slate-100 mt-12">
      <h2 className="text-2xl font-bold text-center mb-8">Iniciar Sesión</h2>
      <div className="space-y-4">
        <input type="email" placeholder="Correo electrónico" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
        <input type="password" placeholder="Contraseña" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
        <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">
          Entrar al Sistema
        </button>
      </div>
    </div>
  )
}

export default App
