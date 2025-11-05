export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      actividad_proyecto: {
        Row: {
          created_at: string | null
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          descripcion: string | null
          entidad_id: string | null
          entidad_tipo: string | null
          id: string
          metadata: Json | null
          proyecto_id: string
          tipo_actividad: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          descripcion?: string | null
          entidad_id?: string | null
          entidad_tipo?: string | null
          id?: string
          metadata?: Json | null
          proyecto_id: string
          tipo_actividad: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          descripcion?: string | null
          entidad_id?: string | null
          entidad_tipo?: string | null
          id?: string
          metadata?: Json | null
          proyecto_id?: string
          tipo_actividad?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividad_proyecto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividad_proyecto_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "vista_resumen_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      analisis_ia: {
        Row: {
          algoritmo_usado: string | null
          configuracion_modelo: Json | null
          created_at: string | null
          error_mensaje: string | null
          estado_procesamiento: string | null
          fecha_fin_procesamiento: string | null
          fecha_inicio_procesamiento: string | null
          grabacion_id: string
          id: string
          intentos_procesamiento: number | null
          limitaciones_detectadas: string | null
          matriz_confusion: Json | null
          metadata_extras: Json | null
          metricas_rendimiento: Json | null
          modelo_ia: string
          nivel_confianza_promedio: number | null
          notas_ia: string | null
          parametros_entrenamiento: Json | null
          recomendaciones_uso: string | null
          recursos_computacionales: Json | null
          resultados_json: Json
          tiempo_procesamiento_segundos: number | null
          updated_at: string | null
          validacion_cruzada: number | null
          version_modelo: string
        }
        Insert: {
          algoritmo_usado?: string | null
          configuracion_modelo?: Json | null
          created_at?: string | null
          error_mensaje?: string | null
          estado_procesamiento?: string | null
          fecha_fin_procesamiento?: string | null
          fecha_inicio_procesamiento?: string | null
          grabacion_id: string
          id?: string
          intentos_procesamiento?: number | null
          limitaciones_detectadas?: string | null
          matriz_confusion?: Json | null
          metadata_extras?: Json | null
          metricas_rendimiento?: Json | null
          modelo_ia: string
          nivel_confianza_promedio?: number | null
          notas_ia?: string | null
          parametros_entrenamiento?: Json | null
          recomendaciones_uso?: string | null
          recursos_computacionales?: Json | null
          resultados_json: Json
          tiempo_procesamiento_segundos?: number | null
          updated_at?: string | null
          validacion_cruzada?: number | null
          version_modelo: string
        }
        Update: {
          algoritmo_usado?: string | null
          configuracion_modelo?: Json | null
          created_at?: string | null
          error_mensaje?: string | null
          estado_procesamiento?: string | null
          fecha_fin_procesamiento?: string | null
          fecha_inicio_procesamiento?: string | null
          grabacion_id?: string
          id?: string
          intentos_procesamiento?: number | null
          limitaciones_detectadas?: string | null
          matriz_confusion?: Json | null
          metadata_extras?: Json | null
          metricas_rendimiento?: Json | null
          modelo_ia?: string
          nivel_confianza_promedio?: number | null
          notas_ia?: string | null
          parametros_entrenamiento?: Json | null
          recomendaciones_uso?: string | null
          recursos_computacionales?: Json | null
          resultados_json?: Json
          tiempo_procesamiento_segundos?: number | null
          updated_at?: string | null
          validacion_cruzada?: number | null
          version_modelo?: string
        }
        Relationships: []
      }
      birdnet_detections: {
        Row: {
          analysis_date: string | null
          common_name: string | null
          confidence_score: number | null
          created_at: string | null
          detection_metadata: Json | null
          end_time_seconds: number | null
          frequency_range: string | null
          grabacion_id: string | null
          id: string
          scientific_name: string | null
          species_name: string
          start_time_seconds: number | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          analysis_date?: string | null
          common_name?: string | null
          confidence_score?: number | null
          created_at?: string | null
          detection_metadata?: Json | null
          end_time_seconds?: number | null
          frequency_range?: string | null
          grabacion_id?: string | null
          id?: string
          scientific_name?: string | null
          species_name: string
          start_time_seconds?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          analysis_date?: string | null
          common_name?: string | null
          confidence_score?: number | null
          created_at?: string | null
          detection_metadata?: Json | null
          end_time_seconds?: number | null
          frequency_range?: string | null
          grabacion_id?: string | null
          id?: string
          scientific_name?: string | null
          species_name?: string
          start_time_seconds?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "birdnet_detections_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "grabaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birdnet_detections_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "vista_calidad_grabaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          contenido: string
          created_at: string | null
          editado: boolean | null
          grabacion_id: string | null
          id: string
          imagen_id: string | null
          mencionados: string[] | null
          proyecto_id: string
          respuesta_a: string | null
          timestamp_audio: number | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          contenido: string
          created_at?: string | null
          editado?: boolean | null
          grabacion_id?: string | null
          id?: string
          imagen_id?: string | null
          mencionados?: string[] | null
          proyecto_id: string
          respuesta_a?: string | null
          timestamp_audio?: number | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          contenido?: string
          created_at?: string | null
          editado?: boolean | null
          grabacion_id?: string | null
          id?: string
          imagen_id?: string | null
          mencionados?: string[] | null
          proyecto_id?: string
          respuesta_a?: string | null
          timestamp_audio?: number | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "grabaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "vista_calidad_grabaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_imagen_id_fkey"
            columns: ["imagen_id"]
            isOneToOne: false
            referencedRelation: "imagenes_lugares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "vista_resumen_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_respuesta_a_fkey"
            columns: ["respuesta_a"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          recording_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          recording_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          recording_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      condiciones_meteorologicas: {
        Row: {
          altitud_medicion: number | null
          calidad_medicion: string | null
          condiciones_cielo: string | null
          created_at: string | null
          direccion_viento_grados: number | null
          fuente_datos: string | null
          grabacion_id: string | null
          humedad_pct: number | null
          id: string
          indice_uv: number | null
          intensidad_lluvia: string | null
          intensidad_viento: string | null
          latitud_medicion: number | null
          longitud_medicion: number | null
          notas_calidad: string | null
          nubosidad_pct: number | null
          precipitacion_mm: number | null
          precipitacion_tipo: string | null
          presion_hectopascales: number | null
          procesamiento_calidad: Json | null
          punto_id: string | null
          radiacion_solar: number | null
          temperatura_celsius: number | null
          temperatura_sensacion_termica_celsius: number | null
          timestamp_medicion: string
          updated_at: string | null
          variables_atmosfericas: Json | null
          velocidad_viento_ms: number | null
          velocidad_viento_rachas_ms: number | null
          visibilidad_metros: number | null
        }
        Insert: {
          altitud_medicion?: number | null
          calidad_medicion?: string | null
          condiciones_cielo?: string | null
          created_at?: string | null
          direccion_viento_grados?: number | null
          fuente_datos?: string | null
          grabacion_id?: string | null
          humedad_pct?: number | null
          id?: string
          indice_uv?: number | null
          intensidad_lluvia?: string | null
          intensidad_viento?: string | null
          latitud_medicion?: number | null
          longitud_medicion?: number | null
          notas_calidad?: string | null
          nubosidad_pct?: number | null
          precipitacion_mm?: number | null
          precipitacion_tipo?: string | null
          presion_hectopascales?: number | null
          procesamiento_calidad?: Json | null
          punto_id?: string | null
          radiacion_solar?: number | null
          temperatura_celsius?: number | null
          temperatura_sensacion_termica_celsius?: number | null
          timestamp_medicion: string
          updated_at?: string | null
          variables_atmosfericas?: Json | null
          velocidad_viento_ms?: number | null
          velocidad_viento_rachas_ms?: number | null
          visibilidad_metros?: number | null
        }
        Update: {
          altitud_medicion?: number | null
          calidad_medicion?: string | null
          condiciones_cielo?: string | null
          created_at?: string | null
          direccion_viento_grados?: number | null
          fuente_datos?: string | null
          grabacion_id?: string | null
          humedad_pct?: number | null
          id?: string
          indice_uv?: number | null
          intensidad_lluvia?: string | null
          intensidad_viento?: string | null
          latitud_medicion?: number | null
          longitud_medicion?: number | null
          notas_calidad?: string | null
          nubosidad_pct?: number | null
          precipitacion_mm?: number | null
          precipitacion_tipo?: string | null
          presion_hectopascales?: number | null
          procesamiento_calidad?: Json | null
          punto_id?: string | null
          radiacion_solar?: number | null
          temperatura_celsius?: number | null
          temperatura_sensacion_termica_celsius?: number | null
          timestamp_medicion?: string
          updated_at?: string | null
          variables_atmosfericas?: Json | null
          velocidad_viento_ms?: number | null
          velocidad_viento_rachas_ms?: number | null
          visibilidad_metros?: number | null
        }
        Relationships: []
      }
      configuraciones: {
        Row: {
          activa: boolean | null
          configuracion_analisis_ia: Json | null
          configuracion_gps: Json | null
          configuracion_meteorologia: Json | null
          created_at: string | null
          descripcion: string | null
          herencia_permitida: boolean | null
          id: string
          metadata: Json | null
          nombre: string
          parametros_audio: Json | null
          plantillas_aplicables: Json | null
          por_defecto: boolean | null
          proyecto_id: string | null
          ruta_id: string | null
          tipo_configuracion: string
          updated_at: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          activa?: boolean | null
          configuracion_analisis_ia?: Json | null
          configuracion_gps?: Json | null
          configuracion_meteorologia?: Json | null
          created_at?: string | null
          descripcion?: string | null
          herencia_permitida?: boolean | null
          id?: string
          metadata?: Json | null
          nombre: string
          parametros_audio?: Json | null
          plantillas_aplicables?: Json | null
          por_defecto?: boolean | null
          proyecto_id?: string | null
          ruta_id?: string | null
          tipo_configuracion: string
          updated_at?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          activa?: boolean | null
          configuracion_analisis_ia?: Json | null
          configuracion_gps?: Json | null
          configuracion_meteorologia?: Json | null
          created_at?: string | null
          descripcion?: string | null
          herencia_permitida?: boolean | null
          id?: string
          metadata?: Json | null
          nombre?: string
          parametros_audio?: Json | null
          plantillas_aplicables?: Json | null
          por_defecto?: boolean | null
          proyecto_id?: string | null
          ruta_id?: string | null
          tipo_configuracion?: string
          updated_at?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      equipos: {
        Row: {
          calibracion_actual: Json | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha_adquisicion: string | null
          fecha_ultimo_mantenimiento: string | null
          id: string
          marca: string | null
          metadata_tecnicos: Json | null
          modelo: string | null
          nombre: string
          numero_serie: string | null
          proyecto_id: string | null
          tipo_equipo: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          calibracion_actual?: Json | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_adquisicion?: string | null
          fecha_ultimo_mantenimiento?: string | null
          id?: string
          marca?: string | null
          metadata_tecnicos?: Json | null
          modelo?: string | null
          nombre: string
          numero_serie?: string | null
          proyecto_id?: string | null
          tipo_equipo: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          calibracion_actual?: Json | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_adquisicion?: string | null
          fecha_ultimo_mantenimiento?: string | null
          id?: string
          marca?: string | null
          metadata_tecnicos?: Json | null
          modelo?: string | null
          nombre?: string
          numero_serie?: string | null
          proyecto_id?: string | null
          tipo_equipo?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      equipos_calibraciones: {
        Row: {
          calibrado_por: string | null
          certificacion_vigente: boolean | null
          created_at: string | null
          diferencia_promedio: number | null
          documento_calibracion: string | null
          equipo_id: string
          fecha_calibracion: string
          id: string
          observaciones_calibracion: string | null
          parametros_antes: Json | null
          parametros_despues: Json | null
          procedimiento: string | null
          proxima_calibracion: string | null
          resultado: string
          resultados_calibracion: Json | null
          tipo_calibracion: string
          tolerancia_permitida: number | null
        }
        Insert: {
          calibrado_por?: string | null
          certificacion_vigente?: boolean | null
          created_at?: string | null
          diferencia_promedio?: number | null
          documento_calibracion?: string | null
          equipo_id: string
          fecha_calibracion: string
          id?: string
          observaciones_calibracion?: string | null
          parametros_antes?: Json | null
          parametros_despues?: Json | null
          procedimiento?: string | null
          proxima_calibracion?: string | null
          resultado: string
          resultados_calibracion?: Json | null
          tipo_calibracion: string
          tolerancia_permitida?: number | null
        }
        Update: {
          calibrado_por?: string | null
          certificacion_vigente?: boolean | null
          created_at?: string | null
          diferencia_promedio?: number | null
          documento_calibracion?: string | null
          equipo_id?: string
          fecha_calibracion?: string
          id?: string
          observaciones_calibracion?: string | null
          parametros_antes?: Json | null
          parametros_despues?: Json | null
          procedimiento?: string | null
          proxima_calibracion?: string | null
          resultado?: string
          resultados_calibracion?: Json | null
          tipo_calibracion?: string
          tolerancia_permitida?: number | null
        }
        Relationships: []
      }
      export_logs: {
        Row: {
          created_at: string | null
          download_url: string | null
          export_date: string | null
          export_filters: Json | null
          export_type: string
          file_size_bytes: number | null
          id: string
          num_records: number | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          download_url?: string | null
          export_date?: string | null
          export_filters?: Json | null
          export_type: string
          file_size_bytes?: number | null
          id?: string
          num_records?: number | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          download_url?: string | null
          export_date?: string | null
          export_filters?: Json | null
          export_type?: string
          file_size_bytes?: number | null
          id?: string
          num_records?: number | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      grabaciones: {
        Row: {
          configuracion_captura: Json | null
          contexto_grabacion: string | null
          created_at: string | null
          duracion_segundos: number | null
          equipo_id: string | null
          estado: string | null
          fin_grabacion: string | null
          hash_archivo: string | null
          id: string
          inicio_grabacion: string | null
          metadata_extras: Json | null
          nivel_ruido_promedio: number | null
          nombre_archivo: string
          notas_campo: string | null
          notas_operador: string | null
          punto_id: string | null
          ruta_archivo: string
          snr_estimado: number | null
          tamano_archivo: number | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          configuracion_captura?: Json | null
          contexto_grabacion?: string | null
          created_at?: string | null
          duracion_segundos?: number | null
          equipo_id?: string | null
          estado?: string | null
          fin_grabacion?: string | null
          hash_archivo?: string | null
          id?: string
          inicio_grabacion?: string | null
          metadata_extras?: Json | null
          nivel_ruido_promedio?: number | null
          nombre_archivo: string
          notas_campo?: string | null
          notas_operador?: string | null
          punto_id?: string | null
          ruta_archivo: string
          snr_estimado?: number | null
          tamano_archivo?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          configuracion_captura?: Json | null
          contexto_grabacion?: string | null
          created_at?: string | null
          duracion_segundos?: number | null
          equipo_id?: string | null
          estado?: string | null
          fin_grabacion?: string | null
          hash_archivo?: string | null
          id?: string
          inicio_grabacion?: string | null
          metadata_extras?: Json | null
          nivel_ruido_promedio?: number | null
          nombre_archivo?: string
          notas_campo?: string | null
          notas_operador?: string | null
          punto_id?: string | null
          ruta_archivo?: string
          snr_estimado?: number | null
          tamano_archivo?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      grabaciones_tags: {
        Row: {
          confianza: number | null
          confirmado_usuario: boolean | null
          contexto_deteccion: Json | null
          creado_automaticamente: boolean | null
          creado_por: string | null
          created_at: string | null
          duracion_evento: number | null
          frecuencia_final: number | null
          frecuencia_inicial: number | null
          grabacion_id: string
          id: string
          metadata_contexto: Json | null
          nivel_db: number | null
          notas_tag: string | null
          tag_id: string
          timestamp_evento: string | null
        }
        Insert: {
          confianza?: number | null
          confirmado_usuario?: boolean | null
          contexto_deteccion?: Json | null
          creado_automaticamente?: boolean | null
          creado_por?: string | null
          created_at?: string | null
          duracion_evento?: number | null
          frecuencia_final?: number | null
          frecuencia_inicial?: number | null
          grabacion_id: string
          id?: string
          metadata_contexto?: Json | null
          nivel_db?: number | null
          notas_tag?: string | null
          tag_id: string
          timestamp_evento?: string | null
        }
        Update: {
          confianza?: number | null
          confirmado_usuario?: boolean | null
          contexto_deteccion?: Json | null
          creado_automaticamente?: boolean | null
          creado_por?: string | null
          created_at?: string | null
          duracion_evento?: number | null
          frecuencia_final?: number | null
          frecuencia_inicial?: number | null
          grabacion_id?: string
          id?: string
          metadata_contexto?: Json | null
          nivel_db?: number | null
          notas_tag?: string | null
          tag_id?: string
          timestamp_evento?: string | null
        }
        Relationships: []
      }
      imagenes_lugares: {
        Row: {
          altitud: number | null
          alto_px: number | null
          ancho_px: number | null
          caracteristicas_sitio: string[] | null
          condiciones_atmosfericas: string | null
          created_at: string | null
          descripcion: string | null
          grabacion_id: string | null
          id: string
          latitud: number | null
          longitud: number | null
          metadata_exif: Json | null
          metadata_extras: Json | null
          nombre_archivo: string
          nombre_sitio: string | null
          notas_campo: string | null
          precision_gps: number | null
          proyecto_id: string
          punto_id: string | null
          ruta_storage: string
          tags: string[] | null
          tamano_archivo: number | null
          timestamp_captura: string | null
          tipo_mime: string | null
          updated_at: string | null
          url_publica: string | null
          usuario_id: string
        }
        Insert: {
          altitud?: number | null
          alto_px?: number | null
          ancho_px?: number | null
          caracteristicas_sitio?: string[] | null
          condiciones_atmosfericas?: string | null
          created_at?: string | null
          descripcion?: string | null
          grabacion_id?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          metadata_exif?: Json | null
          metadata_extras?: Json | null
          nombre_archivo: string
          nombre_sitio?: string | null
          notas_campo?: string | null
          precision_gps?: number | null
          proyecto_id: string
          punto_id?: string | null
          ruta_storage: string
          tags?: string[] | null
          tamano_archivo?: number | null
          timestamp_captura?: string | null
          tipo_mime?: string | null
          updated_at?: string | null
          url_publica?: string | null
          usuario_id: string
        }
        Update: {
          altitud?: number | null
          alto_px?: number | null
          ancho_px?: number | null
          caracteristicas_sitio?: string[] | null
          condiciones_atmosfericas?: string | null
          created_at?: string | null
          descripcion?: string | null
          grabacion_id?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          metadata_exif?: Json | null
          metadata_extras?: Json | null
          nombre_archivo?: string
          nombre_sitio?: string | null
          notas_campo?: string | null
          precision_gps?: number | null
          proyecto_id?: string
          punto_id?: string | null
          ruta_storage?: string
          tags?: string[] | null
          tamano_archivo?: number | null
          timestamp_captura?: string | null
          tipo_mime?: string | null
          updated_at?: string | null
          url_publica?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imagenes_lugares_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "grabaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagenes_lugares_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "vista_calidad_grabaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagenes_lugares_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagenes_lugares_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "vista_resumen_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imagenes_lugares_punto_id_fkey"
            columns: ["punto_id"]
            isOneToOne: false
            referencedRelation: "puntos_grabacion"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          recording_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recording_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recording_id?: string
          user_id?: string
        }
        Relationships: []
      }
      metadatos_audio: {
        Row: {
          aplicacion_filtros: Json | null
          audio_hash_md5: string | null
          audio_hash_sha256: string | null
          banda_frecuencial_principal: string | null
          bit_depth: string | null
          bit_rate: number | null
          calidad_audio: string | null
          canales: string
          codec: string
          compresion_ratio: number | null
          contenedor: string
          created_at: string | null
          distorsiones_detectadas: number | null
          espectrograma_hash: string | null
          frecuencia_central_hz: number | null
          frecuencias_destacadas: Json | null
          grabacion_id: string
          id: string
          lufs_evaluados: number | null
          mejoras_aplicadas: Json | null
          metadata_id3: Json | null
          metadata_vorbis: Json | null
          metadata_xmp: Json | null
          peak_db: number | null
          procesado: boolean | null
          recorte_detectado: boolean | null
          rms_db: number | null
          ruido_ambiental_promedio: number | null
          sample_rate: number
          snr_estimado: number | null
          updated_at: string | null
        }
        Insert: {
          aplicacion_filtros?: Json | null
          audio_hash_md5?: string | null
          audio_hash_sha256?: string | null
          banda_frecuencial_principal?: string | null
          bit_depth?: string | null
          bit_rate?: number | null
          calidad_audio?: string | null
          canales: string
          codec: string
          compresion_ratio?: number | null
          contenedor: string
          created_at?: string | null
          distorsiones_detectadas?: number | null
          espectrograma_hash?: string | null
          frecuencia_central_hz?: number | null
          frecuencias_destacadas?: Json | null
          grabacion_id: string
          id?: string
          lufs_evaluados?: number | null
          mejoras_aplicadas?: Json | null
          metadata_id3?: Json | null
          metadata_vorbis?: Json | null
          metadata_xmp?: Json | null
          peak_db?: number | null
          procesado?: boolean | null
          recorte_detectado?: boolean | null
          rms_db?: number | null
          ruido_ambiental_promedio?: number | null
          sample_rate: number
          snr_estimado?: number | null
          updated_at?: string | null
        }
        Update: {
          aplicacion_filtros?: Json | null
          audio_hash_md5?: string | null
          audio_hash_sha256?: string | null
          banda_frecuencial_principal?: string | null
          bit_depth?: string | null
          bit_rate?: number | null
          calidad_audio?: string | null
          canales?: string
          codec?: string
          compresion_ratio?: number | null
          contenedor?: string
          created_at?: string | null
          distorsiones_detectadas?: number | null
          espectrograma_hash?: string | null
          frecuencia_central_hz?: number | null
          frecuencias_destacadas?: Json | null
          grabacion_id?: string
          id?: string
          lufs_evaluados?: number | null
          mejoras_aplicadas?: Json | null
          metadata_id3?: Json | null
          metadata_vorbis?: Json | null
          metadata_xmp?: Json | null
          peak_db?: number | null
          procesado?: boolean | null
          recorte_detectado?: boolean | null
          rms_db?: number | null
          ruido_ambiental_promedio?: number | null
          sample_rate?: number
          snr_estimado?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string | null
          file_size: number | null
          id: string
          image_format: string | null
          image_url: string
          latitude: number | null
          longitude: number | null
          orientation: string | null
          recording_id: string | null
          taken_at: string | null
          user_id: string
          waypoint_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          image_format?: string | null
          image_url: string
          latitude?: number | null
          longitude?: number | null
          orientation?: string | null
          recording_id?: string | null
          taken_at?: string | null
          user_id: string
          waypoint_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          id?: string
          image_format?: string | null
          image_url?: string
          latitude?: number | null
          longitude?: number | null
          orientation?: string | null
          recording_id?: string | null
          taken_at?: string | null
          user_id?: string
          waypoint_id?: string | null
        }
        Relationships: []
      }
      procesamiento_senales: {
        Row: {
          algoritmo_usado: string
          aprobado: boolean | null
          archivo_diferencias_path: string | null
          archivo_procesado_path: string | null
          cambio_calidad_percibida: string | null
          creado_por: string | null
          created_at: string | null
          estado_procesamiento: string | null
          fecha_validacion: string | null
          grabacion_id: string
          hash_archivo_original: string | null
          hash_archivo_procesado: string | null
          id: string
          mejora_snr: number | null
          metadata_extras: Json | null
          notas_validacion: string | null
          parametros_optimizacion: Json | null
          parametros_procesamiento: Json
          porcentaje_mejora_calidad: number | null
          recursos_utilizados: Json | null
          reduccion_ruido_db: number | null
          resultados_procesamiento: Json | null
          tiempo_procesamiento_segundos: number | null
          tipo_procesamiento: string
          updated_at: string | null
          validado_por: string | null
          version_algoritmo: string | null
        }
        Insert: {
          algoritmo_usado: string
          aprobado?: boolean | null
          archivo_diferencias_path?: string | null
          archivo_procesado_path?: string | null
          cambio_calidad_percibida?: string | null
          creado_por?: string | null
          created_at?: string | null
          estado_procesamiento?: string | null
          fecha_validacion?: string | null
          grabacion_id: string
          hash_archivo_original?: string | null
          hash_archivo_procesado?: string | null
          id?: string
          mejora_snr?: number | null
          metadata_extras?: Json | null
          notas_validacion?: string | null
          parametros_optimizacion?: Json | null
          parametros_procesamiento: Json
          porcentaje_mejora_calidad?: number | null
          recursos_utilizados?: Json | null
          reduccion_ruido_db?: number | null
          resultados_procesamiento?: Json | null
          tiempo_procesamiento_segundos?: number | null
          tipo_procesamiento: string
          updated_at?: string | null
          validado_por?: string | null
          version_algoritmo?: string | null
        }
        Update: {
          algoritmo_usado?: string
          aprobado?: boolean | null
          archivo_diferencias_path?: string | null
          archivo_procesado_path?: string | null
          cambio_calidad_percibida?: string | null
          creado_por?: string | null
          created_at?: string | null
          estado_procesamiento?: string | null
          fecha_validacion?: string | null
          grabacion_id?: string
          hash_archivo_original?: string | null
          hash_archivo_procesado?: string | null
          id?: string
          mejora_snr?: number | null
          metadata_extras?: Json | null
          notas_validacion?: string | null
          parametros_optimizacion?: Json | null
          parametros_procesamiento?: Json
          porcentaje_mejora_calidad?: number | null
          recursos_utilizados?: Json | null
          reduccion_ruido_db?: number | null
          resultados_procesamiento?: Json | null
          tiempo_procesamiento_segundos?: number | null
          tipo_procesamiento?: string
          updated_at?: string | null
          validado_por?: string | null
          version_algoritmo?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      proyecto_colaboradores: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_aceptacion: string | null
          fecha_invitacion: string | null
          id: string
          invitado_por: string | null
          metadata: Json | null
          notificaciones_activas: boolean | null
          permisos: Json | null
          proyecto_id: string
          rol: string
          ultimo_acceso: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_aceptacion?: string | null
          fecha_invitacion?: string | null
          id?: string
          invitado_por?: string | null
          metadata?: Json | null
          notificaciones_activas?: boolean | null
          permisos?: Json | null
          proyecto_id: string
          rol?: string
          ultimo_acceso?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_aceptacion?: string | null
          fecha_invitacion?: string | null
          id?: string
          invitado_por?: string | null
          metadata?: Json | null
          notificaciones_activas?: boolean | null
          permisos?: Json | null
          proyecto_id?: string
          rol?: string
          ultimo_acceso?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_colaboradores_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_colaboradores_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "vista_resumen_proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          metadata: Json | null
          nombre: string
          objetivos: string | null
          ubicacion: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          objetivos?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          objetivos?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      puntos_grabacion: {
        Row: {
          altitud: number | null
          condiciones_ambientales: Json | null
          created_at: string | null
          descripcion: string | null
          direccion_grados: number | null
          horizonte_visible: number | null
          id: string
          latitud: number
          longitud: number
          metadata_extras: Json | null
          nombre: string | null
          obstaculos_cercanos: string | null
          precision_gps: number | null
          ruta_id: string
          timestamp_gps: string | null
          updated_at: string | null
          velocidad_kmh: number | null
        }
        Insert: {
          altitud?: number | null
          condiciones_ambientales?: Json | null
          created_at?: string | null
          descripcion?: string | null
          direccion_grados?: number | null
          horizonte_visible?: number | null
          id?: string
          latitud: number
          longitud: number
          metadata_extras?: Json | null
          nombre?: string | null
          obstaculos_cercanos?: string | null
          precision_gps?: number | null
          ruta_id: string
          timestamp_gps?: string | null
          updated_at?: string | null
          velocidad_kmh?: number | null
        }
        Update: {
          altitud?: number | null
          condiciones_ambientales?: Json | null
          created_at?: string | null
          descripcion?: string | null
          direccion_grados?: number | null
          horizonte_visible?: number | null
          id?: string
          latitud?: number
          longitud?: number
          metadata_extras?: Json | null
          nombre?: string | null
          obstaculos_cercanos?: string | null
          precision_gps?: number | null
          ruta_id?: string
          timestamp_gps?: string | null
          updated_at?: string | null
          velocidad_kmh?: number | null
        }
        Relationships: []
      }
      puntos_ruta: {
        Row: {
          actividades_planificadas: string[] | null
          altitud: number | null
          completado: boolean | null
          created_at: string | null
          descripcion: string | null
          distancia_desde_anterior: number | null
          duracion_estimada_minutos: number | null
          fecha_completado: string | null
          id: string
          latitud: number
          longitud: number
          metadata: Json | null
          nombre: string | null
          notas: string | null
          orden: number
          ruta_id: string
          tiempo_estimado_desde_anterior: number | null
          tipo_punto: string | null
          updated_at: string | null
        }
        Insert: {
          actividades_planificadas?: string[] | null
          altitud?: number | null
          completado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          distancia_desde_anterior?: number | null
          duracion_estimada_minutos?: number | null
          fecha_completado?: string | null
          id?: string
          latitud: number
          longitud: number
          metadata?: Json | null
          nombre?: string | null
          notas?: string | null
          orden: number
          ruta_id: string
          tiempo_estimado_desde_anterior?: number | null
          tipo_punto?: string | null
          updated_at?: string | null
        }
        Update: {
          actividades_planificadas?: string[] | null
          altitud?: number | null
          completado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          distancia_desde_anterior?: number | null
          duracion_estimada_minutos?: number | null
          fecha_completado?: string | null
          id?: string
          latitud?: number
          longitud?: number
          metadata?: Json | null
          nombre?: string | null
          notas?: string | null
          orden?: number
          ruta_id?: string
          tiempo_estimado_desde_anterior?: number | null
          tipo_punto?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puntos_ruta_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      recording_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          recording_id: string
          timestamp_in_recording: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          recording_id: string
          timestamp_in_recording?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          recording_id?: string
          timestamp_in_recording?: number | null
          user_id?: string
        }
        Relationships: []
      }
      recording_tags: {
        Row: {
          recording_id: string
          tag_id: string
        }
        Insert: {
          recording_id: string
          tag_id: string
        }
        Update: {
          recording_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          audio_format: string | null
          audio_url: string
          created_at: string | null
          description: string | null
          duration: number
          environment_type: string | null
          file_size: number | null
          id: string
          is_public: boolean | null
          latitude: number
          longitude: number
          quality_rating: number | null
          recording_date: string
          route_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          waypoint_id: string | null
          weather_conditions: string | null
        }
        Insert: {
          audio_format?: string | null
          audio_url: string
          created_at?: string | null
          description?: string | null
          duration: number
          environment_type?: string | null
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          latitude: number
          longitude: number
          quality_rating?: number | null
          recording_date: string
          route_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          waypoint_id?: string | null
          weather_conditions?: string | null
        }
        Update: {
          audio_format?: string | null
          audio_url?: string
          created_at?: string | null
          description?: string | null
          duration?: number
          environment_type?: string | null
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          latitude?: number
          longitude?: number
          quality_rating?: number | null
          recording_date?: string
          route_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          waypoint_id?: string | null
          weather_conditions?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rutas: {
        Row: {
          configuracion: Json | null
          created_at: string | null
          descripcion: string | null
          geometria: Json | null
          id: string
          metadata: Json | null
          nombre: string
          proyecto_id: string
          tipo_ruta: string | null
          updated_at: string | null
        }
        Insert: {
          configuracion?: Json | null
          created_at?: string | null
          descripcion?: string | null
          geometria?: Json | null
          id?: string
          metadata?: Json | null
          nombre: string
          proyecto_id: string
          tipo_ruta?: string | null
          updated_at?: string | null
        }
        Update: {
          configuracion?: Json | null
          created_at?: string | null
          descripcion?: string | null
          geometria?: Json | null
          id?: string
          metadata?: Json | null
          nombre?: string
          proyecto_id?: string
          tipo_ruta?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          activo: boolean | null
          categoria: string
          color_hex: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          es_sistemico: boolean | null
          icono: string | null
          id: string
          metadata_schema: Json | null
          nivel_confianza_default: number | null
          nombre: string
          slug: string
          taxonomias_relacionadas: Json | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          color_hex?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_sistemico?: boolean | null
          icono?: string | null
          id?: string
          metadata_schema?: Json | null
          nivel_confianza_default?: number | null
          nombre: string
          slug: string
          taxonomias_relacionadas?: Json | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          color_hex?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_sistemico?: boolean | null
          icono?: string | null
          id?: string
          metadata_schema?: Json | null
          nivel_confianza_default?: number | null
          nombre?: string
          slug?: string
          taxonomias_relacionadas?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          apellido: string
          created_at: string | null
          email: string
          id: string
          nombre: string
          preferences: Json | null
          rol: string
          updated_at: string | null
        }
        Insert: {
          apellido: string
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          preferences?: Json | null
          rol?: string
          updated_at?: string | null
        }
        Update: {
          apellido?: string
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          preferences?: Json | null
          rol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      waypoints: {
        Row: {
          created_at: string | null
          description: string | null
          elevation: number | null
          id: string
          latitude: number
          longitude: number
          name: string | null
          order_index: number
          route_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          elevation?: number | null
          id?: string
          latitude: number
          longitude: number
          name?: string | null
          order_index: number
          route_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          elevation?: number | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string | null
          order_index?: number
          route_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vista_calidad_grabaciones: {
        Row: {
          calidad_audio: string | null
          codec: string | null
          duracion_segundos: number | null
          estado: string | null
          humedad_grabacion: number | null
          id: string | null
          inicio_grabacion: string | null
          modelo_ia: string | null
          nivel_confianza_promedio: number | null
          nombre_archivo: string | null
          peak_db: number | null
          proyecto_nombre: string | null
          punto_grabacion: string | null
          rms_db: number | null
          ruta_nombre: string | null
          sample_rate: number | null
          snr_estimado: number | null
          tags_encontrados: number | null
          temp_grabacion: number | null
          viento_grabacion: number | null
        }
        Relationships: []
      }
      vista_estadisticas_equipos: {
        Row: {
          duracion_total_grabada: number | null
          estado: string | null
          id: string | null
          marca: string | null
          modelo: string | null
          nombre: string | null
          proxima_calibracion: string | null
          tipo_equipo: string | null
          total_calibraciones: number | null
          total_grabaciones: number | null
          ultima_calibracion: string | null
        }
        Relationships: []
      }
      vista_resumen_proyectos: {
        Row: {
          duracion_total_segundos: number | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string | null
          nombre: string | null
          tags_utilizados: number | null
          temperatura_promedio: number | null
          total_analisis_ia: number | null
          total_grabaciones: number | null
          total_puntos: number | null
          total_rutas: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
