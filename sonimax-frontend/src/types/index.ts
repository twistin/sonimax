export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'administrador' | 'investigador' | 'operador' | 'analista';
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Proyecto {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string;
  objetivos?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  ubicacion?: string;
  estado: 'planificado' | 'activo' | 'completado' | 'suspendido';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Ruta {
  id: string;
  proyecto_id: string;
  nombre: string;
  descripcion?: string;
  tipo_ruta: 'transecto' | 'punto_fijo' | 'aleatorio' | 'sistematico';
  geometria?: any;
  configuracion: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PuntoGrabacion {
  id: string;
  ruta_id: string;
  nombre?: string;
  descripcion?: string;
  latitud: number;
  longitud: number;
  altitud?: number;
  precision_gps?: number;
  velocidad_kmh?: number;
  direccion_grados?: number;
  timestamp_gps?: string;
  horizonte_visible?: number;
  obstaculos_cercanos?: string;
  condiciones_ambientales: Record<string, any>;
  metadata_extras: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Grabacion {
  id: string;
  punto_id: string;
  equipo_id?: string;
  usuario_id?: string;
  nombre_archivo: string;
  ruta_archivo: string;
  tamano_archivo?: number;
  hash_archivo?: string;
  inicio_grabacion: string;
  fin_grabacion: string;
  duracion_segundos: number;
  estado: 'grabada' | 'procesando' | 'procesada' | 'publicada' | 'archivada';
  nivel_ruido_promedio?: number;
  snr_estimado?: number;
  notas_campo?: string;
  notas_operador?: string;
  contexto_grabacion?: string;
  configuracion_captura: Record<string, any>;
  metadata_extras: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MetadatosAudio {
  id: string;
  grabacion_id: string;
  codec: string;
  sample_rate: number;
  bit_depth?: string;
  canales: string;
  bit_rate?: number;
  contenedor: string;
  compresion_ratio?: number;
  calidad_audio: 'excelente' | 'buena' | 'regular' | 'mala';
  rms_db?: number;
  peak_db?: number;
  lufs_evaluados?: number;
  frecuencia_central_hz?: number;
  banda_frecuencial_principal?: string;
  frecuencias_destacadas?: any;
  distorsiones_detectadas: number;
  recorte_detectado: boolean;
  ruido_ambiental_promedio?: number;
  snr_estimado?: number;
  procesado: boolean;
  aplicacion_filtros: Record<string, any>;
  mejoras_aplicadas: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  nombre: string;
  slug: string;
  categoria: 'especie' | 'fuente_sonora' | 'ubicacion' | 'tecnica_grabacion' | 'condiciones' | 'evento' | 'tipo_ambiente';
  descripcion?: string;
  color_hex: string;
  icono?: string;
  nivel_confianza_default: number;
  activo: boolean;
  es_sistemico: boolean;
  taxonomias_relacionadas: Record<string, any>;
  metadata_schema: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalisisIA {
  id: string;
  grabacion_id: string;
  modelo_ia: string;
  version_modelo: string;
  configuracion_modelo: Record<string, any>;
  resultados_json: any;
  tiempo_procesamiento_segundos?: number;
  nivel_confianza_promedio?: number;
  algoritmo_usado?: string;
  estado_procesamiento: 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'cancelado';
  intentos_procesamiento: number;
  fecha_inicio_procesamiento?: string;
  fecha_fin_procesamiento?: string;
  error_mensaje?: string;
  recursos_computacionales: Record<string, any>;
  parametros_entrenamiento: Record<string, any>;
  metricas_rendimiento: Record<string, any>;
  validacion_cruzada?: number;
  matriz_confusion?: any;
  notas_ia?: string;
  limitaciones_detectadas?: string;
  recomendaciones_uso?: string;
  metadata_extras: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CondicionesMeteorologicas {
  id: string;
  punto_id?: string;
  grabacion_id?: string;
  timestamp_medicion: string;
  temperatura_celsius?: number;
  humedad_pct?: number;
  presion_hectopascales?: number;
  velocidad_viento_ms?: number;
  direccion_viento_grados?: number;
  precipitacion_mm?: number;
  radiacion_solar?: number;
  velocidad_viento_rachas_ms?: number;
  temperatura_sensacion_termica_celsius?: number;
  indice_uv?: number;
  visibilidad_metros?: number;
  nubosidad_pct?: number;
  condiciones_cielo?: 'despejado' | 'parcialmente_nublado' | 'nublado' | 'lluvioso' | 'nieve' | 'niebla';
  precipitacion_tipo?: 'ninguna' | 'llovizna' | 'lluvia' | 'granizo' | 'nieve';
  intensidad_lluvia?: 'sin_lluvia' | 'ligera' | 'moderada' | 'fuerte';
  intensidad_viento?: 'calma' | 'ligero' | 'moderado' | 'fuerte' | 'tempestuoso';
  fuente_datos: 'manual' | 'automatico' | 'sensor_remoto' | 'estacion_meteorologica' | 'api';
  latitud_medicion?: number;
  longitud_medicion?: number;
  altitud_medicion?: number;
  calidad_medicion: 'pendiente' | 'valida' | 'sospechosa' | 'invalida';
  notas_calidad?: string;
  variables_atmosfericas: Record<string, any>;
  procesamiento_calidad: Record<string, any>;
  created_at: string;
  updated_at: string;
}
