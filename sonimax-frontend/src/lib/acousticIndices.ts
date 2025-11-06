/**
 * Librería de Índices Acústicos
 * 
 * Implementa algoritmos estándar para análisis de paisajes sonoros (soundscapes):
 * - ACI (Acoustic Complexity Index)
 * - ADI (Acoustic Diversity Index)
 * - BI (Bioacoustic Index)
 * 
 * Referencias:
 * - Pieretti et al. (2011) - ACI
 * - Villanueva-Rivera et al. (2011) - ADI
 * - Boelman et al. (2007) - BI
 */

export interface AcousticIndicesResult {
  aci: number;
  aciNormalized: number;
  adi: number;
  adiNormalized: number;
  bi: number;
  biNormalized: number;
  metadata: {
    duration: number;
    sampleRate: number;
    frequencyBands: number;
    minFrequency: number;
    maxFrequency: number;
    calculatedAt: string;
  };
}

/**
 * Calcula el Acoustic Complexity Index (ACI)
 * 
 * Mide la complejidad temporal del sonido comparando diferencias de intensidad
 * entre frames temporales consecutivos. Valores más altos indican mayor complejidad.
 * 
 * Rango típico: 0-1000+
 * - 0-100: Muy simple (ruido constante, silencio)
 * - 100-500: Complejidad moderada
 * - 500+: Alta complejidad (coros de aves, ecosistemas diversos)
 * 
 * @param audioBuffer Buffer de audio del que extraer el ACI
 * @param fftSize Tamaño de FFT (default: 2048)
 * @returns Valor ACI sin normalizar
 */
export function calculateACI(audioBuffer: AudioBuffer, fftSize: number = 2048): number {
  const channelData = audioBuffer.getChannelData(0); // Usar canal mono o primer canal
  const sampleRate = audioBuffer.sampleRate;
  
  // Dividir en frames temporales
  const frameSize = fftSize;
  const hopSize = frameSize / 2; // 50% overlap
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize) + 1;
  
  if (numFrames < 2) {
    console.warn('Audio demasiado corto para calcular ACI');
    return 0;
  }
  
  // Calcular espectro para cada frame
  const spectrogram: number[][] = [];
  
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = channelData.slice(start, start + frameSize);
    
    // Aplicar ventana de Hamming
    const windowedFrame = applyHammingWindow(frame);
    
    // Calcular FFT (magnitud espectral)
    const spectrum = calculateFFTMagnitude(windowedFrame);
    spectrogram.push(spectrum);
  }
  
  // Calcular ACI: suma de diferencias absolutas entre frames consecutivos
  let aciTotal = 0;
  const numBins = spectrogram[0].length;
  
  for (let bin = 0; bin < numBins; bin++) {
    let binSum = 0;
    
    for (let frame = 1; frame < spectrogram.length; frame++) {
      const diff = Math.abs(spectrogram[frame][bin] - spectrogram[frame - 1][bin]);
      binSum += diff;
    }
    
    // Normalizar por la suma total de intensidades en este bin
    const totalIntensity = spectrogram.reduce((sum, frame) => sum + frame[bin], 0);
    
    if (totalIntensity > 0) {
      aciTotal += binSum / totalIntensity;
    }
  }
  
  return aciTotal;
}

/**
 * Calcula el Acoustic Diversity Index (ADI)
 * 
 * Mide la diversidad acústica basándose en la distribución de energía
 * a través de diferentes bandas de frecuencia usando entropía de Shannon.
 * 
 * Rango: 0-1
 * - 0: Sin diversidad (energía concentrada en una banda)
 * - 0.5: Diversidad moderada
 * - 1: Máxima diversidad (energía distribuida uniformemente)
 * 
 * @param audioBuffer Buffer de audio del que extraer el ADI
 * @param numBands Número de bandas de frecuencia (default: 10)
 * @returns Valor ADI normalizado (0-1)
 */
