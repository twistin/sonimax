-- Migration: configure_rls_policies_audio_upload_v2
-- Created at: 1762300035

-- Configurar RLS policies para carga de audio

-- 1. Habilitar RLS en tabla grabaciones
ALTER TABLE grabaciones ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar policies existentes si existen
DROP POLICY IF EXISTS "Allow public read access" ON grabaciones;
DROP POLICY IF EXISTS "Allow insert via edge function" ON grabaciones;
DROP POLICY IF EXISTS "Service role modify access" ON grabaciones;
DROP POLICY IF EXISTS "Service role delete access" ON grabaciones;

-- 3. Crear nuevas policies para grabaciones
CREATE POLICY "Allow public read access" ON grabaciones
  FOR SELECT USING (true);

CREATE POLICY "Allow insert via edge function" ON grabaciones
  FOR INSERT
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'service_role');

CREATE POLICY "Service role modify access" ON grabaciones
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role delete access" ON grabaciones
  FOR DELETE
  USING (auth.role() = 'service_role');

-- 4. Storage policies para bucket audio-recordings
DROP POLICY IF EXISTS "Public read access for audio-recordings" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload via edge function for audio" ON storage.objects;
DROP POLICY IF EXISTS "Service role delete only for audio" ON storage.objects;

CREATE POLICY "Public read access for audio-recordings" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-recordings');

CREATE POLICY "Allow upload via edge function for audio" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-recordings'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

CREATE POLICY "Service role delete only for audio" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'audio-recordings' AND auth.role() = 'service_role');
;