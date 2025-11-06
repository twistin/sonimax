/**
 * Librería de Filtros de Audio usando Web Audio API
 * 
 * Implementa filtros profesionales para procesamiento de audio en tiempo real:
 * - High-pass (pasa-altos): Elimina frecuencias bajas
 * - Low-pass (pasa-bajos): Elimina frecuencias altas  
 * - Band-pass (pasa-banda): Solo permite rango específico
 * - Notch (rechaza-banda): Elimina rango específico
 * - Equalizer (ecualizador): Control de múltiples bandas
 */

export type FilterType = 'highpass' | 'lowpass' | 'bandpass' | 'notch' | 'allpass';

export interface AudioFilterConfig {
  type: FilterType;
  frequency: number; // Hz
  Q?: number; // Quality factor (ancho de banda)
  gain?: number; // dB (para peaking/shelving)
  enabled: boolean;
}

export class AudioFiltersManager {
  private audioContext: AudioContext;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private destinationNode: AudioNode;
  private filters: Map<string, BiquadFilterNode> = new Map();
  private connectedFilters: string[] = [];
  
  constructor(audioContext: AudioContext, destination?: AudioNode) {
    this.audioContext = audioContext;
    this.destinationNode = destination || audioContext.destination;
  }

  /**
   * Conecta el source de audio al sistema de filtros
   */
  connectSource(source: MediaElementAudioSourceNode): void {
    this.sourceNode = source;
    this.reconnectFilterChain();
  }

  /**
   * Crea o actualiza un filtro
   */
  addOrUpdateFilter(
    filterId: string,
    config: AudioFilterConfig
  ): BiquadFilterNode {
    let filter = this.filters.get(filterId);

    if (!filter) {
      filter = this.audioContext.createBiquadFilter();
      this.filters.set(filterId, filter);
    }

    // Configurar filtro
    filter.type = config.type;
    filter.frequency.value = config.frequency;
    
    if (config.Q !== undefined) {
      filter.Q.value = config.Q;
    }
    
    if (config.gain !== undefined) {
      filter.gain.value = config.gain;
    }

    // Actualizar cadena de filtros si está habilitado
    if (config.enabled) {
      if (!this.connectedFilters.includes(filterId)) {
        this.connectedFilters.push(filterId);
      }
    } else {
      const index = this.connectedFilters.indexOf(filterId);
      if (index > -1) {
        this.connectedFilters.splice(index, 1);
      }
    }

    this.reconnectFilterChain();

    return filter;
  }

  /**
   * Habilita o deshabilita un filtro
   */
  toggleFilter(filterId: string, enabled: boolean): void {
    if (enabled) {
      if (!this.connectedFilters.includes(filterId)) {
        this.connectedFilters.push(filterId);
      }
    } else {
      const index = this.connectedFilters.indexOf(filterId);
      if (index > -1) {
        this.connectedFilters.splice(index, 1);
      }
    }

    this.reconnectFilterChain();
  }

  /**
   * Elimina un filtro
   */
  removeFilter(filterId: string): void {
    const filter = this.filters.get(filterId);
    if (filter) {
      filter.disconnect();
      this.filters.delete(filterId);
      
      const index = this.connectedFilters.indexOf(filterId);
      if (index > -1) {
        this.connectedFilters.splice(index, 1);
      }

      this.reconnectFilterChain();
    }
  }

  /**
   * Elimina todos los filtros
   */
  clearAllFilters(): void {
    this.filters.forEach(filter => filter.disconnect());
    this.filters.clear();
    this.connectedFilters = [];
    this.reconnectFilterChain();
  }

  /**
   * Reconecta la cadena de filtros en el orden correcto
   */
  private reconnectFilterChain(): void {
    if (!this.sourceNode) return;

    // Desconectar todo
    this.sourceNode.disconnect();
    this.filters.forEach(filter => filter.disconnect());

    // Crear cadena de filtros activos
    const activeFilters = this.connectedFilters
      .map(id => this.filters.get(id))
      .filter((f): f is BiquadFilterNode => f !== undefined);

    if (activeFilters.length === 0) {
      // Sin filtros, conectar directamente al destino
      this.sourceNode.connect(this.destinationNode);
    } else {
      // Conectar cadena de filtros
      this.sourceNode.connect(activeFilters[0]);

      for (let i = 0; i < activeFilters.length - 1; i++) {
        activeFilters[i].connect(activeFilters[i + 1]);
      }

      activeFilters[activeFilters.length - 1].connect(this.destinationNode);
    }
  }

  /**
   * Obtiene la respuesta de frecuencia del sistema de filtros
   */
  getFrequencyResponse(
    frequenciesHz: Float32Array
  ): { magnitude: Float32Array; phase: Float32Array } {
    const magnitude = new Float32Array(frequenciesHz.length);
    const phase = new Float32Array(frequenciesHz.length);

    magnitude.fill(1);
    phase.fill(0);

    // Calcular respuesta acumulativa de todos los filtros activos
    const activeFilters = this.connectedFilters
      .map(id => this.filters.get(id))
      .filter((f): f is BiquadFilterNode => f !== undefined);

    activeFilters.forEach(filter => {
      const tempMag = new Float32Array(frequenciesHz.length);
      const tempPhase = new Float32Array(frequenciesHz.length);

      filter.getFrequencyResponse(frequenciesHz as any, tempMag as any, tempPhase as any);

      // Multiplicar magnitudes y sumar fases
      for (let i = 0; i < frequenciesHz.length; i++) {
        magnitude[i] *= tempMag[i];
        phase[i] += tempPhase[i];
      }
    });

    return { magnitude, phase };
  }