export function calculateADI(audioBuffer: AudioBuffer, numBands: number = 10): number {
  const channelData = audioBuffer.getChannelData(0);
  const fftSize = 2048;
  
  // Calcular espectro de potencia promedio
  const averageSpectrum = calculateAveragePowerSpectrum(channelData, fftSize);
  
  // Dividir el espectro en bandas de frecuencia
  const bandsPerBin = Math.floor(averageSpectrum.length / numBands);
  const bandEnergies: number[] = [];
  
  for (let i = 0; i < numBands; i++) {
    const start = i * bandsPerBin;
    const end = Math.min((i + 1) * bandsPerBin, averageSpectrum.length);
    
    // Sumar energía en esta banda
    let bandEnergy = 0;
    for (let j = start; j < end; j++) {
      bandEnergy += averageSpectrum[j];
    }
    
    bandEnergies.push(bandEnergy);
  }
  
  // Calcular energía total
  const totalEnergy = bandEnergies.reduce((sum, energy) => sum + energy, 0);
  
  if (totalEnergy === 0) {
    return 0; // Silencio total
  }
  
  // Calcular proporciones (probabilidades)
  const proportions = bandEnergies.map(energy => energy / totalEnergy);
  
  // Calcular entropía de Shannon
  let entropy = 0;
  for (const p of proportions) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  // Normalizar por la máxima entropía posible (log2(numBands))
  const maxEntropy = Math.log2(numBands);
  const adi = entropy / maxEntropy;
  
  return adi;
}

/**
 * Calcula el Bioacoustic Index (BI)
 * 
 * Mide la actividad biológica enfocándose en el rango de frecuencias
 * donde típicamente se encuentran las vocalizaciones animales (2-8 kHz).
 * 
 * Rango típico: 0-50+
 * - 0-5: Baja actividad biológica
 * - 5-15: Actividad moderada
 * - 15+: Alta actividad biológica
 * 
 * @param audioBuffer Buffer de audio del que extraer el BI
 * @param minFreq Frecuencia mínima en Hz (default: 2000)
 * @param maxFreq Frecuencia máxima en Hz (default: 8000)
 * @returns Valor BI (área bajo la curva en rango de frecuencias)
 */
export function calculateBI(
  audioBuffer: AudioBuffer,
  minFreq: number = 2000,
  maxFreq: number = 8000
): number {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const fftSize = 2048;
  
  // Calcular espectro de potencia promedio
  const averageSpectrum = calculateAveragePowerSpectrum(channelData, fftSize);
  
  // Convertir índices de bins a frecuencias
  const freqPerBin = sampleRate / fftSize;
  const minBin = Math.floor(minFreq / freqPerBin);
  const maxBin = Math.floor(maxFreq / freqPerBin);
  
  // Calcular área bajo la curva en el rango de frecuencias biológicas
  let biArea = 0;
  for (let i = minBin; i < Math.min(maxBin, averageSpectrum.length); i++) {
    biArea += averageSpectrum[i];
  }
  
  // Normalizar por el ancho de banda (en kHz)
  const bandwidth = (maxFreq - minFreq) / 1000;
  const bi = biArea / bandwidth;
  
  return bi;
}

/**
 * Calcula todos los índices acústicos de una vez
 * 
 * @param audioBuffer Buffer de audio a analizar
 * @param options Opciones de configuración
 * @returns Objeto con todos los índices y metadatos
 */
export function calculateAllIndices(
  audioBuffer: AudioBuffer,
  options: {
    fftSize?: number;
    numBands?: number;
    minFreq?: number;
    maxFreq?: number;
  } = {}
): AcousticIndicesResult {
  const {
    fftSize = 2048,
    numBands = 10,
    minFreq = 2000,
    maxFreq = 8000
  } = options;
  
  // Calcular índices
  const aci = calculateACI(audioBuffer, fftSize);
  const adi = calculateADI(audioBuffer, numBands);
  const bi = calculateBI(audioBuffer, minFreq, maxFreq);
  
  // Normalizar ACI y BI a rango 0-1 usando rangos típicos
  const aciNormalized = Math.min(aci / 1000, 1); // ACI típico < 1000
  const biNormalized = Math.min(bi / 50, 1); // BI típico < 50
  
  return {
    aci,
    aciNormalized,
    adi,
    adiNormalized: adi, // ADI ya está normalizado
    bi,
    biNormalized,
    metadata: {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      frequencyBands: numBands,
      minFrequency: minFreq,
      maxFrequency: maxFreq,
      calculatedAt: new Date().toISOString()
    }
  };
}

// ============================================================================
// Funciones auxiliares (DSP)
// ============================================================================

/**
 * Aplica ventana de Hamming para reducir efectos de borde en FFT
 */
function applyHammingWindow(signal: Float32Array): Float32Array {
  const windowed = new Float32Array(signal.length);
  
  for (let i = 0; i < signal.length; i++) {
    const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (signal.length - 1));
    windowed[i] = signal[i] * window;
  }
  
  return windowed;
}

