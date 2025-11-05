import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const hashFragment = window.location.hash;

      if (hashFragment && hashFragment.length > 0) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment);

          if (error) {
            setError(error.message);
            setTimeout(() => {
              navigate('/login?error=' + encodeURIComponent(error.message));
            }, 2000);
            return;
          }

          if (data.session) {
            navigate('/');
            return;
          }
        } catch (err) {
          setError('Error al procesar la autenticación');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        navigate('/login?error=No session found');
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 mb-4">Error: {error}</div>
            <p className="text-gray-600">Redirigiendo al login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verificando tu cuenta...</p>
          </>
        )}
      </div>
    </div>
  );
}
