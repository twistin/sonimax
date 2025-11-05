import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, MapPin, Calendar, FolderOpen, Edit2, Trash2 } from 'lucide-react';
import type { Proyecto } from '../types';
import EditProyectoForm from '../components/EditProyectoForm'; // Importar el nuevo componente

export default function Proyectos() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null); // Estado para el proyecto en edición
  const [deletingProyecto, setDeletingProyecto] = useState<Proyecto | null>(null); // Estado para el proyecto a eliminar
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    objetivos: '',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const queryClient = useQueryClient();

  const { data: proyectos, isLoading } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Proyecto[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newProyecto: any) => {
      if (!user) throw new Error('Usuario no autenticado');
      
      const { data, error } = await supabase
        .from('proyectos')
        .insert([{
          ...newProyecto,
          user_id: user.id,
          estado: 'planificado',
          metadata: {}
        }])
        .select()
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setIsCreating(false);
      setFormData({
        nombre: '',
        descripcion: '',
        objetivos: '',
        ubicacion: '',
        fecha_inicio: '',
        fecha_fin: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (proyectoId: string) => {
      const { error } = await supabase.from('proyectos').delete().eq('id', proyectoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setDeletingProyecto(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar datos para envío: convertir strings vacíos a null para fechas
    const dataToSubmit = {
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      objetivos: formData.objetivos || null,
      ubicacion: formData.ubicacion || null,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
    };
    
    createMutation.mutate(dataToSubmit);
  };

  const handleDelete = () => {
    if (deletingProyecto) {
      deleteMutation.mutate(deletingProyecto.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus proyectos de grabacion de soundscapes
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear Nuevo Proyecto</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Bosque Amazonico 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicacion
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Manaus, Brasil"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripcion
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el proyecto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objetivos
              </label>
              <textarea
                value={formData.objetivos}
                onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Objetivos del proyecto..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Proyecto'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {editingProyecto && (
        <EditProyectoForm 
          proyecto={editingProyecto} 
          onClose={() => setEditingProyecto(null)} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proyectos?.map((proyecto) => (
          <div
            key={proyecto.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                proyecto.estado === 'activo' ? 'bg-green-100 text-green-700' :
                proyecto.estado === 'completado' ? 'bg-blue-100 text-blue-700' :
                proyecto.estado === 'suspendido' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {proyecto.estado}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{proyecto.nombre}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {proyecto.descripcion || 'Sin descripcion'}
            </p>

            <div className="space-y-2 mb-4">
              {proyecto.ubicacion && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{proyecto.ubicacion}</span>
                </div>
              )}
              {proyecto.fecha_inicio && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(proyecto.fecha_inicio).toLocaleDateString('es-ES')}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setEditingProyecto(proyecto)}
                className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button 
                onClick={() => setDeletingProyecto(proyecto)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {deletingProyecto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-bold">Confirmar Eliminación</h3>
            <p className="my-4">¿Estás seguro de que quieres eliminar el proyecto "{deletingProyecto.nombre}"? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setDeletingProyecto(null)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancelar</button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(!proyectos || proyectos.length === 0) && !isCreating && (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
          <p className="text-gray-600 mb-4">Comienza creando tu primer proyecto de soundscapes</p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Primer Proyecto
          </button>
        </div>
      )}
    </div>
  );
}
