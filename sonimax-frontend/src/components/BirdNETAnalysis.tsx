import React, { useState, useEffect } from 'react';
import { Bird, Loader2, Info, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BirdNETAnalysisProps {
  grabacionId: string;
  audioUrl: string;
  latitud?: number;
  longitud?: number;
  fecha?: string;
}

interface Detection {
  id: string;
  common_name: string;
  scientific_name: string;
  confidence_score: number;
  start_time_seconds: number;
  end_time_seconds: number;
  frequency_range: string;
}

const BirdNETAnalysis: React.FC<BirdNETAnalysisProps> = ({
  grabacionId,
  audioUrl,
  latitud,
  longitud,
  fecha
}) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    loadExistingDetections();
  }, [grabacionId]);

  const loadExistingDetections = async () => {
    try {
      const { data, error } = await supabase
        .from('birdnet_detections')
        .select('*')
        .eq('grabacion_id', grabacionId)
        .order('start_time_seconds');

      if (error) throw error;

      if (data && data.length > 0) {
        setDetections(data);
        setHasAnalyzed(true);
      }
    } catch (err: any) {
      console.error('Error cargando detecciones:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!user) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-birdnet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grabacionId,
            audioUrl,
            latitud,
            longitud,
            fecha
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error en análisis BirdNET');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        await loadExistingDetections();
      }

    } catch (err: any) {
      console.error('Error en análisis BirdNET:', err);
      setError(err.message || 'Error desconocido en análisis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.8) return 'bg-blue-500';
    if (confidence >= 0.7) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return 'Muy alta';
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.7) return 'Media';
    return 'Baja';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bird className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Análisis BirdNET</h3>
        </div>
        
        {!hasAnalyzed && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Bird className="w-4 h-4" />
                Analizar Especies
              </>
            )}
          </button>
        )}

        {hasAnalyzed && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Re-analizando...
              </>
            ) : (
              'Re-analizar'
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Error en análisis</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {detections.length === 0 && !isAnalyzing && (
        <div className="text-center py-8">
          <Bird className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No hay análisis disponible</p>
          <p className="text-sm text-gray-500">
            Haz clic en "Analizar Especies" para identificar aves en esta grabación
          </p>
        </div>
      )}

      {detections.length > 0 && (
        <div>
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-900">
              {detections.length} especie{detections.length !== 1 ? 's' : ''} detectada{detections.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-green-700 mt-1">
              Análisis completado con BirdNET AI
            </p>
          </div>

          <div className="space-y-3">
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{detection.common_name}</h4>
                    <p className="text-sm text-gray-600 italic">{detection.scientific_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${getConfidenceColor(detection.confidence_score)}`}>
                        {(detection.confidence_score * 100).toFixed(0)}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getConfidenceLabel(detection.confidence_score)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="font-medium">Tiempo:</span>
                    <span>
                      {formatTime(detection.start_time_seconds)} - {formatTime(detection.end_time_seconds)}
                    </span>
                  </div>
                  {detection.frequency_range && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <span className="font-medium">Frecuencia:</span>
                      <span>{detection.frequency_range}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                  <a
                    href={`https://ebird.org/species/${detection.scientific_name.toLowerCase().replace(' ', '-')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver en eBird
                  </a>
                  <a
                    href={`https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(detection.scientific_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver en iNaturalist
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!latitud && !longitud && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">Sin coordenadas GPS</p>
            <p className="text-xs text-yellow-700">
              El análisis será más preciso si la grabación tiene coordenadas GPS asociadas
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BirdNETAnalysis;
