import { describe, it, expect } from 'vitest';

/**
 * Formatea una fecha a string legible
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatea duración en segundos a mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Valida si una coordenada GPS es válida
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Formatea tamaño de archivo en bytes a string legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('debería formatear una fecha correctamente', () => {
      const date = new Date('2025-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('enero');
    });

    it('debería manejar strings de fecha', () => {
      const formatted = formatDate('2025-12-25');
      expect(formatted).toContain('2025');
      expect(formatted).toContain('diciembre');
    });
  });

  describe('formatDuration', () => {
    it('debería formatear segundos a mm:ss', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(120)).toBe('2:00');
      expect(formatDuration(0)).toBe('0:00');
    });

    it('debería manejar duraciones largas', () => {
      expect(formatDuration(3661)).toBe('61:01');
    });
  });

  describe('isValidCoordinate', () => {
    it('debería validar coordenadas válidas', () => {
      expect(isValidCoordinate(40.7128, -74.0060)).toBe(true); // NYC
      expect(isValidCoordinate(0, 0)).toBe(true); // Null Island
      expect(isValidCoordinate(-33.8688, 151.2093)).toBe(true); // Sydney
    });

    it('debería rechazar coordenadas inválidas', () => {
      expect(isValidCoordinate(100, 0)).toBe(false); // Lat > 90
      expect(isValidCoordinate(-100, 0)).toBe(false); // Lat < -90
      expect(isValidCoordinate(0, 200)).toBe(false); // Lng > 180
      expect(isValidCoordinate(0, -200)).toBe(false); // Lng < -180
    });
  });

  describe('formatFileSize', () => {
    it('debería formatear bytes correctamente', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('debería manejar tamaños intermedios', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });
});
