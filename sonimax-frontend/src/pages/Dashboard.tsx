import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import ExportPanel from '../components/ExportPanel';
import { useState } from 'react';
import { 
  TrendingUp, 
  Mic, 
  MapPin, 
  Activity,
  Calendar,
  Cloud,
  Tag,
  Download
} from 'lucide-react';

export default function Dashboard() {
  const [showExport, setShowExport] = useState(false);
  const { data: proyectos } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: grabaciones } = useQuery({
    queryKey: ['grabaciones-recientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grabaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const stats = [
    {
      name: 'Proyectos Activos',
      value: proyectos?.filter(p => p.estado === 'activo').length || 0,
      icon: Activity,
      color: 'blue',
      trend: '+12%',
    },
    {
      name: 'Total Grabaciones',
      value: grabaciones?.length || 0,
      icon: Mic,
      color: 'green',
      trend: '+23%',
    },
    {
      name: 'Puntos de Grabacion',
      value: '127',
      icon: MapPin,
      color: 'purple',
      trend: '+8%',
    },
    {
      name: 'Tags Generados',
      value: '1,234',
      icon: Tag,
      color: 'orange',
      trend: '+18%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Resumen general de tus proyectos y grabaciones de soundscapes
          </p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Download className="w-5 h-5" />
          Exportar Datos
        </button>
      </div>

      {showExport && (
        <ExportPanel isOpen={showExport} onClose={() => setShowExport(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
          };

          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-green-600">{stat.trend}</span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Proyectos Recientes</h2>
          <div className="space-y-4">
            {proyectos?.slice(0, 5).map((proyecto) => (
              <div key={proyecto.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{proyecto.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(proyecto.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  proyecto.estado === 'activo' ? 'bg-green-100 text-green-700' :
                  proyecto.estado === 'completado' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {proyecto.estado}
                </span>
              </div>
            ))}
            {(!proyectos || proyectos.length === 0) && (
              <p className="text-center text-gray-500 py-8">No hay proyectos aun</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grabaciones Recientes</h2>
          <div className="space-y-4">
            {grabaciones?.map((grabacion) => (
              <div key={grabacion.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {grabacion.nombre_archivo}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.floor(grabacion.duracion_segundos / 60)}:{(grabacion.duracion_segundos % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  grabacion.estado === 'procesada' ? 'bg-green-100 text-green-700' :
                  grabacion.estado === 'procesando' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {grabacion.estado}
                </span>
              </div>
            ))}
            {(!grabaciones || grabaciones.length === 0) && (
              <p className="text-center text-gray-500 py-8">No hay grabaciones aun</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Analisis con IA</h2>
            <p className="text-blue-100 mb-4">
              Detecta automaticamente especies, fuentes sonoras y analiza la calidad de tus grabaciones
            </p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Iniciar Analisis
            </button>
          </div>
          <Activity className="w-24 h-24 text-blue-300 opacity-50" />
        </div>
      </div>
    </div>
  );
}
