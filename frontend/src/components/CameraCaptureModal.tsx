import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera, X, RotateCcw, Check, SwitchCamera, Zap, ZapOff,
  AlertCircle, Smartphone, Loader2, Sparkles
} from 'lucide-react'

interface CameraCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  conFondoIa?: boolean
  titulo?: string
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  conFondoIa = false,
  titulo = 'Tomar Foto del Producto'
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [loadingCamera, setLoadingCamera] = useState<boolean>(true)
  const [hasTorch, setHasTorch] = useState<boolean>(false)
  const [torchOn, setTorchOn] = useState<boolean>(false)
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const nativeInputRef = useRef<HTMLInputElement | null>(null)

  // Detener la cámara y liberar recursos
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {
          // ignore
        }
      })
      setStream(null)
    }
  }, [stream])

  // Iniciar el stream de video
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setLoadingCamera(true)
    setCameraError(null)

    // Detener tracks anteriores si existen
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a la cámara por WebRTC.')
      }

      // Detectar si hay más de 1 cámara
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        setHasMultipleCameras(videoDevices.length > 1)
      } catch {
        setHasMultipleCameras(true)
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        }
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        videoRef.current.play().catch(() => {})
      }

      // Verificar si soporta linterna (torch)
      const track = newStream.getVideoTracks()[0]
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {}
        setHasTorch(Boolean(capabilities?.torch))
      }
    } catch (err: any) {
      console.warn('Error al iniciar cámara:', err)
      let msg = 'No se pudo acceder a la cámara.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permiso denegado. Por favor autoriza el acceso a la cámara en los permisos de tu navegador.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No se encontró ninguna cámara conectada en tu dispositivo.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'La cámara ya está siendo utilizada por otra aplicación.'
      }
      setCameraError(msg)
    } finally {
      setLoadingCamera(false)
    }
  }, [stream])

  // Inicializar al abrir
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null)
      setCameraError(null)
      startCamera(facingMode)
    } else {
      stopStream()
      setCapturedImage(null)
      setTorchOn(false)
    }
    return () => {
      stopStream()
    }
  }, [isOpen, facingMode])

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream || !hasTorch) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    try {
      const nextTorch = !torchOn
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }]
      })
      setTorchOn(nextTorch)
    } catch (e) {
      console.warn('No se pudo activar la linterna', e)
    }
  }

  // Cambiar entre cámara frontal y trasera
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
  }

  // Capturar foto del visor
  const handleCapture = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Si es cámara frontal, reflejar horizontalmente para que quede como espejo natural
    if (facingMode === 'user') {
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    setCapturedImage(dataUrl)
  }

  // Descartar captura y volver al visor en vivo
  const handleRetake = () => {
    setCapturedImage(null)
  }

  // Confirmar y subir foto capturada
  const handleConfirm = () => {
    if (!capturedImage) return

    // Convertir dataURL a File
    const arr = capturedImage.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], { type: mime })
    const file = new File([blob], `foto-producto-${Date.now()}.jpg`, { type: 'image/jpeg' })

    stopStream()
    onCapture(file)
    onClose()
  }

  // Fallback con input nativo (especialmente útil en móviles si falla WebRTC)
  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      stopStream()
      onCapture(file)
      onClose()
    }
    if (e.target) e.target.value = ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{titulo}</h3>
              <p className="text-[11px] text-slate-400">
                {capturedImage
                  ? 'Revisa la foto tomada antes de guardarla'
                  : 'Centra el producto dentro de la guía cuadrada'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar cámara"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder / Capture Preview Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px] sm:min-h-[440px]">
          {loadingCamera && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-20 bg-slate-950">
              <Loader2 size={32} className="animate-spin text-emerald-500" />
              <span className="text-xs font-semibold">Iniciando visor de cámara...</span>
            </div>
          )}

          {cameraError && !capturedImage && (
            <div className="p-6 text-center max-w-md flex flex-col items-center gap-3 z-20">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-bold text-white">No se pudo abrir la cámara en vivo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              
              <div className="pt-3 flex flex-col sm:flex-row gap-2 w-full justify-center">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={() => nativeInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Smartphone size={14} />
                  <span>Usar Cámara Nativa</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Video Stream */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
              capturedImage ? 'hidden' : 'block'
            }`}
          />

          {/* Square Guide Overlay (1:1 Framing Box for Product Catalog) */}
          {!capturedImage && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer darkened vignette */}
              <div className="w-[85vw] max-w-[320px] aspect-square rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] relative flex items-center justify-center">
                {/* Corner Accents */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br" />

                {/* Subtle center crosshair */}
                <div className="w-4 h-4 border-t border-l border-white/40 absolute" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300/80 absolute bottom-2 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  Encuadre 1:1
                </span>
              </div>
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="w-full h-full flex items-center justify-center bg-black p-4">
              <img
                src={capturedImage}
                alt="Captura tomada"
                className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
              />
            </div>
          )}

          {/* Top Live Camera Controls (Torch & Camera Switch) */}
          {!capturedImage && !cameraError && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                    torchOn
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/40'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                  title={torchOn ? 'Apagar flash' : 'Encender flash'}
                >
                  {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
                </button>
              )}
              {hasMultipleCameras && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all"
                  title="Cambiar entre cámara trasera y frontal"
                >
                  <SwitchCamera size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Studio IA Badge info if active */}
        {conFondoIa && (
          <div className="px-5 py-2 bg-indigo-950/40 border-t border-indigo-900/40 flex items-center justify-center gap-1.5 text-indigo-300 text-[11px] font-semibold text-center">
            <Sparkles size={13} className="text-indigo-400 shrink-0" />
            <span>Fondo de estudio IA activo: al confirmar se removerá el fondo para dejar blanco puro 1:1.</span>
          </div>
        )}

        {/* Footer / Action Buttons */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                <RotateCcw size={15} />
                <span>Tomar otra</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Check size={16} />
                <span>Usar esta foto</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-800/80 transition-colors"
                title="Abrir la aplicación de cámara nativa del sistema o celular"
              >
                <Smartphone size={14} />
                <span className="hidden sm:inline">Cámara del sistema</span>
              </button>

              {/* Shutter Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={loadingCamera || Boolean(cameraError)}
                  className="w-14 h-14 rounded-full border-4 border-white/90 bg-white/20 hover:bg-white/40 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  title="Capturar foto"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-sm">
                    <Camera size={20} />
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-800/80 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
        </div>

        {/* Input oculto nativo como respaldo 100% garantizado en móviles/tablets */}
        <input
          ref={nativeInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeCapture}
          className="hidden"
        />
      </div>
    </div>
  )
}
