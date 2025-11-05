import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AudioUploadProps {
  proyectoId: string;
  rutaId?: string;
  puntoGrabacionId?: string;
  onUploadComplete?: (grabacion: any) => void;
}

export default function AudioUpload({ proyectoId, rutaId, puntoGrabacionId, onUploadComplete }: AudioUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadResults, setUploadResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|m4a)$/i.test(file.name)
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    const fileName = files[index].name;
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setUploadResults(prev => {
      const newResults = { ...prev };
      delete newResults[fileName];
      return newResults;
    });
  };

  const uploadFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Simular progreso de carga
          setUploadProgress(prev => ({ ...prev, [file.name]: 30 }));

          const metadata = {
            mimeType: file.type,
            format: file.name.split('.').pop()?.toUpperCase(),
            originalName: file.name,
          };

          setUploadProgress(prev => ({ ...prev, [file.name]: 60 }));

          const { data, error } = await supabase.functions.invoke('audio-upload-fixed', {
            body: {
              audioData: base64Data,
              fileName: file.name,
              proyectoId,
              rutaId,
              puntoGrabacionId,
              metadata,
            }
          });

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

          if (error) throw error;

          setUploadResults(prev => ({
            ...prev,
            [file.name]: { success: true, message: 'Subido exitosamente' }
          }));

          if (onUploadComplete && data?.data?.grabacion) {
            onUploadComplete(data.data.grabacion);
          }

          resolve(data);
        } catch (err: any) {
          setUploadResults(prev => ({
            ...prev,
            [file.name]: { success: false, message: err.message || 'Error al subir archivo' }
          }));
          reject(err);
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      await Promise.all(files.map(file => uploadFile(file)));
    } catch (error) {
      console.error('Error al subir archivos:', error);
    } finally {
      setUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(file => !uploadResults[file.name]?.success));
    setUploadProgress({});
    setUploadResults({});
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Zona de drop */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Arrastra archivos de audio aquí
        </p>
        <p className="text-sm text-gray-500 mb-4">
          o haz clic para seleccionar archivos
        </p>
        <label className="inline-block">
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.flac,.ogg,.m4a"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block">
            Seleccionar Archivos
          </span>
        </label>
        <p className="text-xs text-gray-400 mt-4">
          Formatos soportados: WAV, MP3, FLAC, OGG, M4A
        </p>
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">
              Archivos seleccionados ({files.length})
            </h3>
            {Object.keys(uploadResults).length > 0 && (
              <button
                onClick={clearCompleted}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Limpiar completados
              </button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((file, index) => {
              const progress = uploadProgress[file.name] || 0;
              const result = uploadResults[file.name];

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <File className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>

                      {/* Barra de progreso */}
                      {progress > 0 && !result && (
                        <div className="mt-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                        </div>
                      )}

                      {/* Resultado */}
                      {result && (
                        <div className={`mt-2 flex items-center gap-2 text-sm ${
                          result.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.success ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          <span>{result.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Botón eliminar */}
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botones de acción */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Subir Archivos
                </>
              )}
            </button>
            
            <button
              onClick={() => setFiles([])}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
