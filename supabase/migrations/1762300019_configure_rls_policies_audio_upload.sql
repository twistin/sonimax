-- Migration: configure_rls_policies_audio_upload
-- Created at: 1762300019

-- Configurar RLS policies para carga de audio

-- 1. Habilitar RLS en tabla grabaciones (si no está ya habilitado)
ALTER TABLE grabaciones ENABLE ROW LEVEL SECURITY;

-- 2. Policy para lectura pública de grabaciones
CREATE POLICY IF NOT EXISTS "Allow public read access" ON grabaciones
  FOR SELECT USING (true);

-- 3. Policy para insertar grabaciones via Edge Function
CREATE POLICY IF NOT EXISTS "Allow insert via edge function" ON grabaciones
  FOR INSERT
  WITH CHECK (
    auth.role() = 'anon' OR auth.role() = 'service_role'
  );

-- 4. Policy para actualizar grabaciones (solo service_role)
CREATE POLICY IF NOT EXISTS "Service role modify access" ON grabaciones
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- 5. Policy para eliminar grabaciones (solo service_role)
CREATE POLICY IF NOT EXISTS "Service role delete access" ON grabaciones
  FOR DELETE
  USING (auth.role() = 'service_role');

-- 6. Storage policies para bucket audio-recordings
CREATE POLICY IF NOT EXISTS "Public read access for audio-recordings" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-recordings');

CREATE POLICY IF NOT EXISTS "Allow upload via edge function for audio" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-recordings'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

CREATE POLICY IF NOT EXISTS "Service role delete only for audio" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'audio-recordings' AND auth.role() = 'service_role');
;