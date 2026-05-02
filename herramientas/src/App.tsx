import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
const Landing = React.lazy(() => import('./pages/Landing'));
const Cartera = React.lazy(() => import('./pages/Cartera'));

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-brand-blue selection:text-white">
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-navy-800 dark:text-white border dark:border-navy-700' }} />
      <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/cartera" element={<Cartera />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}

export default App;
