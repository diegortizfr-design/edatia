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
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const nativeInputRef = useRef<HTMLInputElement | null>(null)

  // Detener la cámara y liberar recursos de hardware
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
        throw new Error('Tu navegador no soporta acceso directo a la cámara por WebRTC.')
      }

      // Enumerar cámaras
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

      // Verificar si la cámara soporta linterna (torch)
      const track = newStream.getVideoTracks()[0]
      if (track) {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {}
        setHasTorch(Boolean(capabilities?.torch))
      }
    } catch (err: any) {
      console.warn('Error al iniciar cámara:', err)
      let msg = 'No se pudo acceder a la cámara.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permiso denegado. Permite el acceso a la cámara en la barra de direcciones de tu navegador.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No se detectó ninguna cámara disponible en tu dispositivo.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'La cámara está siendo utilizada por otra app o pestaña.'
      }
      setCameraError(msg)
    } finally {
      setLoadingCamera(false)
    }
  }, [stream])

  // Manejo de apertura y cierre
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null)
      setCameraError(null)
      setTorchOn(false)
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

  // Toggle Torch (linterna)
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

  // Capturar foto: Recorta exactamente el área cuadrada 1:1 indicada por la guía visual
  const handleCapture = () => {
    const video = videoRef.current
    if (!video) return

    const vWidth = video.videoWidth || 1280
    const vHeight = video.videoHeight || 720

    // Recorte 1:1 centrado
    const cropSize = Math.min(vWidth, vHeight)
    const sx = (vWidth - cropSize) / 2
    const sy = (vHeight - cropSize) / 2

    const canvas = document.createElement('canvas')
    const targetSize = Math.min(cropSize, 1400) // Resolución de alta calidad para e-commerce
    canvas.width = targetSize
    canvas.height = targetSize

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Espejo en cámara frontal
    if (facingMode === 'user') {
      ctx.translate(targetSize, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(
      video,
      sx, sy, cropSize, cropSize,
      0, 0, targetSize, targetSize
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    setCapturedImage(dataUrl)
  }

  // Descartar y volver al visor
  const handleRetake = () => {
    setCapturedImage(null)
  }

  // Confirmar y subir foto
  const handleConfirm = () => {
    if (!capturedImage) return

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

  // Fallback con input nativo para teléfonos
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
      {/* Contenedor principal: En móviles es 100% pantalla completa; en desktop es una tarjeta modal centrada */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-md md:max-w-lg bg-black sm:bg-slate-900 sm:rounded-3xl sm:border sm:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header superior */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Camera size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs">
                {titulo}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {capturedImage ? 'Revisa la foto antes de guardar' : 'Centra el producto en el recuadro 1:1'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Controles de cámara en el header */}
            {!capturedImage && !cameraError && (
              <>
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2 rounded-xl transition-all ${
                      torchOn
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                    title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
                  >
                    {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                  </button>
                )}

                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
                    title="Alternar cámara trasera / frontal"
                  >
                    <SwitchCamera size={16} />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
              title="Cerrar cámara"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Área del Visor / Cámara */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[320px] sm:min-h-[420px]">
          {loadingCamera && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-20 bg-slate-950">
              <Loader2 size={32} className="animate-spin text-emerald-500" />
              <span className="text-xs font-semibold">Iniciando cámara...</span>
            </div>
          )}

          {cameraError && !capturedImage && (
            <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3 z-20">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-bold text-white">No se pudo acceder a la cámara</h4>
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
                  <span>Usar Cámara del Teléfono</span>
                </button>
              </div>
            </div>
          )}

          {/* Video en vivo (fullscreen absolute para llenar el visor) */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{ objectFit: 'cover' }}
            className={`absolute inset-0 w-full h-full ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
              capturedImage ? 'hidden' : 'block'
            }`}
          />

          {/* Guía de Encuadre Cuadrado 1:1 */}
          {!capturedImage && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 p-4">
              <div className="w-[82vw] sm:w-[320px] max-w-[340px] aspect-square rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] relative flex items-center justify-center">
                {/* Esquinas resaltadas */}
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <span className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Mira central sutil */}
                <div className="w-5 h-5 border-t border-l border-white/40" />

                <span className="absolute bottom-2.5 bg-black/75 text-emerald-300 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full backdrop-blur-md border border-emerald-500/30 shadow-md">
                  Encuadre 1:1 Cuadrado
                </span>
              </div>
            </div>
          )}

          {/* Vista previa de la captura congelada en 1:1 */}
          {capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-black z-10">
              <img
                src={capturedImage}
                alt="Foto del producto"
                className="w-[82vw] sm:w-[320px] max-w-[340px] aspect-square object-contain rounded-2xl shadow-2xl border-2 border-emerald-500/60"
              />
            </div>
          )}
        </div>

        {/* Indicador de Fondo de Estudio IA si está activo */}
        {conFondoIa && (
          <div className="px-4 py-2 bg-indigo-950/70 border-t border-indigo-900/50 flex items-center justify-center gap-1.5 text-indigo-300 text-[11px] font-semibold text-center shrink-0 z-20">
            <Sparkles size={13} className="text-indigo-400 shrink-0" />
            <span className="truncate">Fondo de estudio IA activo: se removerá el fondo al confirmar ✨</span>
          </div>
        )}

        {/* Barra inferior de acciones (con padding seguro para iOS / barra de navegación) */}
        <div className="px-5 py-4 sm:py-3.5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-30 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>Tomar otra</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Abrir app de cámara nativa del celular"
              >
                <Smartphone size={14} />
                <span className="hidden sm:inline">Cámara nativa</span>
              </button>

              {/* Botón Disparador Principal */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={loadingCamera || Boolean(cameraError)}
                  className="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:scale-90 hover:scale-105 transition-all flex items-center justify-center shadow-lg disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  title="Capturar foto"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-sm">
                    <Camera size={22} />
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </>
          )}
        </div>

        {/* Input nativo oculto para compatibilidad total con teléfonos */}
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
