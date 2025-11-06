import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../test-utils';
import BatchAnalysis from '@/components/BatchAnalysis';

// Mock del Edge Function
global.fetch = vi.fn();

const mockRecordings = [
  {
    id: '1',
    nombre: 'Recording 1',
    audio_url: 'https://example.com/audio1.mp3',
    latitud: 40.7128,
    longitud: -74.0060,
    fecha_grabacion: '2025-01-01T10:00:00Z',
  },
  {
    id: '2',
    nombre: 'Recording 2',
    audio_url: 'https://example.com/audio2.mp3',
    latitud: 40.7580,
    longitud: -73.9855,
    fecha_grabacion: '2025-01-02T10:00:00Z',
  },
];

describe('BatchAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        detections: [
          {
            species_name: 'American Robin',
            confidence_score: 0.92,
            start_time_seconds: 5.2,
            end_time_seconds: 7.8,
          },
        ],
      }),
    });
  });

  it('debería renderizar correctamente', () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    expect(screen.getByText(/Análisis por Lotes/i)).toBeInTheDocument();
  });

  it('debería mostrar todas las grabaciones disponibles', () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    expect(screen.getByText('Recording 1')).toBeInTheDocument();
    expect(screen.getByText('Recording 2')).toBeInTheDocument();
  });

  it('debería permitir seleccionar grabaciones', () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(checkboxes[0]).toBeChecked();
  });

  it('debería deshabilitar el botón de análisis si no hay selección', () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    const analyzeButton = screen.getByRole('button', { name: /Iniciar Análisis/i });
    expect(analyzeButton).toBeDisabled();
  });

  it('debería habilitar el botón cuando se selecciona una grabación', () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    const analyzeButton = screen.getByRole('button', { name: /Iniciar Análisis/i });
    expect(analyzeButton).not.toBeDisabled();
  });

  it('debería iniciar el análisis al hacer click en el botón', async () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    // Seleccionar una grabación
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    // Iniciar análisis
    const analyzeButton = screen.getByRole('button', { name: /Iniciar Análisis/i });
    fireEvent.click(analyzeButton);

    // Verificar que muestra estado de procesamiento
    await waitFor(() => {
      expect(screen.getByText(/Analizando/i)).toBeInTheDocument();
    });
  });

  it('debería mostrar progreso durante el análisis', async () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    const analyzeButton = screen.getByRole('button', { name: /Iniciar Análisis/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('debería mostrar resultados después del análisis', async () => {
    render(
      <BatchAnalysis
        isOpen={true}
        onClose={vi.fn()}
        recordings={mockRecordings}
      />
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    const analyzeButton = screen.getByRole('button', { name: /Iniciar Análisis/i });
    fireEvent.click(analyzeButton);

    await waitFor(
      () => {
        expect(screen.getByText(/American Robin/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
