import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Mic, Square, MapPin, Save, Clock, Radio, RefreshCw, Navigation, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CameraCaptureModal from './CameraCaptureModal';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk';

interface RealTimeRecorderProps {
  proyectoId?: string;
  onRecordingSaved?: (recordingId: string) => void;
}

const RealTimeRecorder: React.FC<RealTimeRecorderProps> = ({
  proyectoId,
  onRecordingSaved
}) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState(proyectoId || '');
  const [projects, setProjects] = useState<any[]>([]);
  const [recordingName, setRecordingName] = useState('');
  const [recordingNotes, setRecordingNotes] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'poor' | 'good' | 'excellent'>('searching');
  const [showCameraModal, setShowCameraModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    loadProjects();
    getCurrentPosition();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const loadProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('user_id', user.id)
        .order('nombre');

      if (error) throw error;
      setProjects(data || []);
      if (!proyectoId && data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      alert('La geolocalizacion no esta soportada en este navegador');
      return;
    }

    setGpsStatus('searching');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        const accuracy = position.coords.accuracy;
        setGpsAccuracy(accuracy);
        setAltitude(position.coords.altitude);

        // Determinar calidad de señal GPS
        if (accuracy < 10) {
          setGpsStatus('excellent');
        } else if (accuracy < 30) {
          setGpsStatus('good');
        } else if (accuracy < 100) {
          setGpsStatus('poor');
        } else {
          setGpsStatus('searching');
        }
      },
      (error) => {
        console.error('Error getting position:', error);
        let errorMessage = 'Error al obtener la ubicacion.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicacion denegado. Habilita el acceso a tu ubicacion en la configuracion.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicacion no disponible. Verifica que tu GPS este activado y estas al aire libre.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalizacion no esta soportada');
      return;
    }

    setIsRefreshingLocation(true);
    setGpsStatus('searching');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        const accuracy = position.coords.accuracy;
        setGpsAccuracy(accuracy);
        setAltitude(position.coords.altitude);
        setIsRefreshingLocation(false);

        if (accuracy < 10) {
          setGpsStatus('excellent');
        } else if (accuracy < 30) {
          setGpsStatus('good');
        } else if (accuracy < 100) {
          setGpsStatus('poor');
        }

        alert(`Ubicacion actualizada (precision: ±${Math.round(accuracy)}m)`);
      },
      (error) => {
        setIsRefreshingLocation(false);
        alert('Error al actualizar ubicacion. Verifica los permisos.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const startRecording = async () => {
    if (!currentPosition) {
      alert('Esperando ubicacion GPS...');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setShowSaveDialog(true);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error al iniciar la grabacion. Verifica los permisos del microfono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const saveRecording = async () => {
    if (!selectedProject || !currentPosition || audioChunksRef.current.length === 0) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const fileName = `recording_${Date.now()}.webm`;

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Create punto_grabacion first
        const { data: puntoData, error: puntoError } = await supabase
          .from('puntos_grabacion')
          .insert({
            nombre: recordingName || `Grabacion ${new Date().toLocaleString('es-ES')}`,
            latitud: currentPosition.lat,
            longitud: currentPosition.lng,
            altitud: altitude,
            precision_gps: gpsAccuracy,
            timestamp_gps: new Date().toISOString()
          })
          .select()
          .single();

        if (puntoError) throw puntoError;

        // Upload audio using edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || 'https://zdamggjjfmkothvlvwln.supabase.co'}/functions/v1/audio-upload`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYW1nZ2pqZm1rb3Rodmx2d2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODk5MjEsImV4cCI6MjA3Nzg2NTkyMX0.MKclI9LC5jJ0sCNIuFrYbYx5tT-9n_9fi72wg31AUVY'}`
            },
            body: JSON.stringify({
              audioBase64: base64Audio,
              fileName: fileName,
              metadata: {
                punto_id: puntoData.id,
                usuario_id: user?.id,
                nombre_archivo: fileName,
                duracion_segundos: recordingTime,
                inicio_grabacion: new Date(Date.now() - recordingTime * 1000).toISOString(),
                fin_grabacion: new Date().toISOString(),
                notas_campo: recordingNotes,
                configuracion_captura: {
                  metodo: 'grabacion_tiempo_real',
                  latitud: currentPosition.lat,
                  longitud: currentPosition.lng,
                  altitud: altitude,
                  precision_gps: gpsAccuracy
                }
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error('Error al subir el audio');
        }

        const result = await response.json();

        alert('Grabacion guardada exitosamente');
        setShowSaveDialog(false);
        setRecordingName('');
        setRecordingNotes('');
        audioChunksRef.current = [];
        setRecordingTime(0);

        if (onRecordingSaved && result.data?.grabacion_id) {
          onRecordingSaved(result.data.grabacion_id);
        }
      };
    } catch (error) {
      console.error('Error saving recording:', error);
      alert('Error al guardar la grabacion');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-96">Cargando mapa...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-600" />
            Grabacion en Tiempo Real
          </h2>
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600 animate-pulse">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="font-bold">GRABANDO</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proyecto
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={isRecording || !!proyectoId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            >
              <option value="">Seleccionar proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            {currentPosition ? (
              <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      GPS: {gpsStatus === 'excellent' ? 'Excelente' : gpsStatus === 'good' ? 'Buena' : gpsStatus === 'poor' ? 'Pobre' : 'Buscando...'}
                    </span>
                  </div>
                  <button
                    onClick={refreshLocation}
                    disabled={isRefreshingLocation}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                    title="Actualizar ubicacion"
                  >
                    <RefreshCw className={`w-4 h-4 text-green-600 ${isRefreshingLocation ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="text-xs text-green-600 mt-1 font-mono">
                  {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                </div>
                {gpsAccuracy && (
                  <div className="text-xs text-green-600">
                    Precision: ±{gpsAccuracy.toFixed(1)} m
                  </div>
                )}
                {altitude && (
                  <div className="text-xs text-green-600">
                    Altitud: {altitude.toFixed(1)} m
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2 text-yellow-700">
                  <MapPin className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Esperando GPS...</span>
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Asegurate de estar al aire libre y haber dado permisos de ubicacion
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 py-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-800 mb-2 font-mono">
              {formatTime(recordingTime)}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-2 justify-center">
              <Clock className="w-4 h-4" />
              Duracion
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 flex-wrap">
          {/* Boton de captura de imagen */}
          <button
            onClick={() => setShowCameraModal(true)}
            disabled={!currentPosition}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            title="Capturar imagen del lugar"
          >
            <Camera className="w-5 h-5" />
            <span className="font-semibold">Capturar Imagen</span>
          </button>

          {/* Botones de grabacion */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!currentPosition || !selectedProject}
              className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              <Mic className="w-6 h-6" />
              <span className="text-lg font-semibold">Iniciar Grabacion</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-3 px-8 py-4 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-all transform hover:scale-105"
            >
              <Square className="w-6 h-6" />
              <span className="text-lg font-semibold">Detener Grabacion</span>
            </button>
          )}
        </div>
      </div>

      {currentPosition && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '400px' }}
            center={currentPosition}
            zoom={15}
          >
            <Marker
              position={currentPosition}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }}
            />
          </GoogleMap>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Guardar Grabacion</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la grabacion
                </label>
                <input
                  type="text"
                  value={recordingName}
                  onChange={(e) => setRecordingName(e.target.value)}
                  placeholder={`Grabacion ${new Date().toLocaleString('es-ES')}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de campo
                </label>
                <textarea
                  value={recordingNotes}
                  onChange={(e) => setRecordingNotes(e.target.value)}
                  placeholder="Observaciones, condiciones ambientales, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <div className="font-medium text-gray-700 mb-2">Informacion de la grabacion</div>
                <div className="space-y-1 text-gray-600">
                  <div>Duracion: {formatTime(recordingTime)}</div>
                  {currentPosition && (
                    <div className="font-mono text-xs">
                      Ubicacion: {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
                    </div>
                  )}
                  {altitude && <div>Altitud: {altitude.toFixed(1)} m</div>}
                  {gpsAccuracy && <div>Precision GPS: {gpsAccuracy.toFixed(1)} m</div>}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    audioChunksRef.current = [];
                    setRecordingTime(0);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de captura de camara */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        proyectoId={selectedProject}
        gpsData={currentPosition ? {
          latitud: currentPosition.lat,
          longitud: currentPosition.lng,
          altitud: altitude || undefined,
          precision: gpsAccuracy || undefined
        } : undefined}
        onImageSaved={(imageId) => {
          console.log('Image saved:', imageId);
          alert('Imagen guardada exitosamente');
        }}
      />
    </div>
  );
};

export default RealTimeRecorder;
