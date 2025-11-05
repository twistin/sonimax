import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Volume2, Loader2, Bird } from 'lucide-react';

interface BirdDetection {
  id: string;
  common_name: string;
  scientific_name: string;
  confidence_score: number;
  start_time_seconds: number;
  end_time_seconds: number;
}

interface WaveformViewerProps {
  audioUrl: string;
  height?: number;
  birdDetections?: BirdDetection[];
  onMarkerClick?: (detection: BirdDetection) => void;
}

export default function WaveformViewer({ 
  audioUrl, 
  height = 128,
  birdDetections = [],
  onMarkerClick
}: WaveformViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [hoveredDetection, setHoveredDetection] = useState<BirdDetection | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const markersRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Crear instancia de WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#94A3B8',
      progressColor: '#3B82F6',
      cursorColor: '#1E40AF',
      barWidth: 2,
      barRadius: 3,
      height,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    // Cargar audio
    wavesurfer.load(audioUrl);

    // Event listeners
    wavesurfer.on('ready', () => {
      setIsReady(true);
      setDuration(formatTime(wavesurfer.getDuration()));
      
      // Agregar markers de detecciones si existen
      if (birdDetections.length > 0) {
        addDetectionMarkers(wavesurfer);
      }
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    
    wavesurfer.on('audioprocess', () => {
      setCurrentTime(formatTime(wavesurfer.getCurrentTime()));
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      wavesurfer.seekTo(0);
    });

    // Cleanup
    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, height]);

  // Actualizar markers cuando cambien las detecciones
  useEffect(() => {
    if (wavesurferRef.current && isReady && birdDetections.length > 0) {
      addDetectionMarkers(wavesurferRef.current);
    }
  }, [birdDetections, isReady]);

  const addDetectionMarkers = (wavesurfer: WaveSurfer) => {
    // Limpiar markers anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const audioDuration = wavesurfer.getDuration();
    if (!audioDuration) return;

    const waveformContainer = containerRef.current;
    if (!waveformContainer) return;

    birdDetections.forEach((detection) => {
      const position = (detection.start_time_seconds / audioDuration) * 100;
      
      const marker = document.createElement('div');
      marker.className = 'absolute top-0 bottom-0 cursor-pointer transition-all hover:w-1 z-10';
      marker.style.left = `${position}%`;
      marker.style.width = '2px';
      
      // Color basado en confidence
      if (detection.confidence_score >= 0.9) {
        marker.style.backgroundColor = '#10b981'; // green-500
      } else if (detection.confidence_score >= 0.8) {
        marker.style.backgroundColor = '#3b82f6'; // blue-500
      } else if (detection.confidence_score >= 0.7) {
        marker.style.backgroundColor = '#eab308'; // yellow-500
      } else {
        marker.style.backgroundColor = '#6b7280'; // gray-500
      }

      // Event listeners para tooltip y click
      marker.addEventListener('mouseenter', (e) => {
        setHoveredDetection(detection);
        const rect = marker.getBoundingClientRect();
        setTooltipPosition({ x: rect.left, y: rect.top });
      });

      marker.addEventListener('mouseleave', () => {
        setHoveredDetection(null);
      });

      marker.addEventListener('click', () => {
        wavesurfer.seekTo(detection.start_time_seconds / audioDuration);
        if (onMarkerClick) {
          onMarkerClick(detection);
        }
      });

      waveformContainer.appendChild(marker);
      markersRef.current.push(marker);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const jumpToDetection = (detection: BirdDetection) => {
    if (wavesurferRef.current) {
      const audioDuration = wavesurferRef.current.getDuration();
      wavesurferRef.current.seekTo(detection.start_time_seconds / audioDuration);
      wavesurferRef.current.play();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Info de detecciones */}
        {birdDetections.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
            <Bird className="w-4 h-4 text-green-600" />
            <span>
              {birdDetections.length} especie{birdDetections.length !== 1 ? 's' : ''} detectada{birdDetections.length !== 1 ? 's' : ''} - 
              Click en los marcadores de color para saltar a las detecciones
            </span>
          </div>
        )}

        {/* Waveform con markers */}
        <div className="relative">
          <div ref={containerRef} className="relative" />
          
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Cargando forma de onda...</p>
              </div>
            </div>
          )}

          {/* Tooltip de detección */}
          {hoveredDetection && (
            <div 
              className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y - 100}px`,
              }}
            >
              <div className="font-bold mb-1">{hoveredDetection.common_name}</div>
              <div className="text-gray-300 italic mb-2">{hoveredDetection.scientific_name}</div>
              <div className="space-y-1">
                <div>Confianza: {(hoveredDetection.confidence_score * 100).toFixed(0)}%</div>
                <div>Tiempo: {formatTime(hoveredDetection.start_time_seconds)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayPause}
            disabled={!isReady}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {currentTime} / {duration}
            </span>
          </div>

          {birdDetections.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">&gt;90%</span>
              </div>
              <div className="flex items-center gap-1 text-xs ml-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">80-90%</span>
              </div>
              <div className="flex items-center gap-1 text-xs ml-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">70-80%</span>
              </div>
            </div>
          )}
        </div>

        {/* Lista rápida de detecciones */}
        {birdDetections.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Saltar a detección:</h4>
            <div className="flex flex-wrap gap-2">
              {birdDetections.map((detection) => (
                <button
                  key={detection.id}
                  onClick={() => jumpToDetection(detection)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                  title={`${detection.common_name} - ${(detection.confidence_score * 100).toFixed(0)}%`}
                >
                  <Bird className="w-3 h-3" />
                  {detection.common_name.split(' ')[0]} - {formatTime(detection.start_time_seconds)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
