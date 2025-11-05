// Edge Function para exportación de datos en múltiples formatos
// Soporta CSV, GeoJSON, KML

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ExportRequest {
  format: 'csv' | 'geojson' | 'kml';
  filters?: {
    proyectoIds?: string[];
    fechaDesde?: string;
    fechaHasta?: string;
    caracteristicas?: string[];
    ubicacion?: {
      lat: number;
      lng: number;
      radius: number; // en metros
    };
  };
}

interface GrabacionData {
  id: string;
  nombre_archivo: string;
  proyecto_nombre: string;
  fecha_creacion: string;
  duracion_segundos: number;
  formato_audio: string;
  calidad_audio: string;
  latitud: number;
  longitud: number;
  altitud: number;
  precision_gps: number;
  condiciones_atmosfericas: string;
  temperatura: number;
  humedad: number;
  url_publica: string;
  especies_detectadas: any[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuración de Supabase no disponible');
    }

    const requestData: ExportRequest = await req.json();
    const { format, filters } = requestData;

    if (!format || !['csv', 'geojson', 'kml'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Formato no válido. Use: csv, geojson, kml' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el token de autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó token de autenticación' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey
      }
    });

    if (!userResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userData = await userResponse.json();
    const usuarioId = userData.id;

    // Construir query con filtros
    let query = `
      SELECT 
        g.id,
        g.nombre_archivo,
        g.duracion_segundos,
        g.formato_audio,
        g.calidad_audio,
        g.created_at as fecha_creacion,
        g.url_publica,
        p.nombre as proyecto_nombre,
        pg.latitud,
        pg.longitud,
        pg.altitud,
        pg.precision_gps,
        cm.temperatura,
        cm.humedad,
        cm.condiciones_atmosfericas
      FROM grabaciones g
      LEFT JOIN proyectos p ON g.proyecto_id = p.id
      LEFT JOIN puntos_grabacion pg ON g.punto_grabacion_id = pg.id
      LEFT JOIN condiciones_meteorologicas cm ON g.condiciones_id = cm.id
      WHERE g.usuario_id = '${usuarioId}'
    `;

    // Aplicar filtros
    if (filters?.proyectoIds && filters.proyectoIds.length > 0) {
      const ids = filters.proyectoIds.map(id => `'${id}'`).join(',');
      query += ` AND g.proyecto_id IN (${ids})`;
    }

    if (filters?.fechaDesde) {
      query += ` AND g.created_at >= '${filters.fechaDesde}'`;
    }

    if (filters?.fechaHasta) {
      query += ` AND g.created_at <= '${filters.fechaHasta}'`;
    }

    query += ' ORDER BY g.created_at DESC';

    // Ejecutar query
    const grabacionesResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/execute_query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      }
    );

    // Si la función RPC no existe, usar query directa
    let grabaciones;
    if (!grabacionesResponse.ok) {
      // Fallback: consulta directa sin RPC
      const simpleQuery = `${supabaseUrl}/rest/v1/grabaciones?select=*,proyectos(nombre),puntos_grabacion(latitud,longitud,altitud,precision_gps),condiciones_meteorologicas(temperatura,humedad,condiciones_atmosfericas)&usuario_id=eq.${usuarioId}`;
      const simpleResponse = await fetch(simpleQuery, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      if (!simpleResponse.ok) {
        throw new Error('Error obteniendo datos de grabaciones');
      }
      
      grabaciones = await simpleResponse.json();
    } else {
      grabaciones = await grabacionesResponse.json();
    }

    // Obtener detecciones de BirdNET para cada grabación
    const grabacionesConDetecciones = await Promise.all(
      grabaciones.map(async (g: any) => {
        const detectionsResponse = await fetch(
          `${supabaseUrl}/rest/v1/birdnet_detections?grabacion_id=eq.${g.id}&select=*`,
          {
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey
            }
          }
        );

        let detections = [];
        if (detectionsResponse.ok) {
          detections = await detectionsResponse.json();
        }

        return {
          ...g,
          especies_detectadas: detections
        };
      })
    );

    // Generar archivo según formato
    let fileContent: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      fileContent = generateCSV(grabacionesConDetecciones);
      contentType = 'text/csv';
      filename = `sonimax_export_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (format === 'geojson') {
      fileContent = generateGeoJSON(grabacionesConDetecciones);
      contentType = 'application/geo+json';
      filename = `sonimax_export_${new Date().toISOString().split('T')[0]}.geojson`;
    } else if (format === 'kml') {
      fileContent = generateKML(grabacionesConDetecciones);
      contentType = 'application/vnd.google-earth.kml+xml';
      filename = `sonimax_export_${new Date().toISOString().split('T')[0]}.kml`;
    } else {
      throw new Error('Formato no soportado');
    }

    // Registrar exportación
    await fetch(`${supabaseUrl}/rest/v1/export_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        usuario_id: usuarioId,
        export_type: format,
        export_filters: filters || {},
        num_records: grabaciones.length,
        file_size_bytes: new Blob([fileContent]).size
      })
    });

    return new Response(fileContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('Error en exportación:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'Error desconocido en exportación',
          details: error.toString()
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateCSV(grabaciones: any[]): string {
  const headers = [
    'id', 'nombre_archivo', 'proyecto', 'fecha_creacion', 'duracion_segundos',
    'formato_audio', 'latitud', 'longitud', 'altitud', 'precision_gps',
    'temperatura', 'humedad', 'condiciones_atmosfericas', 'especies_detectadas',
    'url_audio'
  ];

  const rows = grabaciones.map(g => [
    g.id || '',
    g.nombre_archivo || '',
    g.proyecto_nombre || g.proyectos?.nombre || '',
    g.fecha_creacion || g.created_at || '',
    g.duracion_segundos || '',
    g.formato_audio || '',
    g.latitud || g.puntos_grabacion?.latitud || '',
    g.longitud || g.puntos_grabacion?.longitud || '',
    g.altitud || g.puntos_grabacion?.altitud || '',
    g.precision_gps || g.puntos_grabacion?.precision_gps || '',
    g.temperatura || g.condiciones_meteorologicas?.temperatura || '',
    g.humedad || g.condiciones_meteorologicas?.humedad || '',
    g.condiciones_atmosfericas || g.condiciones_meteorologicas?.condiciones_atmosfericas || '',
    g.especies_detectadas?.map((e: any) => `${e.common_name}(${(e.confidence_score * 100).toFixed(0)}%)`).join('|') || '',
    g.url_publica || ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

function generateGeoJSON(grabaciones: any[]): string {
  const features = grabaciones
    .filter(g => (g.latitud || g.puntos_grabacion?.latitud) && (g.longitud || g.puntos_grabacion?.longitud))
    .map(g => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          parseFloat(g.longitud || g.puntos_grabacion?.longitud),
          parseFloat(g.latitud || g.puntos_grabacion?.latitud),
          parseFloat(g.altitud || g.puntos_grabacion?.altitud || 0)
        ]
      },
      properties: {
        id: g.id,
        nombre_archivo: g.nombre_archivo,
        proyecto: g.proyecto_nombre || g.proyectos?.nombre,
        fecha_creacion: g.fecha_creacion || g.created_at,
        duracion_segundos: g.duracion_segundos,
        formato_audio: g.formato_audio,
        precision_gps: g.precision_gps || g.puntos_grabacion?.precision_gps,
        temperatura: g.temperatura || g.condiciones_meteorologicas?.temperatura,
        humedad: g.humedad || g.condiciones_meteorologicas?.humedad,
        condiciones_atmosfericas: g.condiciones_atmosfericas || g.condiciones_meteorologicas?.condiciones_atmosfericas,
        especies_detectadas: g.especies_detectadas?.map((e: any) => ({
          nombre_comun: e.common_name,
          nombre_cientifico: e.scientific_name,
          confianza: e.confidence_score
        })),
        url_audio: g.url_publica
      }
    }));

  return JSON.stringify({
    type: 'FeatureCollection',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
      }
    },
    features
  }, null, 2);
}

