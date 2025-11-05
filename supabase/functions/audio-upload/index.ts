// Edge Function: audio-upload (CORREGIDO)
// Maneja la carga segura de archivos de audio a Supabase Storage

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { audioData, fileName, proyectoId, rutaId, puntoGrabacionId, metadata } = await req.json();

    console.log('Recibiendo subida de audio:', { fileName, proyectoId, rutaId, puntoGrabacionId });

    if (!audioData || !fileName) {
      console.error('Parámetros faltantes:', { audioData: !!audioData, fileName });
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'MISSING_PARAMS', 
            message: 'audioData y fileName son requeridos',
            details: { audioData: !!audioData, fileName }
          } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener credenciales de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Variables de entorno no configuradas');
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'CONFIG_ERROR', 
            message: 'Configuración de Supabase no disponible' 
          } 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Supabase URL configurada:', !!supabaseUrl);
    console.log('Service Role Key configurada:', !!supabaseServiceRoleKey);

    // Decodificar base64 a bytes con mejor manejo de errores
    let binaryData: Uint8Array;
    try {
      const base64Data = audioData.split(',')[1] || audioData;
      console.log('Base64 data length:', base64Data.length);
      
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('Binary data size:', binaryData.length, 'bytes');
    } catch (decodeError) {
      console.error('Error decodificando base64:', decodeError);
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'DECODE_ERROR', 
            message: 'Error al decodificar el archivo de audio',
            details: decodeError.message 
          } 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generar ruta única en storage
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'wav';
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${timestamp}-${safeFileName}`;
    
    console.log('Storage path:', storagePath);

    // Subir archivo a storage usando fetch directo
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/audio-recordings/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': metadata?.mimeType || `audio/${fileExtension}`,
          'apikey': supabaseServiceRoleKey,
        },
        body: binaryData,
      }
    );

    console.log('Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Error en upload:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'UPLOAD_ERROR', 
            message: `Error al subir archivo: ${uploadResponse.status} ${uploadResponse.statusText}`,
            details: errorText 
          } 
        }),
        { status: uploadResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener URL pública del archivo
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/audio-recordings/${storagePath}`;
    console.log('Public URL:', publicUrl);

    // Crear registro en tabla grabaciones
    const grabacionData = {
      punto_id: puntoGrabacionId || null,
      equipo_id: null,
      usuario_id: null,
      nombre_archivo: fileName,
      ruta_archivo: storagePath,
      tamano_archivo: binaryData.length,
      estado: 'grabada',
      metadata_extras: {
        storage_url: publicUrl,
        formato: metadata?.format || fileExtension.toUpperCase(),
        mime_type: metadata?.mimeType,
        proyecto_id: proyectoId,
        ruta_id: rutaId,
        uploaded_at: new Date().toISOString(),
        ...metadata
      },
    };

    console.log('Insertando en base de datos:', grabacionData);

    const insertResponse = await fetch(
      `${supabaseUrl}/rest/v1/grabaciones`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(grabacionData),
      }
    );

    console.log('Database insert status:', insertResponse.status);

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Error en database insert:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: { 
            code: 'DATABASE_ERROR', 
            message: `Error al crear registro: ${insertResponse.status} ${insertResponse.statusText}`,
            details: errorText 
          } 
        }),
        { status: insertResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const grabacionCreada = await insertResponse.json();
    console.log('Grabación creada:', grabacionCreada?.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          grabacion: Array.isArray(grabacionCreada) ? grabacionCreada[0] : grabacionCreada,
          publicUrl: publicUrl,
          storagePath: storagePath,
          fileSize: binaryData.length,
          message: 'Archivo subido exitosamente'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error general en audio-upload:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'UPLOAD_ERROR',
          message: error.message || 'Error al procesar el archivo de audio',
          details: error.toString(),
          stack: error.stack
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
