import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sliders, 
  Power, 
  RotateCcw,
  Info
} from 'lucide-react';
import {
  AudioFiltersManager,
  type AudioFilterConfig,
  type FilterType,
  FILTER_PRESETS
} from '@/lib/audioFilters';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AudioFiltersControlProps {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  onFiltersChange?: (manager: AudioFiltersManager) => void;
}

export default function AudioFiltersControl({
  audioContext,
  sourceNode,
  onFiltersChange
}: AudioFiltersControlProps) {
  const [filtersManager, setFiltersManager] = useState<AudioFiltersManager | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  
  // Filtros custom
  const [customHighpass, setCustomHighpass] = useState({ freq: 300, Q: 1, enabled: false });
  const [customLowpass, setCustomLowpass] = useState({ freq: 8000, Q: 1, enabled: false });
  const [customBandpass, setCustomBandpass] = useState({ freq: 1000, Q: 1, enabled: false });

  useEffect(() => {
    if (audioContext && sourceNode) {
      const manager = new AudioFiltersManager(audioContext);
      manager.connectSource(sourceNode);
      setFiltersManager(manager);

      if (onFiltersChange) {
        onFiltersChange(manager);
      }
    }
  }, [audioContext, sourceNode]);

  const togglePresetFilter = (presetKey: string) => {
    if (!filtersManager) return;

    const preset = FILTER_PRESETS[presetKey as keyof typeof FILTER_PRESETS];
    const isActive = activeFilters.has(presetKey);

    if (isActive) {
      filtersManager.removeFilter(preset.id);
      setActiveFilters(prev => {
        const newSet = new Set(prev);
        newSet.delete(presetKey);
        return newSet;
      });
    } else {
      filtersManager.addOrUpdateFilter(preset.id, {
        type: preset.type,
        frequency: preset.frequency,
        Q: preset.Q,
        enabled: true
      });
      setActiveFilters(prev => new Set(prev).add(presetKey));
    }
  };

  const updateCustomHighpass = () => {
    if (!filtersManager) return;

    if (customHighpass.enabled) {
      filtersManager.addOrUpdateFilter('custom-highpass', {
        type: 'highpass',
        frequency: customHighpass.freq,
        Q: customHighpass.Q,
        enabled: true
      });
    } else {
      filtersManager.removeFilter('custom-highpass');
    }
  };

  const updateCustomLowpass = () => {
    if (!filtersManager) return;

    if (customLowpass.enabled) {
      filtersManager.addOrUpdateFilter('custom-lowpass', {
        type: 'lowpass',
        frequency: customLowpass.freq,
        Q: customLowpass.Q,
        enabled: true
      });
    } else {
      filtersManager.removeFilter('custom-lowpass');
    }
  };

  const updateCustomBandpass = () => {
    if (!filtersManager) return;

    if (customBandpass.enabled) {
      filtersManager.addOrUpdateFilter('custom-bandpass', {
        type: 'bandpass',
        frequency: customBandpass.freq,
        Q: customBandpass.Q,
        enabled: true
      });
    } else {
      filtersManager.removeFilter('custom-bandpass');
    }
  };

  const clearAllFilters = () => {
    if (!filtersManager) return;

    filtersManager.clearAllFilters();
    setActiveFilters(new Set());
    setCustomHighpass(prev => ({ ...prev, enabled: false }));
    setCustomLowpass(prev => ({ ...prev, enabled: false }));
    setCustomBandpass(prev => ({ ...prev, enabled: false }));
  };

  useEffect(() => {
    updateCustomHighpass();
  }, [customHighpass]);

  useEffect(() => {
    updateCustomLowpass();
  }, [customLowpass]);

  useEffect(() => {
    updateCustomBandpass();
  }, [customBandpass]);

  if (!audioContext || !sourceNode) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="ml-2">
              Reproduce un audio para habilitar los filtros de frecuencia
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Filtros de Audio
            </CardTitle>
            <CardDescription>
              Filtra frecuencias específicas para mejorar el análisis
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            disabled={activeFilters.size === 0}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpiar todo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="presets">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Personalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="space-y-3 mt-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="ml-2 text-xs">
                Presets optimizados para bioacústica. Puedes activar varios a la vez.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(FILTER_PRESETS).map(([key, preset]) => {
                const isActive = activeFilters.has(key);
                
                return (
                  <button
                    key={key}
                    onClick={() => togglePresetFilter(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Power
                          className={`w-4 h-4 ${
                            isActive ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                        <span className="font-medium text-sm">{preset.name}</span>
                      </div>
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {preset.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      {preset.type} @ {preset.frequency} Hz
                      {preset.Q && ` (Q: ${preset.Q})`}
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6 mt-4">
            {/* High-pass filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Filtro Pasa-Altos (High-pass)</label>
                <Button
                  variant={customHighpass.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setCustomHighpass(prev => ({ ...prev, enabled: !prev.enabled }))
                  }
                >
                  <Power className="w-4 h-4 mr-1" />
                  {customHighpass.enabled ? 'ON' : 'OFF'}
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">
                    Frecuencia de corte: {customHighpass.freq} Hz
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="10000"
                    step="10"
                    value={customHighpass.freq}
                    onChange={(e) =>
                      setCustomHighpass(prev => ({
                        ...prev,
                        freq: Number(e.target.value)
                      }))
                    }
                    disabled={!customHighpass.enabled}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">
                    Q (pendiente): {customHighpass.Q.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={customHighpass.Q}
                    onChange={(e) =>
                      setCustomHighpass(prev => ({
                        ...prev,
                        Q: Number(e.target.value)
                      }))
                    }
                    disabled={!customHighpass.enabled}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Elimina frecuencias por debajo de {customHighpass.freq} Hz (ruido de baja frecuencia)
              </p>
            </div>

            {/* Low-pass filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Filtro Pasa-Bajos (Low-pass)</label>
                <Button
                  variant={customLowpass.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setCustomLowpass(prev => ({ ...prev, enabled: !prev.enabled }))
                  }
                >
                  <Power className="w-4 h-4 mr-1" />
                  {customLowpass.enabled ? 'ON' : 'OFF'}
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">
                    Frecuencia de corte: {customLowpass.freq} Hz
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={customLowpass.freq}
                    onChange={(e) =>
                      setCustomLowpass(prev => ({
                        ...prev,
                        freq: Number(e.target.value)
                      }))
                    }
                    disabled={!customLowpass.enabled}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">
                    Q (pendiente): {customLowpass.Q.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={customLowpass.Q}
                    onChange={(e) =>
                      setCustomLowpass(prev => ({
                        ...prev,
                        Q: Number(e.target.value)
                      }))
                    }
                    disabled={!customLowpass.enabled}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Elimina frecuencias por encima de {customLowpass.freq} Hz (ruido de alta frecuencia)
              </p>
            </div>

            {/* Band-pass filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Filtro Pasa-Banda (Band-pass)</label>
                <Button
                  variant={customBandpass.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setCustomBandpass(prev => ({ ...prev, enabled: !prev.enabled }))
                  }
                >
                  <Power className="w-4 h-4 mr-1" />
                  {customBandpass.enabled ? 'ON' : 'OFF'}
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">
                    Frecuencia central: {customBandpass.freq} Hz
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={customBandpass.freq}
                    onChange={(e) =>
                      setCustomBandpass(prev => ({
                        ...prev,
                        freq: Number(e.target.value)
                      }))
                    }
                    disabled={!customBandpass.enabled}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">
                    Q (ancho de banda): {customBandpass.Q.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={customBandpass.Q}
                    onChange={(e) =>
                      setCustomBandpass(prev => ({
                        ...prev,
                        Q: Number(e.target.value)
                      }))
                    }
                    disabled={!customBandpass.enabled}
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Solo permite frecuencias alrededor de {customBandpass.freq} Hz
                (±{(customBandpass.freq / customBandpass.Q / 2).toFixed(0)} Hz)
              </p>
            </div>

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="ml-2 text-xs">
                Los filtros personalizados se aplican en tiempo real. Ajusta los valores mientras escuchas para encontrar la configuración óptima.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Contador de filtros activos */}
        {activeFilters.size > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Filtros activos:</span>
              <Badge variant="default">{activeFilters.size}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
