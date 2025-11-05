import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nombre: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al montar (verificación única)
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    // Listener de cambios de autenticación - SIN operaciones async
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Método de inicio de sesión
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    return { error };
  }

  // Método de registro
  async function signUp(email: string, password: string, nombre: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    // Si el registro es exitoso, crear registro en tabla usuarios
    if (data.user && !error) {
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          nombre: nombre,
          apellido: '',
          rol: 'operador',
          salt: '',
          password_hash: ''
        }]);

      if (dbError) {
        console.error('Error creating user profile:', dbError);
      }
    }

    return { error };
  }

  // Método de cierre de sesión
  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
