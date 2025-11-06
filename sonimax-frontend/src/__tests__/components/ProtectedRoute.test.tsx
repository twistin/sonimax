import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test-utils';
import ProtectedRoute from '@/components/ProtectedRoute';

// Mock del contexto de autenticación
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div>Redirecting to {to}</div>;
    },
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería mostrar loading mientras carga la sesión', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('debería redirigir a /login si no hay usuario autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('debería mostrar el contenido si el usuario está autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('no debería redirigir si el usuario está autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