function generateKML(grabaciones: any[]): string {
  const placemarks = grabaciones
    .filter(g => (g.latitud || g.puntos_grabacion?.latitud) && (g.longitud || g.puntos_grabacion?.longitud))
    .map(g => {
      const lat = g.latitud || g.puntos_grabacion?.latitud;
      const lng = g.longitud || g.puntos_grabacion?.longitud;
      const alt = g.altitud || g.puntos_grabacion?.altitud || 0;
      const especies = g.especies_detectadas?.map((e: any) => 
        `<li>${e.common_name} (${(e.confidence_score * 100).toFixed(0)}%)</li>`
      ).join('') || '<li>Sin especies detectadas</li>';

      return `
    <Placemark>
      <name>${g.nombre_archivo || 'Sin nombre'}</name>
      <description><![CDATA[
        <h3>${g.proyecto_nombre || g.proyectos?.nombre || 'Sin proyecto'}</h3>
        <p><strong>Fecha:</strong> ${g.fecha_creacion || g.created_at || 'N/A'}</p>
        <p><strong>Duración:</strong> ${g.duracion_segundos || 0}s</p>
        <p><strong>Condiciones:</strong> ${g.condiciones_atmosfericas || g.condiciones_meteorologicas?.condiciones_atmosfericas || 'N/A'}</p>
        <p><strong>Temperatura:</strong> ${g.temperatura || g.condiciones_meteorologicas?.temperatura || 'N/A'}°C</p>
        <p><strong>Especies detectadas:</strong></p>
        <ul>${especies}</ul>
        ${g.url_publica ? `<p><a href="${g.url_publica}">Escuchar audio</a></p>` : ''}
      ]]></description>
      <Point>
        <coordinates>${lng},${lat},${alt}</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>SonimaX Export - ${new Date().toISOString().split('T')[0]}</name>
    <description>Exportación de grabaciones de soundscape desde SonimaX</description>
    <Style id="soundscapeIcon">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/microphone.png</href>
        </Icon>
      </IconStyle>
    </Style>
${placemarks}
  </Document>
</kml>`;
}
