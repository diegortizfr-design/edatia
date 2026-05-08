import { useState } from 'react'
import { MessageCircle, Mail, Phone, X, HelpCircle } from 'lucide-react'

export function SupportButton() {
  const [isOpen, setIsOpen] = useState(false)

  const whatsappNumber = "573000000000" // Ficticio por ahora
  const whatsappMessage = encodeURIComponent("Hola, necesito soporte con Edatia ERP. Mi empresa es:")
  const email = "soporte@edatia.com"

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Menu desplegable */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-200 origin-bottom-right">
          <div className="p-4 bg-indigo-600 text-white">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Soporte Edatia
            </h3>
            <p className="text-indigo-100 text-sm mt-1">¿En qué podemos ayudarte hoy?</p>
          </div>
          
          <div className="p-2 space-y-1">
            <a 
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">WhatsApp</p>
                <p className="text-xs text-slate-500">Respuesta rápida (L-V 8am a 6pm)</p>
              </div>
            </a>

            <a 
              href={`mailto:${email}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-700"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Correo Electrónico</p>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
            </a>

            <div className="flex items-center gap-3 p-3 rounded-xl opacity-60 text-slate-700">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Línea Telefónica</p>
                <p className="text-xs text-slate-500">Próximamente</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-slate-800' : 'bg-indigo-600'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
