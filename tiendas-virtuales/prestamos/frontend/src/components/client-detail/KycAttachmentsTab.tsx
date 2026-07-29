import React, { useState } from 'react';
import type { ClientFullDetails, CustomDocAttachment } from './clientDetailTypes';
import { 
  Camera, Upload, Eye, Trash2, FileText, CheckCircle, ShieldCheck, FileCheck, FilePlus, X, ImageIcon 
} from 'lucide-react';

interface KycAttachmentsTabProps {
  client: ClientFullDetails;
  startCamera: (target: 'idFront' | 'idBack' | 'photo', mode?: 'user' | 'environment') => void;
  handleFileUpload: (field: 'idFront' | 'idBack' | 'photo', e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateClientField: (field: string, value: any) => Promise<void>;
  savingAttachment: boolean;
}

export const KycAttachmentsTab: React.FC<KycAttachmentsTabProps> = ({
  client,
  startCamera,
  handleFileUpload,
  onUpdateClientField,
  savingAttachment
}) => {
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  const [showAddCustomDoc, setShowAddCustomDoc] = useState(false);
  const [customDocTitle, setCustomDocTitle] = useState('');

  const customDocs: CustomDocAttachment[] = client.attachmentsJson
    ? JSON.parse(client.attachmentsJson)
    : [];

  const handleAddCustomDocFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customDocTitle.trim()) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe superar los 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const newDoc: CustomDocAttachment = {
        id: 'doc_' + Date.now(),
        title: customDocTitle.trim(),
        type: file.type.includes('pdf') ? 'pdf' : 'image',
        url: result,
        date: new Date().toLocaleDateString('es-CO')
      };
      const updatedDocs = [...customDocs, newDoc];
      await onUpdateClientField('attachmentsJson', JSON.stringify(updatedDocs));
      setCustomDocTitle('');
      setShowAddCustomDoc(false);
    };
    reader.readAsDataURL(file);
  };

  const removeCustomDoc = async (docId: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento adjunto?')) return;
    const updatedDocs = customDocs.filter(d => d.id !== docId);
    await onUpdateClientField('attachmentsJson', JSON.stringify(updatedDocs));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" /> {previewImage.title}
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-xl bg-slate-950 p-2">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Document Modal */}
      {showAddCustomDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-brand-400" />
                Adjuntar Documento Adicional
              </h3>
              <button
                onClick={() => setShowAddCustomDoc(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre / Título del Documento *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Servici Público, Carta Laboral, Fiador..."
                  value={customDocTitle}
                  onChange={e => setCustomDocTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Seleccionar Archivo (Imagen o PDF) *
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleAddCustomDocFile}
                  disabled={!customDocTitle.trim() || savingAttachment}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Basic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cédula Anverso */}
        <div className="glass-card p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" /> Cédula (Anverso)
              </h3>
              {client.idFront ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Registrado
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Pendiente
                </span>
              )}
            </div>

            <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center group shadow-inner">
              {client.idFront ? (
                <>
                  <img src={client.idFront} alt="Cédula Anverso" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-xs">
                    <button
                      onClick={() => setPreviewImage({ title: 'Cédula (Anverso)', url: client.idFront! })}
                      className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition"
                      title="Ver Imagen Completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUpdateClientField('idFront', null)}
                      className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                      title="Eliminar Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-1">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500">Sin foto de cédula anverso</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => startCamera('idFront', 'environment')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition border border-slate-700"
            >
              <Camera className="w-3.5 h-3.5 text-brand-400" /> Cámara
            </button>
            <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-brand-400" /> Subir
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload('idFront', e)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Cédula Reverso */}
        <div className="glass-card p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-400" /> Cédula (Reverso)
              </h3>
              {client.idBack ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Registrado
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Pendiente
                </span>
              )}
            </div>

            <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center group shadow-inner">
              {client.idBack ? (
                <>
                  <img src={client.idBack} alt="Cédula Reverso" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-xs">
                    <button
                      onClick={() => setPreviewImage({ title: 'Cédula (Reverso)', url: client.idBack! })}
                      className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition"
                      title="Ver Imagen Completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUpdateClientField('idBack', null)}
                      className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                      title="Eliminar Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-1">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500">Sin foto de cédula reverso</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => startCamera('idBack', 'environment')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition border border-slate-700"
            >
              <Camera className="w-3.5 h-3.5 text-brand-400" /> Cámara
            </button>
            <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-brand-400" /> Subir
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload('idBack', e)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Foto de Perfil / Rostro */}
        <div className="glass-card p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-400" /> Foto Perfil / Rostro
              </h3>
              {client.photo ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Registrado
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Pendiente
                </span>
              )}
            </div>

            <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center group shadow-inner">
              {client.photo ? (
                <>
                  <img src={client.photo} alt="Foto Perfil" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-xs">
                    <button
                      onClick={() => setPreviewImage({ title: 'Foto de Perfil / Rostro', url: client.photo! })}
                      className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition"
                      title="Ver Imagen Completa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUpdateClientField('photo', null)}
                      className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                      title="Eliminar Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 space-y-1">
                  <ImageIcon className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500">Sin foto de perfil</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => startCamera('photo', 'user')}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition border border-slate-700"
            >
              <Camera className="w-3.5 h-3.5 text-brand-400" /> Cámara
            </button>
            <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-lg transition border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-brand-400" /> Subir
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload('photo', e)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Additional Custom Attachments Section */}
      <div className="glass-card p-6 rounded-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              Documentos Adicionales y Garantías
            </h3>
            <p className="text-xs text-slate-400">Archivos PDF, recibos públicos o contratos firmados</p>
          </div>
          <button
            onClick={() => setShowAddCustomDoc(true)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition shadow-md"
          >
            <FilePlus className="w-4 h-4" /> Agregar Adjunto
          </button>
        </div>

        {customDocs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
            No se han registrado documentos o soportes adicionales.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {customDocs.map(doc => (
              <div
                key={doc.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3 group hover:border-slate-700 transition shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center justify-center text-brand-400 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-semibold text-xs text-white truncate">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400">{doc.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setPreviewImage({ title: doc.title, url: doc.url })}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Ver Documento"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeCustomDoc(doc.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Eliminar Documento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
