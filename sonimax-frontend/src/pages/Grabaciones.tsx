import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import AudioUpload from '../components/AudioUpload';
import WaveformViewer from '../components/WaveformViewer';
import BirdNETAnalysis from '../components/BirdNETAnalysis';
import RealtimeSpectrogram from '../components/RealtimeSpectrogram';
import BatchAnalysis from '../components/BatchAnalysis';
import { Mic, Play, Download, BarChart2, Tag as TagIcon, Upload, X, Bird, Layers } from 'lucide-react';

export default function Grabaciones() {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showBatchAnalysis, setShowBatchAnalysis] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<any>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null)[0];

  // Cargar detecciones de BirdNET para la grabación seleccionada
  const { data: birdDetections } = useQuery({
    queryKey: ['birdnet-detections', selectedAudio?.id],
    queryFn: async () => {
      if (!selectedAudio?.id) return [];
      
      const { data, error } = await supabase
        .from('birdnet_detections')
        .select('*')
        .eq('grabacion_id', selectedAudio.id)
        .order('start_time_seconds');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedAudio?.id
  });

  const { data: grabaciones, isLoading } = useQuery({
    queryKey: ['grabaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grabaciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['grabaciones'] });
    setShowUpload(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grabaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y analiza tus grabaciones de audio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchAnalysis(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Layers className="w-5 h-5" />
            Análisis por Lotes
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showUpload ? (
              <>
                <X className="w-5 h-5" />
                Cancelar
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Subir Audio
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de análisis por lotes */}
      {showBatchAnalysis && (
        <BatchAnalysis
          isOpen={showBatchAnalysis}
          onClose={() => {
            setShowBatchAnalysis(false);
            queryClient.invalidateQueries({ queryKey: ['grabaciones'] });
          }}
        />
      )}

      {/* Modal de subida */}
      {showUpload && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subir Grabaciones de Audio</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona un Proyecto *
            </label>
            <select
              value={selectedProyecto}
              onChange={(e) => setSelectedProyecto(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Selecciona un proyecto --</option>
              {proyectos?.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>
          </div>

          {selectedProyecto ? (
            <AudioUpload
              proyectoId={selectedProyecto}
              onUploadComplete={handleUploadComplete}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Por favor selecciona un proyecto primero
            </div>
          )}
        </div>
      )}

      {/* Visor de forma de onda, espectrograma y análisis BirdNET */}
      {selectedAudio && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{selectedAudio.nombre_archivo}</h2>
              <button
                onClick={() => setSelectedAudio(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {selectedAudio.metadata_extras?.storage_url && (
              <WaveformViewer 
                audioUrl={selectedAudio.metadata_extras.storage_url}
                birdDetections={birdDetections || []}
                onMarkerClick={(detection) => {
                  console.log('Marker clicked:', detection);
                }}
              />
            )}
          </div>

          {/* Espectrograma */}
          {selectedAudio.metadata_extras?.storage_url && (
            <RealtimeSpectrogram
              audioUrl={selectedAudio.metadata_extras.storage_url}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
            />
          )}

          {/* Análisis BirdNET */}
          {selectedAudio.metadata_extras?.storage_url && (
            <BirdNETAnalysis
              grabacionId={selectedAudio.id}
              audioUrl={selectedAudio.metadata_extras.storage_url}
              latitud={selectedAudio.latitud}
              longitud={selectedAudio.longitud}
              fecha={selectedAudio.created_at}
            />
          )}
        </div>
      )}

      {/* Tabla de grabaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grabaciones?.map((grabacion) => (
                <tr key={grabacion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {grabacion.nombre_archivo}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grabacion.metadata_extras?.formato || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(grabacion.tamano_archivo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      grabacion.estado === 'procesada' ? 'bg-green-100 text-green-800' :
                      grabacion.estado === 'procesando' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {grabacion.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(grabacion.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAudio(grabacion)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Reproducir"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1" title="Analizar">
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      {grabacion.metadata_extras?.storage_url && (
                        <a
                          href={grabacion.metadata_extras.storage_url}
                          download
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(!grabaciones || grabaciones.length === 0) && (
        <div className="text-center py-12">
          <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay grabaciones</h3>
          <p className="text-gray-600">Haz clic en "Subir Audio" para agregar tu primera grabación</p>
        </div>
      )}
    </div>
  );
}
