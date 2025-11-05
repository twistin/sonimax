import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Proyecto } from '../types';

const proyectoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  descripcion: z.string().optional(),
  objetivos: z.string().optional(),
  ubicacion: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

type ProyectoFormData = z.infer<typeof proyectoSchema>;

interface ProyectoFormProps {
  proyecto: Proyecto;
  onClose: () => void;
}

export default function EditProyectoForm({ proyecto, onClose }: ProyectoFormProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProyectoFormData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      nombre: proyecto.nombre || '',
      descripcion: proyecto.descripcion || '',
      objetivos: proyecto.objetivos || '',
      ubicacion: proyecto.ubicacion || '',
      fecha_inicio: proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toISOString().split('T')[0] : '',
      fecha_fin: proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toISOString().split('T')[0] : '',
    },
  });

  useEffect(() => {
    reset({
      nombre: proyecto.nombre || '',
      descripcion: proyecto.descripcion || '',
      objetivos: proyecto.objetivos || '',
      ubicacion: proyecto.ubicacion || '',
      fecha_inicio: proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toISOString().split('T')[0] : '',
      fecha_fin: proyecto.fecha_fin ? new Date(proyecto.fecha_fin).toISOString().split('T')[0] : '',
    });
  }, [proyecto, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: ProyectoFormData) => {
      const { error } = await supabase
        .from('proyectos')
        .update({
          ...data,
          fecha_inicio: data.fecha_inicio || null,
          fecha_fin: data.fecha_fin || null,
        })
        .eq('id', proyecto.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      onClose();
    },
  });

  const onSubmit = (data: ProyectoFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Editar Proyecto</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields go here, similar to the create form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proyecto *</label>
            <input {...register('nombre')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
            <input {...register('ubicacion')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <textarea {...register('descripcion')} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
            <input type="date" {...register('fecha_inicio')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin</label>
            <input type="date" {...register('fecha_fin')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
