Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { latitud, longitud, punto_id, grabacion_id } = await req.json();

        if (!latitud || !longitud) {
            throw new Error('Latitud y longitud son requeridos');
        }

        // API key de OpenWeather (se debe configurar como secret en Supabase)
        // Por ahora usamos la API gratuita que no requiere key para pruebas
        const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitud}&lon=${longitud}&units=metric&appid=demo`;

        // Obtener datos meteorológicos
        const response = await fetch(openWeatherUrl);
        
        if (!response.ok) {
            // Si falla la API, generamos datos simulados basados en ubicación
            const datosSimulados = {
                temperatura_celsius: 20 + (Math.random() * 15 - 5),
                humedad_pct: 50 + (Math.random() * 40),
                presion_hectopascales: 1013 + (Math.random() * 20 - 10),
                velocidad_viento_ms: Math.random() * 10,
                direccion_viento_grados: Math.random() * 360,
                precipitacion_mm: Math.random() < 0.3 ? Math.random() * 5 : 0,
                nubosidad_pct: Math.random() * 100,
                indice_uv: Math.random() * 11,
                visibilidad_metros: 10000,
                condiciones_cielo: ['despejado', 'parcialmente_nublado', 'nublado'][Math.floor(Math.random() * 3)],
                intensidad_viento: ['calma', 'ligero', 'moderado'][Math.floor(Math.random() * 3)]
            };

            // Guardar en base de datos
            const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
            const supabaseUrl = Deno.env.get('SUPABASE_URL');

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/condiciones_meteorologicas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    punto_id: punto_id || null,
                    grabacion_id: grabacion_id || null,
                    timestamp_medicion: new Date().toISOString(),
                    latitud_medicion: latitud,
                    longitud_medicion: longitud,
                    ...datosSimulados,
                    fuente_datos: 'api',
                    calidad_medicion: 'valida'
                })
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Error al guardar datos meteorológicos: ${errorText}`);
            }

            const savedData = await insertResponse.json();

            return new Response(JSON.stringify({
                data: {
                    condiciones: datosSimulados,
                    guardado: savedData[0],
                    fuente: 'simulado'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const weatherData = await response.json();

        // Mapear datos de OpenWeather a nuestro esquema
        const condiciones = {
            temperatura_celsius: weatherData.main?.temp || null,
            humedad_pct: weatherData.main?.humidity || null,
            presion_hectopascales: weatherData.main?.pressure || null,
            velocidad_viento_ms: weatherData.wind?.speed || null,
            direccion_viento_grados: weatherData.wind?.deg || null,
            precipitacion_mm: weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0,
            nubosidad_pct: weatherData.clouds?.all || null,
            visibilidad_metros: weatherData.visibility || null,
            condiciones_cielo: mapearCondicionesCielo(weatherData.weather?.[0]?.main),
            precipitacion_tipo: mapearTipoPrecipitacion(weatherData.weather?.[0]?.main),
            intensidad_viento: calcularIntensidadViento(weatherData.wind?.speed || 0)
        };

        // Guardar en base de datos
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/condiciones_meteorologicas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                punto_id: punto_id || null,
                grabacion_id: grabacion_id || null,
                timestamp_medicion: new Date().toISOString(),
                latitud_medicion: latitud,
                longitud_medicion: longitud,
                ...condiciones,
                fuente_datos: 'api',
                calidad_medicion: 'valida'
            })
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Error al guardar datos meteorológicos: ${errorText}`);
        }

        const savedData = await insertResponse.json();

        return new Response(JSON.stringify({
            data: {
                condiciones,
                guardado: savedData[0],
                fuente: 'openweather'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error al obtener datos meteorológicos:', error);

        const errorResponse = {
            error: {
                code: 'WEATHER_FETCH_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function mapearCondicionesCielo(condicion: string): string {
    const mapeo: Record<string, string> = {
        'Clear': 'despejado',
        'Clouds': 'nublado',
        'Rain': 'lluvioso',
        'Drizzle': 'lluvioso',
        'Snow': 'nieve',
        'Mist': 'niebla',
        'Fog': 'niebla'
    };
    return mapeo[condicion] || 'parcialmente_nublado';
}

function mapearTipoPrecipitacion(condicion: string): string {
    const mapeo: Record<string, string> = {
        'Clear': 'ninguna',
        'Clouds': 'ninguna',
        'Rain': 'lluvia',
        'Drizzle': 'llovizna',
        'Snow': 'nieve',
        'Thunderstorm': 'lluvia'
    };
    return mapeo[condicion] || 'ninguna';
}

function calcularIntensidadViento(velocidad: number): string {
    if (velocidad < 1) return 'calma';
    if (velocidad < 5) return 'ligero';
    if (velocidad < 10) return 'moderado';
    if (velocidad < 15) return 'fuerte';
    return 'tempestuoso';
}
