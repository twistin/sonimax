import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Save, RefreshCw, MapPin, Cloud, Tag, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId?: string;
  puntoId?: string;
  grabacionId?: string;
  gpsData?: {
    latitud: number;
    longitud: number;
    altitud?: number;
    precision?: number;
  };
  onImageSaved?: (imageId: string) => void;
}

const CONDICIONES_ATMOSFERICAS = [
  'Soleado',
  'Parcialmente nublado',
  'Nublado',
  'Lluvioso',
  'Ventoso',
  'Tormentoso',
  'Nevado',
  'Niebla',
  'Caluroso',
  'Frio'
];

const CARACTERISTICAS_SITIO = [
  'Bosque',
  'Playa',
  'Urbano',
  'Rural',
  'Montaña',
  'Rio',
  'Lago',
  'Parque',
  'Desierto',
  'Humedal',
  'Acantilado',
  'Valle',
  'Campo abierto',
  'Jardin',
  'Zona industrial'
];

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  proyectoId,
  puntoId,
  grabacionId,
  gpsData,
  onImageSaved
}) => {
  const { user } = useAuth();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  
  // Campos del formulario
  const [nombreSitio, setNombreSitio] = useState('');
  const [condicionesAtmosfericas, setCondicionesAtmosfericas] = useState('');
  const [caracteristicasSeleccionadas, setCaracteristicasSeleccionadas] = useState<string[]>([]);
  const [descripcionAdicional, setDescripcionAdicional] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    if (isCameraActive || isLoadingCamera) return;
    
    setIsLoadingCamera(true);
    setCameraError(null);
    
    try {
      // Verificar soporte de mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a camara');
      }

      // Detectar dispositivo Android/Samsung
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isSamsung = /Samsung|SM-|Galaxy/i.test(navigator.userAgent);
      
      console.log('Dispositivo detectado:', { isAndroid, isSamsung, userAgent: navigator.userAgent });

      // Intentar con diferentes configuraciones optimizadas para Android/Samsung
      let mediaStream: MediaStream | null = null;
      
      // ESTRATEGIA ANDROID/SAMSUNG: Configuraciones conservadoras primero
      if (isAndroid || isSamsung) {
        console.log('Aplicando estrategia optimizada para Android/Samsung...');
        
        try {
          // Intento 1 Android: Configuracion basica sin restricciones
          console.log('Intento 1 (Android): Configuracion basica...');
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          console.log('Intento 1 exitoso');
        } catch (err1) {
          console.log('Intento 1 fallido:', err1);
          
          // Pequeño delay antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            // Intento 2 Android: Resolucion conservadora sin facingMode
            console.log('Intento 2 (Android): Resolucion conservadora...');
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { 
                width: { ideal: 640 },
                height: { ideal: 480 }
              },
              audio: false
            });
            console.log('Intento 2 exitoso');
          } catch (err2) {
            console.log('Intento 2 fallido:', err2);
            
            // Pequeño delay antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 300));
            
            try {
              // Intento 3 Android: Resolucion media
              console.log('Intento 3 (Android): Resolucion media...');
              mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              });
              console.log('Intento 3 exitoso');
            } catch (err3) {
              console.log('Intento 3 fallido:', err3);
              
              // Ultimo intento con facingMode (algunos Samsung lo requieren)
              await new Promise(resolve => setTimeout(resolve, 300));
              console.log('Intento 4 (Android): Con facingMode environment...');
              mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              });
              console.log('Intento 4 exitoso');
            }
          }
        }
      } else {
        // ESTRATEGIA DESKTOP: Alta calidad primero
        console.log('Aplicando estrategia para Desktop...');
        
        try {
          // Intento 1 Desktop: Alta resolucion con camara trasera
          console.log('Intento 1 (Desktop): Alta resolucion...');
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          });
          console.log('Intento 1 exitoso');
        } catch (err) {
          console.log('Intento 1 fallido, probando configuracion alternativa...');
          
          try {
            // Intento 2 Desktop: Resolucion media
            console.log('Intento 2 (Desktop): Resolucion media...');
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: false
            });
            console.log('Intento 2 exitoso');
          } catch (err2) {
            // Intento 3 Desktop: Configuracion basica
            console.log('Intento 3 (Desktop): Configuracion basica...');
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
            console.log('Intento 3 exitoso');
          }
        }
      }

      if (!mediaStream) {
        throw new Error('No se pudo obtener el stream de video');
      }
      
      console.log('Stream obtenido correctamente:', mediaStream.getVideoTracks()[0].getSettings());
      
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Delay adicional para Android antes de reproducir
        if (isAndroid || isSamsung) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Asegurar que el video comience a reproducirse
        try {
          await videoRef.current.play();
          console.log('Video reproduciendo correctamente');
        } catch (playError) {
          console.error('Error al reproducir video:', playError);
          // Intentar nuevamente después de un delay
          setTimeout(async () => {
            try {
              await videoRef.current?.play();
              console.log('Video reproduciendo correctamente (segundo intento)');
            } catch (e) {
              console.error('Error en segundo intento de reproduccion:', e);
            }
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'No se pudo acceder a la camara.';
      
      // Detectar si es Android/Samsung para mensajes específicos
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isSamsung = /Samsung|SM-|Galaxy/i.test(navigator.userAgent);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        if (isAndroid || isSamsung) {
          errorMessage = 'Permiso de camara denegado. En dispositivos Samsung/Android:\n\n1. Toca el icono de candado en la barra de direcciones\n2. Activa "Camara"\n3. Recarga la pagina\n4. Intenta nuevamente';
        } else {
          errorMessage = 'Permiso de camara denegado. Por favor, permite el acceso a la camara en la configuracion del navegador.';
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No se encontro ninguna camara en tu dispositivo.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        if (isAndroid || isSamsung) {
          errorMessage = 'La camara esta siendo usada por otra aplicacion. En dispositivos Samsung:\n\n1. Cierra todas las apps que usen la camara\n2. Cierra otras pestanas del navegador\n3. Reinicia el navegador si es necesario\n4. Intenta nuevamente';
        } else {
          errorMessage = 'La camara esta siendo usada por otra aplicacion. Cierra otras aplicaciones que puedan estar usando la camara.';
        }
      } else if (error.name === 'OverconstrainedError') {
        if (isAndroid || isSamsung) {
          errorMessage = 'Tu dispositivo Samsung no soporta la configuracion de camara solicitada. Esto es normal. Intenta:\n\n1. Cerrar y reabrir el navegador\n2. Dar permisos de camara nuevamente\n3. Presionar "Intentar Nuevamente"';
        } else {
          errorMessage = 'Las configuraciones de camara solicitadas no son compatibles con tu dispositivo.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCameraError(null);
    startCamera();
  };

  const toggleCaracteristica = (caracteristica: string) => {
    setCaracteristicasSeleccionadas(prev => {
      if (prev.includes(caracteristica)) {
        return prev.filter(c => c !== caracteristica);
      } else {
        return [...prev, caracteristica];
      }
    });
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const saveImage = async () => {
    if (!capturedImage || !user) {
      alert('Falta informacion requerida para guardar la imagen');
      return;
    }

    setIsUploading(true);

    try {
      const blob = dataURLtoBlob(capturedImage);
      const fileName = `captura_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // Subir imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('imagenes-lugares')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener URL publica
      const { data: { publicUrl } } = supabase.storage
        .from('imagenes-lugares')
        .getPublicUrl(filePath);

      // Guardar metadatos en la base de datos
      const imageData = {
        proyecto_id: proyectoId,
        punto_id: puntoId,
        grabacion_id: grabacionId,
        usuario_id: user.id,
        nombre_archivo: fileName,
        ruta_storage: filePath,
        url_publica: publicUrl,
        tipo_mime: 'image/jpeg',
        latitud: gpsData?.latitud,
        longitud: gpsData?.longitud,
        altitud: gpsData?.altitud,
        precision_gps: gpsData?.precision,
        timestamp_captura: new Date().toISOString(),
        nombre_sitio: nombreSitio || null,
        condiciones_atmosfericas: condicionesAtmosfericas || null,
        caracteristicas_sitio: caracteristicasSeleccionadas.length > 0 ? caracteristicasSeleccionadas : null,
        descripcion: descripcionAdicional || null,
        notas_campo: descripcionAdicional || null,
        tags: caracteristicasSeleccionadas.length > 0 ? caracteristicasSeleccionadas : null
      };

      const { data: insertData, error: insertError } = await supabase
        .from('imagenes_lugares')
        .insert([imageData])
        .select()
        .single();

      if (insertError) throw insertError;

      alert('Imagen y metadatos guardados exitosamente');
      
      if (onImageSaved && insertData) {
        onImageSaved(insertData.id);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Error al guardar la imagen. Intenta nuevamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setCameraError(null);
    setNombreSitio('');
    setCondicionesAtmosfericas('');
    setCaracteristicasSeleccionadas([]);
    setDescripcionAdicional('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-600" />
            Captura de Imagen y Metadatos
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Seccion de camara/imagen */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Imagen del Lugar</h3>
            
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {isCameraActive && !capturedImage && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captura"
                  className="w-full h-full object-cover"
                />
              )}
              
              {!isCameraActive && !capturedImage && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Camera className="w-16 h-16 mx-auto mb-2 opacity-50 animate-pulse" />
                    <p>{isLoadingCamera ? 'Iniciando camara...' : 'Preparando camara...'}</p>
                  </div>
                </div>
              )}
              
              {cameraError && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="bg-red-500 bg-opacity-90 rounded-lg p-6 text-white text-center max-w-md">
                    <X className="w-12 h-12 mx-auto mb-3" />
                    <h4 className="font-bold text-lg mb-2">Error de Camara</h4>
                    <p className="text-sm mb-4 whitespace-pre-line text-left">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-base shadow-lg"
                    >
                      Intentar Nuevamente
                    </button>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4 flex gap-2 justify-center">
              {isCameraActive && !capturedImage && (
                <button
                  onClick={capturePhoto}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Tomar Foto
                </button>
              )}
              
              {capturedImage && (
                <>
                  <button
                    onClick={retakePhoto}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Repetir
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Informacion GPS */}
          {gpsData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Ubicacion GPS
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Latitud:</span> {gpsData.latitud.toFixed(6)}
                </div>
                <div>
                  <span className="font-medium">Longitud:</span> {gpsData.longitud.toFixed(6)}
                </div>
                {gpsData.altitud && (
                  <div>
                    <span className="font-medium">Altitud:</span> {gpsData.altitud.toFixed(1)} m
                  </div>
                )}
                {gpsData.precision && (
                  <div>
                    <span className="font-medium">Precision:</span> ±{gpsData.precision.toFixed(1)} m
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formulario de metadatos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metadatos del Lugar</h3>

            {/* Nombre del sitio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Sitio
              </label>
              <input
                type="text"
                value={nombreSitio}
                onChange={(e) => setNombreSitio(e.target.value)}
                placeholder="Ej: Bosque de Pinos - Entrada Norte"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Condiciones atmosfericas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Condiciones Atmosfericas
              </label>
              <select
                value={condicionesAtmosfericas}
                onChange={(e) => setCondicionesAtmosfericas(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar condicion</option>
                {CONDICIONES_ATMOSFERICAS.map((condicion) => (
                  <option key={condicion} value={condicion}>
                    {condicion}
                  </option>
                ))}
              </select>
            </div>

            {/* Caracteristicas del sitio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Caracteristicas del Sitio (seleccion multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {CARACTERISTICAS_SITIO.map((caracteristica) => (
                  <button
                    key={caracteristica}
                    type="button"
                    onClick={() => toggleCaracteristica(caracteristica)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      caracteristicasSeleccionadas.includes(caracteristica)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {caracteristica}
                  </button>
                ))}
              </div>
              {caracteristicasSeleccionadas.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Seleccionadas: {caracteristicasSeleccionadas.join(', ')}
                </div>
              )}
            </div>

            {/* Descripcion adicional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descripcion Adicional y Notas
              </label>
              <textarea
                value={descripcionAdicional}
                onChange={(e) => setDescripcionAdicional(e.target.value)}
                placeholder="Observaciones adicionales, condiciones especiales, fauna observada, etc."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fecha y hora automaticas */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <strong>Fecha y hora de captura:</strong> {new Date().toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} (automatico)
            </div>
          </div>

          {/* Botones de accion */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveImage}
              disabled={!capturedImage || isUploading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isUploading ? 'Guardando...' : 'Guardar Imagen y Metadatos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
