import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Cloud, 
  Tag, 
  FileText,
  ExternalLink,
  Download,
  Music,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

interface ImageDetailModalProps {
  image: {
    id: string;
    nombre_archivo: string;
    url_publica: string;
    latitud: number | null;
    longitud: number | null;
    altitud: number | null;
    precision_gps: number | null;
    timestamp_captura: string;
    nombre_sitio: string | null;
    condiciones_atmosfericas: string | null;
    caracteristicas_sitio: string[] | null;
    descripcion: string | null;
    notas_campo: string | null;
    proyecto_id: string | null;
    grabacion_id: string | null;
    proyecto?: {
      nombre: string;
    };
    grabacion?: {
      nombre_archivo: string;
      url_publica: string;
    };
  };
  onClose: () => void;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({ image, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (image.grabacion?.url_publica && waveformRef.current) {
      // Inicializar WaveSurfer
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4F46E5',
        progressColor: '#818CF8',
        cursorColor: '#312E81',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 80,
        barGap: 2,
      });

      wavesurferRef.current.load(image.grabacion.url_publica);

      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
      wavesurferRef.current.on('finish', () => setIsPlaying(false));

      return () => {
        wavesurferRef.current?.destroy();
      };
    }
  }, [image.grabacion?.url_publica]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const openInGoogleMaps = () => {
    if (image.latitud && image.longitud) {
      const url = `https://www.google.com/maps?q=${image.latitud},${image.longitud}`;
      window.open(url, '_blank');
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = image.url_publica;
    link.download = image.nombre_archivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMetadata = () => {
    const metadata = {
      nombre_sitio: image.nombre_sitio,
      proyecto: image.proyecto?.nombre,
      fecha_captura: image.timestamp_captura,
      ubicacion: {
        latitud: image.latitud,
        longitud: image.longitud,
        altitud: image.altitud,
        precision_gps: image.precision_gps,
      },
      condiciones_atmosfericas: image.condiciones_atmosfericas,
      caracteristicas_sitio: image.caracteristicas_sitio,
      descripcion: image.descripcion,
      notas_campo: image.notas_campo,
      archivo_imagen: image.nombre_archivo,
      archivo_audio: image.grabacion?.nombre_archivo,
    };

    const dataStr = JSON.stringify(metadata, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metadata_${image.nombre_sitio?.replace(/\s+/g, '_') || 'imagen'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {image.nombre_sitio || 'Detalle de Imagen'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda - Imagen */}
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url_publica}
                  alt={image.nombre_sitio || 'Imagen'}
                  className="w-full h-auto"
                />
              </div>

              {/* Botones de accion */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar Imagen
                </button>
                
                {image.latitud && image.longitud && (
                  <button
                    onClick={openInGoogleMaps}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir en Google Maps
                  </button>
                )}
                
                <button
                  onClick={exportMetadata}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar Metadatos
                </button>
              </div>

              {/* Reproductor de audio */}
              {image.grabacion?.url_publica && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Soundscape Asociado</h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 mb-3">
                    <div ref={waveformRef} className="w-full" />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlayPause}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Reproducir
                        </>
                      )}
                    </button>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Volume2 className="w-4 h-4" />
                      <span className="line-clamp-1">{image.grabacion.nombre_archivo}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha - Metadatos */}
            <div className="space-y-4">
              {/* Informacion del proyecto */}
              {image.proyecto && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Proyecto</h3>
                  <p className="text-gray-700">{image.proyecto.nombre}</p>
                </div>
              )}

              {/* Informacion GPS */}
              {image.latitud && image.longitud && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Ubicacion GPS
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Latitud:</span>
                      <p className="text-gray-900">{image.latitud.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Longitud:</span>
                      <p className="text-gray-900">{image.longitud.toFixed(6)}</p>
                    </div>
                    {image.altitud && (
                      <div>
                        <span className="font-medium text-gray-600">Altitud:</span>
                        <p className="text-gray-900">{image.altitud.toFixed(1)} m</p>
                      </div>
                    )}
                    {image.precision_gps && (
                      <div>
                        <span className="font-medium text-gray-600">Precision GPS:</span>
                        <p className="text-gray-900">±{image.precision_gps.toFixed(1)} m</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fecha y hora */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  Fecha de Captura
                </h3>
                <p className="text-gray-700">
                  {new Date(image.timestamp_captura).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Condiciones atmosfericas */}
              {image.condiciones_atmosfericas && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-sky-600" />
                    Condiciones Atmosfericas
                  </h3>
                  <p className="text-gray-700">{image.condiciones_atmosfericas}</p>
                </div>
              )}

              {/* Caracteristicas del sitio */}
              {image.caracteristicas_sitio && image.caracteristicas_sitio.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-600" />
                    Caracteristicas del Sitio
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {image.caracteristicas_sitio.map(caracteristica => (
                      <span
                        key={caracteristica}
                        className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm"
                      >
                        {caracteristica}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripcion */}
              {image.descripcion && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    Descripcion
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{image.descripcion}</p>
                </div>
              )}

              {/* Notas de campo */}
              {image.notas_campo && image.notas_campo !== image.descripcion && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-600" />
                    Notas de Campo
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{image.notas_campo}</p>
                </div>
              )}

              {/* Informacion tecnica */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informacion Tecnica</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Archivo:</span> {image.nombre_archivo}
                  </div>
                  <div>
                    <span className="font-medium">ID:</span> {image.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDetailModal;
