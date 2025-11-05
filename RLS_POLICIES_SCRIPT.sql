-- ========================================
-- SCRIPT SQL PARA CONFIGURAR POLÍTICAS RLS
-- Ejecutar en el SQL Editor de Supabase
-- URL: https://supabase.com/dashboard/project/zdamggjjfmkothvlvwln/sql-editor
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE grabaciones ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA TABLA PROFILES
-- ========================================

-- Permitir a usuarios ver su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Permitir a usuarios actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir a usuarios insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- POLÍTICAS PARA TABLA PROYECTOS
-- ========================================

-- Permitir a usuarios ver sus propios proyectos
DROP POLICY IF EXISTS "Users can view own projects" ON proyectos;
CREATE POLICY "Users can view own projects" ON proyectos
  FOR SELECT USING (auth.uid() = usuario_id);

-- Permitir a usuarios crear proyectos
DROP POLICY IF EXISTS "Users can insert own projects" ON proyectos;
CREATE POLICY "Users can insert own projects" ON proyectos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Permitir a usuarios actualizar sus propios proyectos
DROP POLICY IF EXISTS "Users can update own projects" ON proyectos;
CREATE POLICY "Users can update own projects" ON proyectos
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Permitir a usuarios eliminar sus propios proyectos
DROP POLICY IF EXISTS "Users can delete own projects" ON proyectos;
CREATE POLICY "Users can delete own projects" ON proyectos
  FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- POLÍTICAS PARA TABLA RUTAS
-- ========================================

-- Permitir a usuarios ver rutas de sus proyectos
DROP POLICY IF EXISTS "Users can view own routes" ON rutas;
CREATE POLICY "Users can view own routes" ON rutas
  FOR SELECT USING (
    auth.uid() = (
      SELECT usuario_id FROM proyectos WHERE id = proyecto_id
    )
  );

-- Permitir a usuarios crear rutas en sus proyectos
DROP POLICY IF EXISTS "Users can insert own routes" ON rutas;
CREATE POLICY "Users can insert own routes" ON rutas
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT usuario_id FROM proyectos WHERE id = proyecto_id
    )
  );

-- Permitir a usuarios actualizar rutas de sus proyectos
DROP POLICY IF EXISTS "Users can update own routes" ON rutas;
CREATE POLICY "Users can update own routes" ON rutas
  FOR UPDATE USING (
    auth.uid() = (
      SELECT usuario_id FROM proyectos WHERE id = proyecto_id
    )
  );

-- Permitir a usuarios eliminar rutas de sus proyectos
DROP POLICY IF EXISTS "Users can delete own routes" ON rutas;
CREATE POLICY "Users can delete own routes" ON rutas
  FOR DELETE USING (
    auth.uid() = (
      SELECT usuario_id FROM proyectos WHERE id = proyecto_id
    )
  );

-- ========================================
-- POLÍTICAS PARA TABLA GRABACIONES
-- ========================================

-- Permitir a usuarios ver grabaciones de sus rutas
DROP POLICY IF EXISTS "Users can view own recordings" ON grabaciones;
CREATE POLICY "Users can view own recordings" ON grabaciones
  FOR SELECT USING (
    auth.uid() = (
      SELECT u.usuario_id 
      FROM proyectos u 
      WHERE u.id = (
        SELECT r.proyecto_id 
        FROM rutas r 
        WHERE r.id = ruta_id
      )
    )
  );

-- Permitir a usuarios crear grabaciones en sus rutas
DROP POLICY IF EXISTS "Users can insert own recordings" ON grabaciones;
CREATE POLICY "Users can insert own recordings" ON grabaciones
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT u.usuario_id 
      FROM proyectos u 
      WHERE u.id = (
        SELECT r.proyecto_id 
        FROM rutas r 
        WHERE r.id = ruta_id
      )
    )
  );

-- Permitir a usuarios actualizar grabaciones de sus rutas
DROP POLICY IF EXISTS "Users can update own recordings" ON grabaciones;
CREATE POLICY "Users can update own recordings" ON grabaciones
  FOR UPDATE USING (
    auth.uid() = (
      SELECT u.usuario_id 
      FROM proyectos u 
      WHERE u.id = (
        SELECT r.proyecto_id 
        FROM rutas r 
        WHERE r.id = ruta_id
      )
    )
  );

-- Permitir a usuarios eliminar grabaciones de sus rutas
DROP POLICY IF EXISTS "Users can delete own recordings" ON grabaciones;
CREATE POLICY "Users can delete own recordings" ON grabaciones
  FOR DELETE USING (
    auth.uid() = (
      SELECT u.usuario_id 
      FROM proyectos u 
      WHERE u.id = (
        SELECT r.proyecto_id 
        FROM rutas r 
        WHERE r.id = ruta_id
      )
    )
  );

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Mostrar políticas creadas
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'proyectos', 'rutas', 'grabaciones')
ORDER BY tablename, policyname;