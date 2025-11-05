import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Download, Settings } from 'lucide-react';

interface RealtimeSpectrogramProps {
  audioUrl?: string;
  audioElement?: HTMLAudioElement;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

const RealtimeSpectrogram: React.FC<RealtimeSpectrogramProps> = ({
  audioUrl,
  audioElement,
  isPlaying = false,
  onPlayPause
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [fftSize, setFftSize] = useState<number>(2048);
  const [minDecibels, setMinDecibels] = useState<number>(-90);
  const [maxDecibels, setMaxDecibels] = useState<number>(-10);
  const [colorScale, setColorScale] = useState<'viridis' | 'jet' | 'plasma'>('viridis');
  const [showSettings, setShowSettings] = useState(false);
  const [frequencyRange, setFrequencyRange] = useState<[number, number]>([0, 22050]);
  
  const spectrogramDataRef = useRef<number[][]>([]);
  const maxTimeColumns = 300; // Número máximo de columnas temporales

  useEffect(() => {
    if (audioElement) {
      initializeAudioContext(audioElement);
    } else if (audioUrl) {
      loadAudioFromUrl(audioUrl);
    }

    return () => {
      cleanup();
    };
  }, [audioUrl, audioElement]);

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.minDecibels = minDecibels;
      analyserRef.current.maxDecibels = maxDecibels;
    }
  }, [fftSize, minDecibels, maxDecibels]);

  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      startVisualization();
    } else {
      stopVisualization();
    }
  }, [isPlaying]);

  const loadAudioFromUrl = async (url: string) => {
    try {
      const audio = new Audio(url);
      audio.crossOrigin = 'anonymous';
      await audio.load();
      initializeAudioContext(audio);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const initializeAudioContext = (audio: HTMLAudioElement) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audio);
      }

      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = fftSize;
        analyserRef.current.minDecibels = minDecibels;
        analyserRef.current.maxDecibels = maxDecibels;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }

      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);

      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  };

  const startVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      // Agregar nueva columna de datos
      spectrogramDataRef.current.push(Array.from(dataArray));

      // Mantener solo las últimas N columnas
      if (spectrogramDataRef.current.length > maxTimeColumns) {
        spectrogramDataRef.current.shift();
      }

      // Renderizar espectrograma
      renderSpectrogram(ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const renderSpectrogram = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const data = spectrogramDataRef.current;
    if (data.length === 0) return;

    const columnWidth = width / maxTimeColumns;
    const numFreqBins = data[0].length;
    const rowHeight = height / numFreqBins;

    // Calcular índices de frecuencia para el rango deseado
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const minFreqIndex = Math.floor((frequencyRange[0] / nyquist) * numFreqBins);
    const maxFreqIndex = Math.ceil((frequencyRange[1] / nyquist) * numFreqBins);

    data.forEach((column, timeIndex) => {
      const x = timeIndex * columnWidth;

      for (let freqIndex = minFreqIndex; freqIndex < maxFreqIndex; freqIndex++) {
        const value = column[freqIndex] / 255; // Normalizar a 0-1
        const y = height - ((freqIndex - minFreqIndex) / (maxFreqIndex - minFreqIndex)) * height;

        ctx.fillStyle = getColorForValue(value, colorScale);
        ctx.fillRect(x, y, columnWidth + 1, rowHeight + 1);
      }
    });

    // Dibujar grid de frecuencias
    drawFrequencyGrid(ctx, width, height);
  };

  const drawFrequencyGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

    const frequencies = [100, 1000, 5000, 10000, 20000];
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const nyquist = sampleRate / 2;

    frequencies.forEach(freq => {
      if (freq >= frequencyRange[0] && freq <= frequencyRange[1]) {
        const normalized = (freq - frequencyRange[0]) / (frequencyRange[1] - frequencyRange[0]);
        const y = height - (normalized * height);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        const label = freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`;
        ctx.fillText(label, 5, y - 2);
      }
    });
  };

  const getColorForValue = (value: number, scale: string): string => {
    // Viridis color scheme (simplified)
    if (scale === 'viridis') {
      const colors = [
        [68, 1, 84],
        [59, 82, 139],
        [33, 145, 140],
        [94, 201, 98],
        [253, 231, 37]
      ];
      const index = Math.floor(value * (colors.length - 1));
      const nextIndex = Math.min(index + 1, colors.length - 1);
      const t = (value * (colors.length - 1)) - index;
      
      const r = Math.round(colors[index][0] + t * (colors[nextIndex][0] - colors[index][0]));
      const g = Math.round(colors[index][1] + t * (colors[nextIndex][1] - colors[index][1]));
      const b = Math.round(colors[index][2] + t * (colors[nextIndex][2] - colors[index][2]));
      
      return `rgb(${r}, ${g}, ${b})`;
    } else if (scale === 'jet') {
      // Jet color scheme
      const r = Math.max(0, Math.min(255, 255 * (1.5 - Math.abs(4 * value - 3))));
      const g = Math.max(0, Math.min(255, 255 * (1.5 - Math.abs(4 * value - 2))));
      const b = Math.max(0, Math.min(255, 255 * (1.5 - Math.abs(4 * value - 1))));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Plasma color scheme (simplified)
      const r = Math.round(value * 255);
      const g = Math.round(value * value * 200);
      const b = Math.round((1 - value) * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const downloadScreenshot = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `spectrogram_${new Date().toISOString()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const cleanup = () => {
    stopVisualization();
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Espectrograma en Tiempo Real</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayPause}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={downloadScreenshot}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Descargar imagen"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Configuración"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-3 p-3 bg-gray-800 rounded-lg space-y-3">
          <div>
            <label className="block text-white text-sm mb-1">FFT Size: {fftSize}</label>
            <select
              value={fftSize}
              onChange={(e) => setFftSize(Number(e.target.value))}
              className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
            >
              <option value={1024}>1024</option>
              <option value={2048}>2048 (Default)</option>
              <option value={4096}>4096</option>
              <option value={8192}>8192</option>
            </select>
          </div>

          <div>
            <label className="block text-white text-sm mb-1">Escala de Color</label>
            <select
              value={colorScale}
              onChange={(e) => setColorScale(e.target.value as any)}
              className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
            >
              <option value="viridis">Viridis</option>
              <option value="jet">Jet</option>
              <option value="plasma">Plasma</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-white text-sm mb-1">Min dB: {minDecibels}</label>
              <input
                type="range"
                min={-100}
                max={-20}
                value={minDecibels}
                onChange={(e) => setMinDecibels(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-white text-sm mb-1">Max dB: {maxDecibels}</label>
              <input
                type="range"
                min={-50}
                max={0}
                value={maxDecibels}
                onChange={(e) => setMaxDecibels(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full bg-black rounded"
        style={{ maxHeight: '400px' }}
      />

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>Frecuencia: {frequencyRange[0]}Hz - {(frequencyRange[1] / 1000).toFixed(1)}kHz</span>
        <span>FFT: {fftSize} | {minDecibels}dB a {maxDecibels}dB</span>
      </div>
    </div>
  );
};

export default RealtimeSpectrogram;
