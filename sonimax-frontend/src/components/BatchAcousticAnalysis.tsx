import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Loader2, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play
} from 'lucide-react';
import {
  calculateAllIndices,
  loadAudioFromURL,
  interpretIndices,
  type AcousticIndicesResult
} from '@/lib/acousticIndices';

interface BatchAcousticAnalysisProps {
  recordingIds: string[];
  onComplete?: () => void;
}

interface BatchProgress {
  total: number;
  completed: number;
  errors: number;
  current: string | null;
}

interface BatchResult {
  recordingId: string;
  success: boolean;
  indices?: AcousticIndicesResult;
  error?: string;
}

export default function BatchAcousticAnalysis({
  recordingIds,
  onComplete
}: BatchAcousticAnalysisProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    total: recordingIds.length,
    completed: 0,
    errors: 0,
    current: null
  });
  const [results, setResults] = useState<BatchResult[]>([]);

  // Cargar datos de grabaciones
  const { data: recordings } = useQuery({
    queryKey: ['recordings-batch', recordingIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grabaciones')
        .select('id, nombre_archivo, metadata_extras')
        .in('id', recordingIds);
      
      if (error) throw error;
      return data;
    },
    enabled: recordingIds.length > 0
  });

  const processRecording = async (recordingId: string, audioUrl: string): Promise<BatchResult> => {
    try {
      // Cargar audio
      const audioBuffer = await loadAudioFromURL(audioUrl);

      // Calcular índices
      const indices = calculateAllIndices(audioBuffer, {
        fftSize: 2048,
        numBands: 10,
        minFreq: 2000,
        maxFreq: 8000
      });

      // Guardar en base de datos
      const interpretation = interpretIndices(indices);

      const { error: dbError } = await supabase
        .from('acoustic_indices')
        .insert({
          grabacion_id: recordingId,
          aci: indices.aci,
          adi: indices.adi,
          bi: indices.bi,
          interpretacion: {
            aci: interpretation.aci,
            adi: interpretation.adi,
            bi: interpretation.bi,
            summary: interpretation.summary
          },
          parametros_calculo: {
            fftSize: 2048,
            numBands: 10,
            minFreq: 2000,
            maxFreq: 8000
          },
          duracion_segundos: indices.metadata.duration,
          sample_rate: indices.metadata.sampleRate,
          usuario_id: user?.id
        });

      if (dbError) throw dbError;

      return {
        recordingId,
        success: true,
        indices
      };
    } catch (error) {
      console.error(`Error procesando grabación ${recordingId}:`, error);
      return {
        recordingId,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const startBatchProcessing = async () => {
    if (!recordings || recordings.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    setResults([]);
    setProgress({
      total: recordings.length,
      completed: 0,
      errors: 0,
      current: null
    });

    const batchResults: BatchResult[] = [];

    for (let i = 0; i < recordings.length; i++) {
      // Verificar si está pausado
      while (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const recording = recordings[i];
      const audioUrl = recording.metadata_extras?.storage_url;

      if (!audioUrl) {
        batchResults.push({
          recordingId: recording.id,
          success: false,
          error: 'URL de audio no disponible'
        });
        setProgress(prev => ({
          ...prev,
          completed: prev.completed + 1,
          errors: prev.errors + 1
        }));
        continue;
      }

      setProgress(prev => ({
        ...prev,
        current: recording.nombre_archivo
      }));

      const result = await processRecording(recording.id, audioUrl);
      batchResults.push(result);

      setProgress(prev => ({
        ...prev,
        completed: prev.completed + 1,
        errors: prev.errors + (result.success ? 0 : 1)
      }));

      setResults([...batchResults]);

      // Pequeña pausa entre grabaciones para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
    setProgress(prev => ({ ...prev, current: null }));

    if (onComplete) {
      onComplete();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const progressPercentage = progress.total > 0 
    ? (progress.completed / progress.total) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Análisis por Lotes de Índices Acústicos
        </CardTitle>
        <CardDescription>
          Calcula índices acústicos para {recordingIds.length} grabaciones simultáneamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen de progreso */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Progreso: {progress.completed} / {progress.total}
            </span>
            <span className="font-medium">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={progressPercentage} />
          
          {progress.current && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando: {progress.current}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-1 p-4 bg-gray-50 rounded-lg">
            <span className="text-2xl font-bold">{progress.total}</span>
            <span className="text-xs text-gray-600">Total</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 bg-green-50 rounded-lg">
            <span className="text-2xl font-bold text-green-600">
              {progress.completed - progress.errors}
            </span>
            <span className="text-xs text-gray-600">Exitosos</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 bg-red-50 rounded-lg">
            <span className="text-2xl font-bold text-red-600">{progress.errors}</span>
            <span className="text-xs text-gray-600">Errores</span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          {!isProcessing ? (
            <Button 
              onClick={startBatchProcessing} 
              className="flex-1"
              disabled={!recordings || recordings.length === 0}
            >
              <Activity className="w-4 h-4 mr-2" />
              Iniciar Análisis por Lotes
            </Button>
          ) : (
            <Button 
              onClick={togglePause} 
              variant="outline"
              className="flex-1"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              )}
            </Button>
          )}
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Resultados:</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {results.map((result, index) => {
                const recording = recordings?.find(r => r.id === result.recordingId);
                return (
                  <div
                    key={result.recordingId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {recording?.nombre_archivo || `Grabación ${index + 1}`}
                        </p>
                        {!result.success && result.error && (
                          <p className="text-xs text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                    {result.success && result.indices && (
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          ACI: {result.indices.aci.toFixed(2)}
                        </Badge>
                        <Badge variant="outline">
                          ADI: {result.indices.adi.toFixed(2)}
                        </Badge>
                        <Badge variant="outline">
                          BI: {result.indices.bi.toFixed(2)}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Advertencia */}
        {recordingIds.length > 10 && !isProcessing && (
          <div className="flex items-start gap-2 p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Procesamiento intensivo</p>
              <p>
                Estás a punto de procesar {recordingIds.length} grabaciones. Esto puede tomar 
                varios minutos y consumir recursos del navegador.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
