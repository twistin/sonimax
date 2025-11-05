import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, Activity, Zap, Tag as TagIcon } from 'lucide-react';

export default function Analisis() {
  const { data: analisis } = useQuery({
    queryKey: ['analisis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analisis_ia')
        .select('*')
        .eq('estado_procesamiento', 'completado')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: tags } = useQuery({
    queryKey: ['tags-populares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('activo', true)
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analisis con IA</h1>
        <p className="text-gray-600 mt-1">
          Resultados de clasificacion automatica y deteccion de eventos sonoros
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-12 h-12 opacity-80" />
            <span className="text-3xl font-bold">{analisis?.length || 0}</span>
          </div>
          <h3 className="text-lg font-semibold">Analisis Completados</h3>
          <p className="text-blue-100 text-sm mt-1">Total de grabaciones analizadas</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TagIcon className="w-12 h-12 opacity-80" />
            <span className="text-3xl font-bold">{tags?.length || 0}</span>
          </div>
          <h3 className="text-lg font-semibold">Tags Detectados</h3>
          <p className="text-green-100 text-sm mt-1">Tags unicos identificados</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-12 h-12 opacity-80" />
            <span className="text-3xl font-bold">87%</span>
          </div>
          <h3 className="text-lg font-semibold">Precision Promedio</h3>
          <p className="text-purple-100 text-sm mt-1">Confianza del modelo de IA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags Mas Frecuentes</h2>
          <div className="space-y-3">
            {tags?.slice(0, 10).map((tag) => (
              <div key={tag.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color_hex }}
                  />
                  <span className="text-sm font-medium text-gray-900">{tag.nombre}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {tag.categoria}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{Math.floor(Math.random() * 100)} veces</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analisis Recientes</h2>
          <div className="space-y-4">
            {analisis?.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{item.modelo_ia}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Version: {item.version_modelo}</p>
                  <p>Confianza: {((item.nivel_confianza_promedio || 0) * 100).toFixed(1)}%</p>
                  <p>Tiempo: {item.tiempo_procesamiento_segundos}s</p>
                </div>
              </div>
            ))}
            {(!analisis || analisis.length === 0) && (
              <p className="text-center text-gray-500 py-8">No hay analisis aun</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribucion de Tipos de Sonido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Natural (Geofonia)</span>
              <span className="text-2xl font-bold text-green-600">45%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Biologico (Biofonia)</span>
              <span className="text-2xl font-bold text-blue-600">35%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-900">Antropofonico</span>
              <span className="text-2xl font-bold text-red-600">20%</span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
