-- Migration: make_punto_id_nullable_in_grabaciones
-- Created at: 1762300510

-- Hacer punto_id nullable en tabla grabaciones
ALTER TABLE grabaciones ALTER COLUMN punto_id DROP NOT NULL;;