  /**
   * Obtiene todos los filtros activos
   */
  getActiveFilters(): Map<string, BiquadFilterNode> {
    const active = new Map<string, BiquadFilterNode>();
    this.connectedFilters.forEach(id => {
      const filter = this.filters.get(id);
      if (filter) {
        active.set(id, filter);
      }
    });
    return active;
  }

  /**
   * Obtiene configuración actual de un filtro
   */
  getFilterConfig(filterId: string): AudioFilterConfig | null {
    const filter = this.filters.get(filterId);
    if (!filter) return null;

    return {
      type: filter.type as FilterType,
      frequency: filter.frequency.value,
      Q: filter.Q.value,
      gain: filter.gain.value,
      enabled: this.connectedFilters.includes(filterId)
    };
  }
}

/**
 * Presets de filtros comunes para bioacústica
 */
export const FILTER_PRESETS = {
  // Eliminar ruido de baja frecuencia (viento, tráfico)
  lowFrequencyNoise: {
    id: 'low-freq-noise',
    type: 'highpass' as FilterType,
    frequency: 300,
    Q: 1,
    enabled: true,
    name: 'Eliminar ruido de baja frecuencia',
    description: 'Reduce viento, tráfico y vibraciones (<300 Hz)'
  },

  // Aves pequeñas (frecuencias altas)
  smallBirds: {
    id: 'small-birds',
    type: 'highpass' as FilterType,
    frequency: 2000,
    Q: 0.7,
    enabled: true,
    name: 'Aves pequeñas',
    description: 'Enfatiza vocalizaciones de aves pequeñas (>2 kHz)'
  },

  // Aves grandes y mamíferos (frecuencias medias-bajas)
  largeBirds: {
    id: 'large-birds',
    type: 'bandpass' as FilterType,
    frequency: 1000,
    Q: 1,
    enabled: true,
    name: 'Aves grandes y mamíferos',
    description: 'Rango 500-2000 Hz'
  },

  // Anfibios (frecuencias bajas)
  amphibians: {
    id: 'amphibians',
    type: 'bandpass' as FilterType,
    frequency: 500,
    Q: 1.5,
    enabled: true,
    name: 'Anfibios',
    description: 'Rango 200-1000 Hz (ranas, sapos)'
  },

  // Insectos (frecuencias muy altas)
  insects: {
    id: 'insects',
    type: 'highpass' as FilterType,
    frequency: 5000,
    Q: 0.5,
    enabled: true,
    name: 'Insectos',
    description: 'Enfatiza sonidos de insectos (>5 kHz)'
  },

  // Murciélagos (ultrasonido)
  bats: {
    id: 'bats',
    type: 'highpass' as FilterType,
    frequency: 15000,
    Q: 0.3,
    enabled: true,
    name: 'Murciélagos (ultrasonido)',
    description: 'Rango ultrasónico >15 kHz'
  },

  // Eliminar ruido de 50/60 Hz (eléctrico)
  electricalHum: {
    id: 'electrical-hum',
    type: 'notch' as FilterType,
    frequency: 50,
    Q: 30,
    enabled: true,
    name: 'Eliminar zumbido eléctrico',
    description: 'Rechaza 50 Hz (o 60 Hz para EEUU)'
  },

  // Voz humana
  humanVoice: {
    id: 'human-voice',
    type: 'bandpass' as FilterType,
    frequency: 1500,
    Q: 1,
    enabled: true,
    name: 'Voz humana',
    description: 'Rango 300-3000 Hz'
  }
};

/**
 * Crea un ecualizador de 10 bandas
 */
export function createEqualizer(
  audioContext: AudioContext
): BiquadFilterNode[] {
  // Frecuencias estándar de ecualizador
  const frequencies = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  return frequencies.map(freq => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 1;
    filter.gain.value = 0; // 0 dB = sin cambio
    return filter;
  });
}

/**
 * Conecta múltiples filtros en serie
 */
export function connectFiltersInSeries(
  source: AudioNode,
  filters: BiquadFilterNode[],
  destination: AudioNode
): void {
  if (filters.length === 0) {
    source.connect(destination);
    return;
  }

  source.connect(filters[0]);

  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }

  filters[filters.length - 1].connect(destination);
}

/**
 * Calcula frecuencia de corte óptima para un filtro high-pass
 * basado en el análisis del ruido de baja frecuencia
 */
export function calculateOptimalHighpassFrequency(
  audioBuffer: AudioBuffer,
  noiseThreshold: number = 0.1
): number {
  // Análisis simplificado: detectar frecuencia donde el nivel
  // de ruido es consistentemente alto
  
  // Por defecto, usar 300 Hz para ruido urbano típico
  // En implementación completa, analizar espectro
  return 300;
}
