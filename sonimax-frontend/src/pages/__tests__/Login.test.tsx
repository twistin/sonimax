import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock de AuthProvider para evitar errores de contexto
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Login Component', () => {
  it('should render the login form', () => {
    render(
      <BrowserRouter>
        <MockAuthProvider>
          <Login />
        </MockAuthProvider>
      </BrowserRouter>
    );

    // Verificar que el título y el subtítulo están presentes
    expect(screen.getByRole('heading', { name: /SonimaX/i })).toBeInTheDocument();
    expect(screen.getByText(/Inicia sesión en tu cuenta/i)).toBeInTheDocument();

    // Verificar que los campos de email y contraseña existen
    expect(screen.getByPlaceholderText(/tu@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();

    // Verificar que el botón de inicio de sesión está presente
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });
});
