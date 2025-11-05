-- Migration: fix_rutas_rls_policies
-- Created at: 1762330954

-- Habilitar RLS en rutas
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;

-- Crear políticas para rutas que permitan a los propietarios de proyectos trabajar con ellas
CREATE POLICY "Los propietarios de proyectos pueden ver sus rutas"
  ON rutas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = rutas.proyecto_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Los propietarios de proyectos pueden crear rutas"
  ON rutas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = rutas.proyecto_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Los propietarios de proyectos pueden actualizar sus rutas"
  ON rutas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = rutas.proyecto_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Los propietarios de proyectos pueden eliminar sus rutas"
  ON rutas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = rutas.proyecto_id
      AND p.user_id = auth.uid()
    )
  );

-- Actualizar políticas de puntos_ruta para incluir propietarios de proyectos
DROP POLICY IF EXISTS "Los editores pueden gestionar puntos de ruta" ON puntos_ruta;
DROP POLICY IF EXISTS "Los usuarios pueden ver puntos de ruta de proyectos compartidos" ON puntos_ruta;

CREATE POLICY "Los propietarios pueden ver puntos de ruta"
  ON puntos_ruta FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rutas r
      JOIN proyectos p ON p.id = r.proyecto_id
      WHERE r.id = puntos_ruta.ruta_id
      AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM rutas r
      JOIN proyecto_colaboradores pc ON pc.proyecto_id = r.proyecto_id
      WHERE r.id = puntos_ruta.ruta_id
      AND pc.usuario_id = auth.uid()
      AND pc.estado = 'activo'
    )
  );

CREATE POLICY "Los propietarios pueden gestionar puntos de ruta"
  ON puntos_ruta FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rutas r
      JOIN proyectos p ON p.id = r.proyecto_id
      WHERE r.id = puntos_ruta.ruta_id
      AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM rutas r
      JOIN proyecto_colaboradores pc ON pc.proyecto_id = r.proyecto_id
      WHERE r.id = puntos_ruta.ruta_id
      AND pc.usuario_id = auth.uid()
      AND pc.estado = 'activo'
      AND pc.rol IN ('propietario', 'editor')
    )
  );;