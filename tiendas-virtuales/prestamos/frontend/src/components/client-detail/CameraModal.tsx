import React, { useRef, useEffect } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

interface CameraModalProps {
  show: boolean;
  target: 'idFront' | 'idBack' | 'photo' | null;
  cameraStream: MediaStream | null;
  facingMode: 'user' | 'environment';
  onClose: () => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  show,
  target,
  facingMode,
  onClose,
  onCapture,
  onSwitchCamera,
  videoRef,
  canvasRef
}) => {
  if (!show || !target) return null;

  const getTitle = () => {
    switch (target) {
      case 'idFront':
        return 'Fotografiar Anverso Cédula';
      case 'idBack':
        return 'Fotografiar Reverso Cédula';
      case 'photo':
        return 'Fotografiar Perfil / Rostro';
      default:
        return 'Tomar Fotografía';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-center">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Camera className="w-5 h-5 text-brand-400" />
            {getTitle()}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Guide Overlay for Cards vs Face */}
          {target === 'photo' ? (
            <div className="absolute inset-0 border-2 border-dashed border-brand-400/50 rounded-full w-48 h-48 mx-auto my-auto pointer-events-none" />
          ) : (
            <div className="absolute inset-0 border-2 border-dashed border-brand-400/50 rounded-xl w-5/6 h-4/5 mx-auto my-auto pointer-events-none flex items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-brand-400/80 tracking-widest bg-slate-950/60 px-2 py-1 rounded">
                Encuadre el Documento
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onSwitchCamera}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            {facingMode === 'environment' ? 'Cámara Frontal' : 'Cámara Trasera'}
          </button>

          <button
            type="button"
            onClick={onCapture}
            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition"
          >
            <Camera className="w-4 h-4" />
            Capturar Foto
          </button>
        </div>
      </div>
    </div>
  );
};
