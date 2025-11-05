import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import MapPlanner from '../components/MapPlanner';
import { Route, Plus, Edit, Trash2, Map, List } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_ruta: string;
  configuracion: any;
  created_at: string;
  proyecto: {
    nombre: string;
  };
}

const Rutas: React.FC = () => {
  const { user } = useAuth();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedRuta, setSelectedRuta] = useState<string | null>(null);
  const [showPlanner, setShowPlanner] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    loadProjects();
    loadRutas();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setProyectos(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadRutas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rutas')
        .select(`
          *,
          proyecto:proyectos(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRutas(data || []);
    } catch (error) {
      console.error('Error loading rutas:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRuta = async (rutaId: string) => {
    if (!confirm('¿Estas seguro de que deseas eliminar esta ruta?')) return;

    try {
      const { error } = await supabase
        .from('rutas')
        .delete()
        .eq('id', rutaId);

      if (error) throw error;
      
      alert('Ruta eliminada exitosamente');
      loadRutas();
    } catch (error) {
      console.error('Error deleting ruta:', error);
      alert('Error al eliminar la ruta');
    }
  };

  const startNewRoute = () => {
    if (!selectedProject) {
      alert('Por favor, selecciona un proyecto');
      return;
    }
    setSelectedRuta(null);
    setShowPlanner(true);
  };

  const editRoute = (rutaId: string) => {
    setSelectedRuta(rutaId);
    setShowPlanner(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Cargando rutas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Route className="w-8 h-8 text-blue-600" />
              Planificacion de Rutas
            </h1>
            <p className="text-gray-600 mt-2">
              Planifica y gestiona rutas de grabacion con waypoints y puntos de interes
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {viewMode === 'list' ? (
                <>
                  <Map className="w-4 h-4" />
                  Vista mapa
                </>
              ) : (
                <>
                  <List className="w-4 h-4" />
                  Vista lista
                </>
              )}
            </button>
          </div>
        </div>

        {!showPlanner && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona un proyecto
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar proyecto</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={startNewRoute}
                disabled={!selectedProject}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Nueva ruta
              </button>
            </div>
          </div>
        )}
      </div>

      {showPlanner ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {selectedRuta ? 'Editar ruta' : 'Nueva ruta'}
            </h2>
            <button
              onClick={() => {
                setShowPlanner(false);
                setSelectedRuta(null);
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Volver a la lista
            </button>
          </div>

          <MapPlanner
            rutaId={selectedRuta || undefined}
            proyectoId={selectedProject}
            onSave={(rutaId) => {
              loadRutas();
              setShowPlanner(false);
              setSelectedRuta(null);
            }}
          />
        </div>
      ) : (
        <>
          {rutas.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No hay rutas planificadas
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza planificando tu primera ruta de grabacion
              </p>
              <button
                onClick={() => {
                  if (proyectos.length > 0) {
                    setSelectedProject(proyectos[0].id);
                    startNewRoute();
                  } else {
                    alert('Primero debes crear un proyecto');
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Crear primera ruta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {rutas.map((ruta) => (
                <div
                  key={ruta.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {ruta.nombre}
                      </h3>
                      {ruta.descripcion && (
                        <p className="text-gray-600 mb-3">{ruta.descripcion}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Proyecto:</span> {ruta.proyecto.nombre}
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span> {ruta.tipo_ruta}
                        </div>
                        {ruta.configuracion?.numero_puntos && (
                          <div>
                            <span className="font-medium">Puntos:</span> {ruta.configuracion.numero_puntos}
                          </div>
                        )}
                        {ruta.configuracion?.distancia_total_metros && (
                          <div>
                            <span className="font-medium">Distancia:</span>{' '}
                            {(ruta.configuracion.distancia_total_metros / 1000).toFixed(2)} km
                          </div>
                        )}
                        {ruta.configuracion?.tiempo_total_segundos && (
                          <div>
                            <span className="font-medium">Tiempo estimado:</span>{' '}
                            {Math.round(ruta.configuracion.tiempo_total_segundos / 60)} min
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Creada:</span>{' '}
                          {format(new Date(ruta.created_at), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => editRoute(ruta.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Editar ruta"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteRuta(ruta.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Eliminar ruta"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Rutas;
