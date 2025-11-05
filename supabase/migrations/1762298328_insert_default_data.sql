-- Migration: insert_default_data
-- Created at: 1762298328

-- Insertar datos predefinidos del sistema

-- Tags predefinidos del sistema
INSERT INTO tags (nombre, slug, categoria, descripcion, color_hex, es_sistemico) VALUES
('Aves', 'aves', 'especie', 'Sonidos de aves y pájaros', '#FF6B6B', true),
('Insectos', 'insectos', 'especie', 'Sonidos de insectos', '#4ECDC4', true),
('Mamíferos', 'mamiferos', 'especie', 'Sonidos de mamíferos', '#45B7D1', true),
('Anfibios', 'anfibios', 'especie', 'Sonidos de anfibios (ranas, sapos)', '#96CEB4', true),
('Viento', 'viento', 'fuente_sonora', 'Sonidos del viento', '#A8DADC', true),
('Lluvia', 'lluvia', 'fuente_sonora', 'Sonidos de lluvia y precipitación', '#457B9D', true),
('Agua', 'agua', 'fuente_sonora', 'Sonidos de ríos, arroyos, cascadas', '#1D3557', true),
('Trueno', 'trueno', 'fuente_sonora', 'Sonidos de truenos y tormentas', '#F1FAEE', true),
('Tráfico', 'trafico', 'fuente_sonora', 'Sonidos de vehículos y tráfico', '#E63946', true),
('Voces Humanas', 'voces-humanas', 'fuente_sonora', 'Voces y conversaciones humanas', '#F77F00', true),
('Maquinaria', 'maquinaria', 'fuente_sonora', 'Sonidos de maquinaria industrial', '#D62828', true),
('Música', 'musica', 'fuente_sonora', 'Sonidos de música', '#F72585', true),
('Bosque', 'bosque', 'tipo_ambiente', 'Ambiente de bosque', '#2D6A4F', true),
('Selva', 'selva', 'tipo_ambiente', 'Ambiente de selva tropical', '#1B4332', true),
('Costa', 'costa', 'tipo_ambiente', 'Ambiente costero y marino', '#006D77', true),
('Montaña', 'montana', 'tipo_ambiente', 'Ambiente de montaña', '#8B8C89', true),
('Desierto', 'desierto', 'tipo_ambiente', 'Ambiente desértico', '#EDAE49', true),
('Urbano', 'urbano', 'tipo_ambiente', 'Ambiente urbano', '#6C757D', true),
('Rural', 'rural', 'tipo_ambiente', 'Ambiente rural', '#84A98C', true),
('Suburbano', 'suburbano', 'tipo_ambiente', 'Ambiente suburbano', '#52796F', true),
('Día', 'dia', 'condiciones', 'Grabación diurna', '#FFD60A', true),
('Noche', 'noche', 'condiciones', 'Grabación nocturna', '#003566', true),
('Amanecer', 'amanecer', 'condiciones', 'Grabación al amanecer', '#FCA311', true),
('Atardecer', 'atardecer', 'condiciones', 'Grabación al atardecer', '#E85D04', true),
('Despejado', 'despejado', 'condiciones', 'Cielo despejado', '#90E0EF', true),
('Nublado', 'nublado', 'condiciones', 'Cielo nublado', '#ADB5BD', true),
('Lluvioso', 'lluvioso', 'condiciones', 'Condiciones de lluvia', '#4A5759', true),
('Ventoso', 'ventoso', 'condiciones', 'Condiciones de viento', '#C1D3FE', true),
('Calma', 'calma', 'condiciones', 'Condiciones de calma', '#B8F2E6', true),
('Alta Calidad', 'alta-calidad', 'evento', 'Grabación de alta calidad técnica', '#2A9D8F', true),
('Ruido Excesivo', 'ruido-excesivo', 'evento', 'Presencia de ruido excesivo', '#E76F51', true),
('Evento Raro', 'evento-raro', 'evento', 'Evento sonoro raro o inusual', '#F4A261', true),
('Interferencia', 'interferencia', 'evento', 'Interferencia electromagnética u otra', '#E9C46A', true)
ON CONFLICT (slug) DO NOTHING;;