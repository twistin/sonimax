import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Users, Mail, Shield, Trash2, Check, X, Crown, Edit2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Collaborator {
  id: string;
  usuario_id: string;
  rol: 'propietario' | 'editor' | 'visualizador';
  estado: 'pendiente' | 'activo' | 'suspendido' | 'rechazado';
  fecha_invitacion: string;
  fecha_aceptacion?: string;
  ultimo_acceso?: string;
  usuario?: {
    email: string;
    nombre?: string;
    apellido?: string;
  };
}

interface CollaborationManagerProps {
  proyectoId: string;
  projectName: string;
  isOwner: boolean;
}

const CollaborationManager: React.FC<CollaborationManagerProps> = ({
  proyectoId,
  projectName,
  isOwner
}) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'visualizador'>('visualizador');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadCollaborators();
  }, [proyectoId]);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('proyecto_colaboradores')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load user emails separately
      if (data && data.length > 0) {
        const userIds = data.map((c: any) => c.usuario_id);
        const { data: usersData } = await supabase
          .from('usuarios')
          .select('id, email')
          .in('id', userIds);

        const enrichedData = data.map((collab: any) => ({
          ...collab,
          usuario: usersData?.find((u: any) => u.id === collab.usuario_id) || { email: 'Desconocido' }
        }));

        setCollaborators(enrichedData as Collaborator[]);
      } else {
        setCollaborators([]);
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteCollaborator = async () => {
    if (!inviteEmail || !isOwner) {
      alert('Por favor, ingresa un email valido');
      return;
    }

    try {
      setInviting(true);

      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, email')
        .eq('email', inviteEmail.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        alert('Usuario no encontrado. El usuario debe estar registrado en SonimaX.');
        return;
      }

      // Check if already a collaborator
      const { data: existing } = await supabase
        .from('proyecto_colaboradores')
        .select('id')
        .eq('proyecto_id', proyectoId)
        .eq('usuario_id', userData.id)
        .single();

      if (existing) {
        alert('Este usuario ya es colaborador del proyecto');
        return;
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('proyecto_colaboradores')
        .insert({
          proyecto_id: proyectoId,
          usuario_id: userData.id,
          rol: inviteRole,
          invitado_por: user?.id,
          estado: 'activo', // Auto-accept for simplicity
          fecha_aceptacion: new Date().toISOString(),
          permisos: {
            ver: true,
            editar: inviteRole === 'editor',
            eliminar: false,
            compartir: false,
            configurar: false
          }
        });

      if (inviteError) throw inviteError;

      // Log activity
      await supabase.from('actividad_proyecto').insert({
        proyecto_id: proyectoId,
        usuario_id: user?.id,
        tipo_actividad: 'compartir_proyecto',
        descripcion: `Invito a ${inviteEmail} como ${inviteRole}`,
        datos_nuevos: {
          email: inviteEmail,
          rol: inviteRole
        }
      });

      alert('Colaborador invitado exitosamente');
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('visualizador');
      loadCollaborators();
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      alert('Error al invitar colaborador');
    } finally {
      setInviting(false);
    }
  };

  const updateCollaboratorRole = async (collaboratorId: string, newRole: string) => {
    if (!isOwner) return;

    try {
      const { error } = await supabase
        .from('proyecto_colaboradores')
        .update({
          rol: newRole,
          permisos: {
            ver: true,
            editar: newRole === 'editor' || newRole === 'propietario',
            eliminar: newRole === 'propietario',
            compartir: newRole === 'propietario',
            configurar: newRole === 'propietario'
          }
        })
        .eq('id', collaboratorId);

      if (error) throw error;

      // Log activity
      await supabase.from('actividad_proyecto').insert({
        proyecto_id: proyectoId,
        usuario_id: user?.id,
        tipo_actividad: 'cambio_permisos',
        descripcion: `Cambio el rol de un colaborador a ${newRole}`,
        datos_nuevos: { rol: newRole }
      });

      alert('Rol actualizado exitosamente');
      loadCollaborators();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol');
    }
  };

  const removeCollaborator = async (collaboratorId: string, email: string) => {
    if (!isOwner) return;

    if (!confirm(`¿Estas seguro de que deseas eliminar a ${email} del proyecto?`)) return;

    try {
      const { error } = await supabase
        .from('proyecto_colaboradores')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      // Log activity
      await supabase.from('actividad_proyecto').insert({
        proyecto_id: proyectoId,
        usuario_id: user?.id,
        tipo_actividad: 'compartir_proyecto',
        descripcion: `Elimino a ${email} del proyecto`
      });

      alert('Colaborador eliminado exitosamente');
      loadCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Error al eliminar colaborador');
    }
  };

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case 'propietario':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'editor':
        return <Edit2 className="w-4 h-4 text-blue-600" />;
      case 'visualizador':
        return <Eye className="w-4 h-4 text-gray-600" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'propietario':
        return 'bg-yellow-100 text-yellow-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'visualizador':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspendido':
        return 'bg-red-100 text-red-800';
      case 'rechazado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando colaboradores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Colaboradores
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona quién puede acceder a "{projectName}"
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowInviteDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4" />
              Invitar colaborador
            </button>
          )}
        </div>

        {collaborators.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No hay colaboradores en este proyecto</p>
            {isOwner && (
              <button
                onClick={() => setShowInviteDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
                Invitar primer colaborador
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {collab.usuario?.email?.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {collab.usuario?.email}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getRoleBadgeColor(collab.rol)}`}
                      >
                        {getRoleIcon(collab.rol)}
                        {collab.rol}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(collab.estado)}`}
                      >
                        {collab.estado}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>
                        Invitado {format(new Date(collab.fecha_invitacion), 'dd MMM yyyy', { locale: es })}
                      </span>
                      {collab.fecha_aceptacion && (
                        <span>
                          Aceptado {format(new Date(collab.fecha_aceptacion), 'dd MMM yyyy', { locale: es })}
                        </span>
                      )}
                      {collab.ultimo_acceso && (
                        <span>
                          Ultimo acceso {format(new Date(collab.ultimo_acceso), 'dd MMM yyyy', { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isOwner && collab.rol !== 'propietario' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={collab.rol}
                      onChange={(e) => updateCollaboratorRole(collab.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="visualizador">Visualizador</option>
                      <option value="editor">Editor</option>
                      <option value="propietario">Propietario</option>
                    </select>

                    <button
                      onClick={() => removeCollaborator(collab.id, collab.usuario?.email || '')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Eliminar colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Roles y permisos</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 mt-0.5 text-yellow-600" />
            <div>
              <span className="font-medium">Propietario:</span> Control total del proyecto (editar, eliminar, compartir, configurar)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Edit2 className="w-4 h-4 mt-0.5 text-blue-600" />
            <div>
              <span className="font-medium">Editor:</span> Puede ver y editar contenido (grabaciones, rutas, imagenes)
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 mt-0.5 text-gray-600" />
            <div>
              <span className="font-medium">Visualizador:</span> Solo puede ver el contenido del proyecto
            </div>
          </div>
        </div>
      </div>

      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Invitar colaborador
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del usuario
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El usuario debe estar registrado en SonimaX
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'visualizador')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="visualizador">Visualizador (solo lectura)</option>
                  <option value="editor">Editor (puede editar)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteEmail('');
                    setInviteRole('visualizador');
                  }}
                  disabled={inviting}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={inviteCollaborator}
                  disabled={inviting || !inviteEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {inviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Invitando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Invitar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationManager;
