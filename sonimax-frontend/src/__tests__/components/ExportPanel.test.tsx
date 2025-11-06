import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '../test-utils';
import ExportPanel from '@/components/ExportPanel';

// Mock de Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', nombre: 'Proyecto Test 1' },
              { id: '2', nombre: 'Proyecto Test 2' },
            ],
            error: null,
          })),
        })),
      })),
    })),
  },
  supabaseUrl: 'https://test.supabase.co',
}));

// Mock del contexto de autenticación
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

describe('ExportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar correctamente cuando está abierto', () => {
    render(<ExportPanel isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText(/Exportar Datos/i)).toBeInTheDocument();
  });

  it('no debería renderizar cuando está cerrado', () => {
    const { container } = render(<ExportPanel isOpen={false} onClose={vi.fn()} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('debería mostrar las tres opciones de formato', async () => {
    render(<ExportPanel isOpen={true} onClose={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText(/CSV/i)).toBeInTheDocument();
      expect(screen.getByText(/GeoJSON/i)).toBeInTheDocument();
      expect(screen.getByText(/KML/i)).toBeInTheDocument();
    });
  });

  it('debería cargar proyectos al abrir', async () => {
    render(<ExportPanel isOpen={true} onClose={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Proyecto Test 1')).toBeInTheDocument();
      expect(screen.getByText('Proyecto Test 2')).toBeInTheDocument();
    });
  });

  it('debería cambiar el formato seleccionado', async () => {
    render(<ExportPanel isOpen={true} onClose={vi.fn()} />);
    
    const geojsonButton = screen.getByRole('button', { name: /GeoJSON/i });
    fireEvent.click(geojsonButton);
    
    await waitFor(() => {
      expect(geojsonButton).toHaveClass('bg-blue-500'); // o la clase que indique selección
    });
  });

  it('debería llamar onClose cuando se hace click en cerrar', async () => {
    const onClose = vi.fn();
    render(<ExportPanel isOpen={true} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
