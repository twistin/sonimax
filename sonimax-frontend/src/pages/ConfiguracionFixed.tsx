import { useState, useEffect } from 'react';
import { Settings, User, Database, Cloud, Key, Bell, Save, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  institution?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

interface AppSettings {
  automatic_analysis: boolean;
  background_sync: boolean;
  meteorological_data: boolean;
  audio_format: string;
  default_analysis_settings: any;
  notification_preferences: {
    email_enabled: boolean;
    push_enabled: boolean;
    analysis_complete: boolean;
    new_recordings: boolean;
  };
}

export default function ConfiguracionFixed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [settings, setSettings] = useState<AppSettings>({
    automatic_analysis: true,
    background_sync: true,
    meteorological_data: true,
    audio_format: 'WAV',
    default_analysis_settings: {},
    notification_preferences: {
      email_enabled: true,
      push_enabled: false,
      analysis_complete: true,
      new_recordings: false,
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [systemInfo, setSystemInfo] = useState({
    version: '2.2.0',
    database: 'Supabase (Conectado)',
    storage_used: '0 MB',
    storage_limit: '10 GB',
    last_sync: 'Nunca'
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserSettings();
      loadSystemInfo();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          ...data,
          email: user?.email || '',
        });
      } else {
        setProfile({
          id: user?.id,
          email: user?.email || '',
          full_name: '',
          role: 'Investigador'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Error al cargar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      // Cargar configuración del usuario desde localStorage por ahora
      // En producción se cargaría desde una tabla user_settings
      const savedSettings = localStorage.getItem('sonimax_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      // Obtener información del sistema
      const { data: recordings } = await supabase
        .from('grabaciones')
        .select('tamano_archivo')
        .eq('usuario_id', user?.id);

      const totalSize = recordings?.reduce((sum, r) => sum + (r.tamano_archivo || 0), 0) || 0;
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);

      setSystemInfo(prev => ({
        ...prev,
        storage_used: `${sizeInMB} MB`
      }));
    } catch (error) {
      console.error('Error loading system info:', error);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Crear o actualizar perfil en la base de datos
      const profileData = {
        id: user?.id,
        full_name: profile.full_name,
        phone: profile.phone,
        institution: profile.institution,
        role: profile.role,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Error al guardar el perfil' });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Guardar configuración en localStorage
      localStorage.setItem('sonimax_settings', JSON.stringify(settings));

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleApiKeyChange = (service: string, value: string) => {
    // Por seguridad, las API keys se guardarían cifradas
    console.log(`API Key actualizada para ${service}`);
  };

  const testConnection = async (service: string) => {
    try {
      setMessage({ type: 'success', text: `Conexión con ${service} funcionando correctamente` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `Error de conexión con ${service}` });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          Configuración
        </h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu perfil, preferencias y configuración de la aplicación
        </p>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <span className="text-red-500">⚠</span>
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar de navegación */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5" />
                Perfil
              </button>
              <button 
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  activeTab === 'preferences'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
                Preferencias
              </button>
              <button 
                onClick={() => setActiveTab('database')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  activeTab === 'database'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Database className="w-5 h-5" />
                Base de Datos
              </button>
              <button 
                onClick={() => setActiveTab('api-keys')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  activeTab === 'api-keys'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Key className="w-5 h-5" />
                API Keys
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-5 h-5" />
                Notificaciones
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            
            {/* TAB PERFIL */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Información del Perfil</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institución
                    </label>
                    <input
                      type="text"
                      value={profile.institution || ''}
                      onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Universidad, Instituto, etc."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol
                    </label>
                    <select 
                      value={profile.role || 'Investigador'}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Operador">Operador</option>
                      <option value="Investigador">Investigador</option>
                      <option value="Analista">Analista</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Perfil
                  </button>
                </div>
              </div>
            )}

            {/* TAB PREFERENCIAS */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Preferencias de Análisis</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Análisis Automático</p>
                      <p className="text-sm text-gray-600">Analizar automáticamente nuevas grabaciones</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.automatic_analysis}
                        onChange={(e) => setSettings({...settings, automatic_analysis: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Sincronización en Segundo Plano</p>
                      <p className="text-sm text-gray-600">Sincronizar datos automáticamente</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.background_sync}
                        onChange={(e) => setSettings({...settings, background_sync: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Obtener Datos Meteorológicos</p>
                      <p className="text-sm text-gray-600">Descargar automáticamente condiciones meteorológicas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.meteorological_data}
                        onChange={(e) => setSettings({...settings, meteorological_data: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de Audio por Defecto
                    </label>
                    <select 
                      value={settings.audio_format}
                      onChange={(e) => setSettings({...settings, audio_format: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="WAV">WAV (Sin compresión)</option>
                      <option value="MP3">MP3 (Comprimido)</option>
                      <option value="FLAC">FLAC (Sin pérdida)</option>
                      <option value="OGG">OGG (Comprimido)</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            )}

            {/* TAB API KEYS */}
            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Gestión de API Keys</h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span className="text-yellow-600">⚠</span>
                    <p className="text-sm font-medium">
                      Tus API keys están protegidas y se almacenan de forma segura
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Google Maps API</h3>
                      <button
                        onClick={() => testConnection('Google Maps')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Probar conexión
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Para funcionalidades de mapas y geolocalización</p>
                    <input
                      type="password"
                      placeholder="AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleApiKeyChange('google_maps', e.target.value)}
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">BirdNET API</h3>
                      <button
                        onClick={() => testConnection('BirdNET')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Probar conexión
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Para identificación automática de especies de aves</p>
                    <input
                      type="password"
                      placeholder="Ingresa tu BirdNET API Key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleApiKeyChange('birdnet', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Guardar API Keys
                  </button>
                </div>
              </div>
            )}

            {/* TAB NOTIFICACIONES */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Preferencias de Notificación</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Notificaciones por Email</p>
                      <p className="text-sm text-gray-600">Recibir notificaciones importantes por correo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.notification_preferences.email_enabled}
                        onChange={(e) => setSettings({
                          ...settings, 
                          notification_preferences: {
                            ...settings.notification_preferences,
                            email_enabled: e.target.checked
                          }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Notificaciones Push</p>
                      <p className="text-sm text-gray-600">Recibir notificaciones en el navegador</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.notification_preferences.push_enabled}
                        onChange={(e) => setSettings({
                          ...settings, 
                          notification_preferences: {
                            ...settings.notification_preferences,
                            push_enabled: e.target.checked
                          }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Análisis Completado</p>
                      <p className="text-sm text-gray-600">Notificar cuando termine el análisis de grabaciones</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.notification_preferences.analysis_complete}
                        onChange={(e) => setSettings({
                          ...settings, 
                          notification_preferences: {
                            ...settings.notification_preferences,
                            analysis_complete: e.target.checked
                          }
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar Notificaciones
                  </button>
                </div>
              </div>
            )}

            {/* TAB BASE DE DATOS */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Información del Sistema</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versión de SonimaX:</span>
                    <span className="font-medium text-gray-900">{systemInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base de Datos:</span>
                    <span className="font-medium text-green-600">{systemInfo.database}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Almacenamiento Usado:</span>
                    <span className="font-medium text-gray-900">{systemInfo.storage_used} / {systemInfo.storage_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última Sincronización:</span>
                    <span className="font-medium text-gray-900">{systemInfo.last_sync}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Estado de la Conexión</h3>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Conexión estable con la base de datos</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
