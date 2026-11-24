import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, SwitchCamera, Zap, ZapOff, CheckCircle2, AlertTriangle, Layers, Volume2 } from 'lucide-react'

// Sintetizador nativo de pitido de escaneo POS (880Hz, 120ms) sin depender de archivos de audio externos
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(950, ctx.currentTime)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  } catch {
    // Ignorar si el navegador bloquea el contexto de audio
  }
}

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => { found: boolean; productName?: string; price?: number } | Promise<{ found: boolean; productName?: string; price?: number }>
  isDark?: boolean
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  isDark = false,
}: BarcodeScannerModalProps) {
  const [scannerReady, setScannerReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<{
    code: string
    found: boolean
    productName?: string
    price?: number
    time: Date
  } | null>(null)
  const [continuousMode, setContinuousMode] = useState(true)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastCodeTimeRef = useRef<{ code: string; timestamp: number }>({ code: '', timestamp: 0 })

  useEffect(() => {
    if (!isOpen) return

    const containerId = 'edatia-barcode-scanner'
    let isMounted = true

    async function initScanner() {
      try {
        setErrorMessage(null)
        setScannerReady(false)

        // Obtener lista de cámaras del dispositivo
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          setCameras(devices)
          // Priorizar cámara trasera (back / environment)
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('trasera') || 
            d.label.toLowerCase().includes('environment')
          )
          const camIdToUse = backCam ? backCam.id : devices[devices.length - 1].id
          setSelectedCameraId(camIdToUse)
        }

        const html5Qr = new Html5Qrcode(containerId)
        scannerRef.current = html5Qr

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 160 }, // Visor rectangular optimizado para códigos de barra horizontales 1D
          aspectRatio: 1.333,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.ITF,
          ],
        }

        await html5Qr.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isMounted) return
            handleBarcodeScanned(decodedText.trim())
          },
          () => {
            // Error por frame no detectado (comportamiento normal)
          }
        )

        if (isMounted) {
          setScannerReady(true)
          // Verificar soporte de linterna/torch
          try {
            const capabilities = html5Qr.getRunningTrackCapabilities() as any
            if (capabilities && capabilities.torch) {
              setHasTorch(true)
            }
          } catch {
            // Linterna no disponible en este hardware
          }
        }
      } catch (err: any) {
        console.error('Error al inicializar cámara:', err)
        if (isMounted) {
          if (err.name === 'NotAllowedError' || String(err).includes('Permission denied')) {
            setErrorMessage('Permiso de cámara denegado. Permite el acceso a la cámara en el navegador para escanear.')
          } else if (err.name === 'NotFoundError' || String(err).includes('device not found')) {
            setErrorMessage('No se detectó cámara en el dispositivo.')
          } else {
            setErrorMessage(err.message || 'No se pudo acceder a la cámara de la tablet.')
          }
        }
      }
    }

    // Pequeño timeout para permitir que el modal renderice el div contenedor en el DOM
    const timer = setTimeout(() => {
      initScanner()
    }, 150)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear()
            }).catch(() => {})
          } else {
            scannerRef.current.clear()
          }
        } catch {}
      }
    }
  }, [isOpen])

  const handleBarcodeScanned = async (rawCode: string) => {
    const cleanCode = rawCode.trim()
    if (!cleanCode) return

    const now = Date.now()
    // Debounce de 1.5 segundos para evitar leer el mismo código 10 veces en una fracción de segundo
    if (
      lastCodeTimeRef.current.code === cleanCode &&
      now - lastCodeTimeRef.current.timestamp < 1500
    ) {
      return
    }

    lastCodeTimeRef.current = { code: cleanCode, timestamp: now }

    // Feedback táctil y sonoro
    playBeep()
    if (navigator.vibrate) {
      navigator.vibrate(80)
    }

    // Invocar callback de búsqueda y adición al carrito
    try {
      const res = await Promise.resolve(onScan(cleanCode))

      setLastScanned({
        code: cleanCode,
        found: res?.found ?? false,
        productName: res?.productName,
        price: res?.price,
        time: new Date(),
      })

      // Si no está en modo continuo y fue encontrado, cerramos de inmediato
      if (!continuousMode && res?.found) {
        setTimeout(() => {
          onClose()
        }, 350)
      }
    } catch (e) {
      console.error('Error al procesar escaneo:', e)
      setLastScanned({
        code: cleanCode,
        found: false,
        time: new Date(),
      })
    }
  }

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return
    try {
      const nextState = !torchOn
      await (scannerRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextState }],
      })
      setTorchOn(nextState)
    } catch (e) {
      console.error('Error al encender linterna:', e)
    }
  }

  const switchCamera = async () => {
    if (!scannerRef.current || cameras.length < 2) return
    try {
      const currentIndex = cameras.findIndex(c => c.id === selectedCameraId)
      const nextIndex = (currentIndex + 1) % cameras.length
      const nextCam = cameras[nextIndex]
      setSelectedCameraId(nextCam.id)

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop()
      }

      await scannerRef.current.start(
        nextCam.id,
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.333,
        },
        (decodedText) => handleBarcodeScanned(decodedText.trim()),
        () => {}
      )
    } catch (err: any) {
      console.error('Error al cambiar cámara:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden flex flex-col shadow-2xl border transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-850' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Camera size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">Escanear Código de Barras</h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Cámara de la tablet con detección automática
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition-colors ${
                  torchOn
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:bg-slate-200 bg-slate-100'
                }`}
                title="Encender / Apagar Linterna"
              >
                {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
              </button>
            )}

            {cameras.length > 1 && (
              <button
                type="button"
                onClick={switchCamera}
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-600 hover:bg-slate-200 bg-slate-100'
                }`}
                title="Cambiar Cámara"
              >
                <SwitchCamera size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex items-center justify-center min-h-[280px] sm:min-h-[320px] overflow-hidden">
          <div id="edatia-barcode-scanner" className="w-full h-full" />

          {/* Scanner HUD Overlay */}
          {scannerReady && !errorMessage && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Visor con esquinas iluminadas */}
              <div className="w-[280px] h-[160px] relative rounded-2xl border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Esquinas guía */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

                {/* Línea láser de escaneo animada */}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse" />
              </div>

              {/* Instrucción flotante */}
              <div className="absolute bottom-4 inset-x-4 text-center">
                <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide border border-white/10 shadow-lg">
                  Alinea el código de barras en el recuadro
                </span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {!scannerReady && !errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold">Iniciando cámara de la tablet...</p>
              <p className="text-[10px] text-slate-400 mt-1">Concede permiso de cámara si el navegador lo solicita.</p>
            </div>
          )}

          {/* Error State */}
          {errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <AlertTriangle size={24} />
              </div>
              <p className="text-sm font-bold text-rose-300 mb-1">Acceso a Cámara</p>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Live Feedback Banner */}
        {lastScanned && (
          <div
            className={`p-3.5 border-t flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 ${
              lastScanned.found
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {lastScanned.found ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 size={18} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle size={18} />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {lastScanned.found
                    ? `✓ Agregado: ${lastScanned.productName}`
                    : `Código "${lastScanned.code}" no encontrado`}
                </div>
                <div className="text-[10px] opacity-75 font-mono">
                  {lastScanned.found
                    ? `Precio: $${lastScanned.price?.toLocaleString('es-CO')} • Código: ${lastScanned.code}`
                    : 'Verifique si el producto está registrado en el inventario'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Controls Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'
        }`}>
          {/* Selector de Modo Continuo */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={e => setContinuousMode(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
            />
            <span className="font-bold text-xs">
              Modo Rápido Continuo (escanear múltiples productos)
            </span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <Volume2 size={12} /> Pitido POS activo
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Listo / Cerrar
            </button>
          </div>
        </div>

        {/* Tip Informativo para Lectores Bluetooth / USB */}
        <div className={`px-4 py-2 text-[10px] border-t flex items-center justify-between ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-500' : 'bg-slate-100/70 border-slate-200 text-slate-500'
        }`}>
          <span>
            💡 <strong>Tip:</strong> También puedes usar pistolas láser Bluetooth o USB-OTG directo a la tablet sin abrir la cámara.
          </span>
        </div>
      </div>
    </div>
  )
}
