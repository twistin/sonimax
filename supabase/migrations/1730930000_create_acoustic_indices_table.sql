-- Crear tabla para almacenar índices acústicos calculados
CREATE TABLE IF NOT EXISTS public.acoustic_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grabacion_id UUID NOT NULL REFERENCES public.grabaciones(id) ON DELETE CASCADE,
    
    -- Índices calculados
    aci DECIMAL(10, 4), -- Acoustic Complexity Index
    adi DECIMAL(10, 4), -- Acoustic Diversity Index
    bi DECIMAL(10, 4),  -- Bioacoustic Index
    
    -- Interpretación automática
    interpretacion JSONB, -- {aci: "alta complejidad", adi: "...", bi: "..."}
    
    -- Metadatos del cálculo
    parametros_calculo JSONB, -- Parámetros usados (ventana temporal, FFT size, etc.)
    duracion_segundos DECIMAL(10, 2),
    sample_rate INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Usuario que realizó el análisis
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Índice único para evitar duplicados
    UNIQUE(grabacion_id, created_at)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_acoustic_indices_grabacion ON public.acoustic_indices(grabacion_id);
CREATE INDEX idx_acoustic_indices_created_at ON public.acoustic_indices(created_at DESC);
CREATE INDEX idx_acoustic_indices_usuario ON public.acoustic_indices(usuario_id);

-- Índices para búsquedas por rango de valores
CREATE INDEX idx_acoustic_indices_aci ON public.acoustic_indices(aci) WHERE aci IS NOT NULL;
CREATE INDEX idx_acoustic_indices_adi ON public.acoustic_indices(adi) WHERE adi IS NOT NULL;
CREATE INDEX idx_acoustic_indices_bi ON public.acoustic_indices(bi) WHERE bi IS NOT NULL;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_acoustic_indices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_acoustic_indices_timestamp
    BEFORE UPDATE ON public.acoustic_indices
    FOR EACH ROW
    EXECUTE FUNCTION update_acoustic_indices_updated_at();

-- RLS Policies
ALTER TABLE public.acoustic_indices ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios autenticados pueden ver todos los índices
CREATE POLICY "Usuarios pueden ver acoustic_indices"
    ON public.acoustic_indices
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Usuarios pueden insertar sus propios índices
CREATE POLICY "Usuarios pueden crear acoustic_indices"
    ON public.acoustic_indices
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = usuario_id);

-- Policy: Usuarios pueden actualizar sus propios índices
CREATE POLICY "Usuarios pueden actualizar sus acoustic_indices"
    ON public.acoustic_indices
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Policy: Usuarios pueden eliminar sus propios índices
CREATE POLICY "Usuarios pueden eliminar sus acoustic_indices"
    ON public.acoustic_indices
    FOR DELETE
    TO authenticated
    USING (auth.uid() = usuario_id);

-- Comentarios para documentación
COMMENT ON TABLE public.acoustic_indices IS 'Almacena índices acústicos calculados (ACI, ADI, BI) para cada grabación';
COMMENT ON COLUMN public.acoustic_indices.aci IS 'Acoustic Complexity Index - Mide la complejidad temporal del paisaje sonoro';
COMMENT ON COLUMN public.acoustic_indices.adi IS 'Acoustic Diversity Index - Mide la diversidad espectral basado en entropía de Shannon';
COMMENT ON COLUMN public.acoustic_indices.bi IS 'Bioacoustic Index - Cuantifica actividad biológica en rango 2-8 kHz';
COMMENT ON COLUMN public.acoustic_indices.interpretacion IS 'Interpretación automática en lenguaje natural de los índices calculados';
COMMENT ON COLUMN public.acoustic_indices.parametros_calculo IS 'Parámetros técnicos usados durante el cálculo (ventana, FFT, etc.)';
