import React, { useState, useEffect } from 'react';
import { Bird, Loader2, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface BatchAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Grabacion {
  id: string;
  nombre_archivo: string;
  proyecto_id: string;
  metadata_extras?: {
    storage_url?: string;
  };
  latitud?: number;
  longitud?: number;
  created_at: string;
}

interface AnalysisStatus {
  grabacionId: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  detections?: number;
  error?: string;
}

const BatchAnalysis: React.FC<BatchAnalysisProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGrabaciones, setSelectedGrabaciones] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatuses, setAnalysisStatuses] = useState<Record<string, AnalysisStatus>>({});
  const [concurrentLimit, setConcurrentLimit] = useState(3); // Análisis simultáneos
  
  const { data: grabaciones, isLoading } = useQuery({
    queryKey: ['grabaciones-batch'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grabaciones')
        .select('id, nombre_archivo, proyecto_id, metadata_extras, latitud, longitud, created_at')
        .eq('usuario_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Grabacion[];
    },
    enabled: isOpen && !!user
  });

  const { data: proyectos } = useQuery({
    queryKey: ['proyectos-batch'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data as { id: string; nombre: string }[];
    },
    enabled: isOpen && !!user
  });

  const toggleGrabacion = (grabacionId: string) => {
    setSelectedGrabaciones(prev => {
      if (prev.includes(grabacionId)) {
        return prev.filter(id => id !== grabacionId);
      } else {
        return [...prev, grabacionId];
      }
    });
  };

  const selectAll = () => {
    if (grabaciones) {
      setSelectedGrabaciones(grabaciones.map(g => g.id));
    }
  };

  const deselectAll = () => {
    setSelectedGrabaciones([]);
  };

  const analyzeInBatches = async () => {
    if (selectedGrabaciones.length === 0) return;

    setIsAnalyzing(true);

    // Inicializar estados
    const initialStatuses: Record<string, AnalysisStatus> = {};
    selectedGrabaciones.forEach(id => {
      initialStatuses[id] = { grabacionId: id, status: 'pending' };
    });
    setAnalysisStatuses(initialStatuses);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Procesar en lotes con límite de concurrencia
      const queue = [...selectedGrabaciones];
      const running: Promise<void>[] = [];

      const processGrabacion = async (grabacionId: string) => {
        const grabacion = grabaciones?.find(g => g.id === grabacionId);
        if (!grabacion || !grabacion.metadata_extras?.storage_url) {
          setAnalysisStatuses(prev => ({
            ...prev,
            [grabacionId]: { 
              grabacionId, 
              status: 'error', 
              error: 'Sin URL de audio' 
            }
          }));
          return;
        }

        // Actualizar estado a analyzing
        setAnalysisStatuses(prev => ({
          ...prev,
          [grabacionId]: { grabacionId, status: 'analyzing' }
        }));

        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/analyze-birdnet`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                grabacionId: grabacion.id,
                audioUrl: grabacion.metadata_extras.storage_url,
                latitud: grabacion.latitud,
                longitud: grabacion.longitud,
                fecha: grabacion.created_at
              })
            }
          );

          if (!response.ok) {
            throw new Error('Error en análisis');
          }

          const result = await response.json();

          // Actualizar estado a completado
          setAnalysisStatuses(prev => ({
            ...prev,
            [grabacionId]: { 
              grabacionId, 
              status: 'completed',
              detections: result.data?.total_detections || 0
            }
          }));

        } catch (error: any) {
          setAnalysisStatuses(prev => ({
            ...prev,
            [grabacionId]: { 
              grabacionId, 
              status: 'error',
              error: error.message || 'Error desconocido'
            }
          }));
        }
      };

      // Procesar con concurrencia controlada
      while (queue.length > 0 || running.length > 0) {
        // Iniciar nuevos análisis hasta el límite
        while (running.length < concurrentLimit && queue.length > 0) {
          const grabacionId = queue.shift()!;
          const promise = processGrabacion(grabacionId);
          running.push(promise);
        }

        // Esperar a que termine al menos uno
        if (running.length > 0) {
          await Promise.race(running);
          // Limpiar promesas completadas
          const stillRunning = running.filter(p => {
            let completed = false;
            p.then(() => completed = true).catch(() => completed = true);
            return !completed;
          });
          running.length = 0;
          running.push(...stillRunning);
        }
      }

      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['grabaciones'] });
      queryClient.invalidateQueries({ queryKey: ['birdnet-detections'] });

    } catch (error: any) {
      console.error('Error en análisis por lotes:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getProyectoNombre = (proyectoId: string) => {
    return proyectos?.find(p => p.id === proyectoId)?.nombre || 'Sin proyecto';
  };

  const getStatusIcon = (status: AnalysisStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>;
      case 'analyzing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: AnalysisStatus['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-50';
      case 'analyzing':
        return 'bg-blue-50';
      case 'completed':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
    }
  };

  const completedCount = Object.values(analysisStatuses).filter(s => s.status === 'completed').length;
  const errorCount = Object.values(analysisStatuses).filter(s => s.status === 'error').length;
  const progress = selectedGrabaciones.length > 0 
    ? ((completedCount + errorCount) / selectedGrabaciones.length) * 100 
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bird className="w-6 h-6 text-blue-600" />
              Análisis por Lotes con BirdNET
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Analiza múltiples grabaciones simultáneamente
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Controles de selección */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                disabled={isAnalyzing}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                Seleccionar Todas
              </button>
              <button
                onClick={deselectAll}
                disabled={isAnalyzing}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Deseleccionar Todas
              </button>
              <span className="text-sm text-gray-600">
                {selectedGrabaciones.length} seleccionada{selectedGrabaciones.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Concurrencia:</label>
              <select
                value={concurrentLimit}
                onChange={(e) => setConcurrentLimit(Number(e.target.value))}
                disabled={isAnalyzing}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                <option value={1}>1 (Lento)</option>
                <option value={2}>2</option>
                <option value={3}>3 (Recomendado)</option>
                <option value={5}>5</option>
                <option value={10}>10 (Rápido)</option>
              </select>
            </div>
          </div>

          {/* Barra de progreso */}
          {isAnalyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900">
                  Analizando {selectedGrabaciones.length} grabaciones...
                </span>
                <span className="text-sm text-blue-700">
                  {completedCount + errorCount} / {selectedGrabaciones.length}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-blue-700">
                <span>{completedCount} completados</span>
                {errorCount > 0 && <span className="text-red-600">{errorCount} errores</span>}
              </div>
            </div>
          )}

          {/* Lista de grabaciones */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : grabaciones && grabaciones.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Seleccionar</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Archivo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Proyecto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Resultados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {grabaciones.map((grabacion) => {
                      const status = analysisStatuses[grabacion.id];
                      return (
                        <tr 
                          key={grabacion.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            status ? getStatusColor(status.status) : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedGrabaciones.includes(grabacion.id)}
                              onChange={() => toggleGrabacion(grabacion.id)}
                              disabled={isAnalyzing}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-xs">
                            {grabacion.nombre_archivo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {getProyectoNombre(grabacion.proyecto_id)}
                          </td>
                          <td className="px-4 py-3">
                            {status ? (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(status.status)}
                                <span className="text-xs text-gray-600">
                                  {status.status === 'pending' && 'Pendiente'}
                                  {status.status === 'analyzing' && 'Analizando...'}
                                  {status.status === 'completed' && 'Completado'}
                                  {status.status === 'error' && 'Error'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No analizado</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {status?.status === 'completed' && (
                              <span className="text-green-700 font-semibold">
                                {status.detections} especie{status.detections !== 1 ? 's' : ''}
                              </span>
                            )}
                            {status?.status === 'error' && (
                              <span className="text-red-600 text-xs">{status.error}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No hay grabaciones disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isAnalyzing}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? 'Analizando...' : 'Cerrar'}
            </button>
            <button
              onClick={analyzeInBatches}
              disabled={selectedGrabaciones.length === 0 || isAnalyzing}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando {completedCount + errorCount}/{selectedGrabaciones.length}...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar Análisis ({selectedGrabaciones.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAnalysis;