/**
 * Calcula la magnitud del espectro FFT (simplificado usando Web Audio API)
 * 
 * Nota: Esto es una implementación básica. Para producción considerar usar
 * librerías como fft.js o realizar FFT real con Complex numbers.
 */
function calculateFFTMagnitude(signal: Float32Array): number[] {
  const fftSize = signal.length;
  const halfSize = fftSize / 2;
  const magnitude: number[] = [];
  
  // Implementación simplificada: calcular potencia espectral directamente
  // En producción usar FFT real (DFT/FFT de Cooley-Tukey)
  for (let k = 0; k < halfSize; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < fftSize; n++) {
      const angle = (2 * Math.PI * k * n) / fftSize;
      real += signal[n] * Math.cos(angle);
      imag -= signal[n] * Math.sin(angle);
    }
    
    // Magnitud = sqrt(real^2 + imag^2)
    magnitude.push(Math.sqrt(real * real + imag * imag));
  }
  
  return magnitude;
}

/**
 * Calcula el espectro de potencia promedio de toda la señal
 */
function calculateAveragePowerSpectrum(
  channelData: Float32Array,
  fftSize: number
): number[] {
  const hopSize = fftSize / 2;
  const numFrames = Math.floor((channelData.length - fftSize) / hopSize) + 1;
  
  if (numFrames === 0) {
    return new Array(fftSize / 2).fill(0);
  }
  
  // Acumular espectros
  const sumSpectrum = new Array(fftSize / 2).fill(0);
  
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const frame = channelData.slice(start, start + fftSize);
    const windowedFrame = applyHammingWindow(frame);
    const spectrum = calculateFFTMagnitude(windowedFrame);
    
    for (let j = 0; j < spectrum.length; j++) {
      sumSpectrum[j] += spectrum[j] * spectrum[j]; // Potencia = magnitud^2
    }
  }
  
  // Promediar
  for (let j = 0; j < sumSpectrum.length; j++) {
    sumSpectrum[j] /= numFrames;
  }
  
  return sumSpectrum;
}

/**
 * Carga un archivo de audio y retorna AudioBuffer para análisis
 */
export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  return audioBuffer;
}

/**
 * Carga audio desde URL y retorna AudioBuffer
 */
export async function loadAudioFromURL(url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  return audioBuffer;
}

/**
 * Interpreta el resultado de índices acústicos en lenguaje natural
 */
export function interpretIndices(result: AcousticIndicesResult): {
  aci: string;
  adi: string;
  bi: string;
  summary: string;
} {
  // Interpretar ACI
  let aciText = '';
  if (result.aci < 100) {
    aciText = 'Muy baja complejidad acústica (ruido constante o silencio)';
  } else if (result.aci < 500) {
    aciText = 'Complejidad acústica moderada';
  } else {
    aciText = 'Alta complejidad acústica (ecosistema diverso)';
  }
  
  // Interpretar ADI
  let adiText = '';
  if (result.adi < 0.3) {
    adiText = 'Baja diversidad acústica (energía concentrada)';
  } else if (result.adi < 0.7) {
    adiText = 'Diversidad acústica moderada';
  } else {
    adiText = 'Alta diversidad acústica (energía distribuida)';
  }
  
  // Interpretar BI
  let biText = '';
  if (result.bi < 5) {
    biText = 'Baja actividad biológica';
  } else if (result.bi < 15) {
    biText = 'Actividad biológica moderada';
  } else {
    biText = 'Alta actividad biológica';
  }
  
  // Resumen general
  let summary = '';
  const avgNormalized = (result.aciNormalized + result.adiNormalized + result.biNormalized) / 3;
  
  if (avgNormalized < 0.3) {
    summary = 'Paisaje sonoro pobre: baja complejidad, diversidad y actividad biológica. Posible degradación del hábitat o perturbación antropogénica.';
  } else if (avgNormalized < 0.6) {
    summary = 'Paisaje sonoro moderado: complejidad y diversidad medias. Ecosistema con actividad biológica regular.';
  } else {
    summary = 'Paisaje sonoro rico: alta complejidad, diversidad y actividad biológica. Ecosistema saludable y diverso.';
  }
  
  return {
    aci: aciText,
    adi: adiText,
    bi: biText,
    summary
  };
}
