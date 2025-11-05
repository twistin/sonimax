import React, { useState, useEffect } from 'react';
import { Download, Filter, FileText, Map, Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Proyecto {
  id: string;
  nombre: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [format, setFormat] = useState<'csv' | 'geojson' | 'kml'>('csv');
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [selectedProyectos, setSelectedProyectos] = useState<string[]>([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadProyectos();
    }
  }, [isOpen, user]);

  const loadProyectos = async () => {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setProyectos(data || []);
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    }
  };

  const toggleProyecto = (proyectoId: string) => {
    setSelectedProyectos(prev => {
      if (prev.includes(proyectoId)) {
        return prev.filter(id => id !== proyectoId);
      } else {
        return [...prev, proyectoId];
      }
    });
  };

  const handleExport = async () => {
    if (!user) return;

    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const filters: any = {};
      
      if (selectedProyectos.length > 0) {
        filters.proyectoIds = selectedProyectos;
      }
      
      if (fechaDesde) {
        filters.fechaDesde = fechaDesde;
      }
      
      if (fechaHasta) {
        filters.fechaHasta = fechaHasta;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/export-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            format,
            filters
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error en la exportación');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sonimax_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error en exportación:', error);
      setExportStatus('error');
      setErrorMessage(error.message || 'Error desconocido en exportación');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const formatInfo = {
    csv: {
      icon: FileText,
      title: 'CSV (Excel, R, Python)',
      description: 'Formato de tabla compatible con hojas de cálculo y análisis estadístico',
      color: 'text-green-600'
    },
    geojson: {
      icon: Map,
      title: 'GeoJSON (QGIS, ArcGIS)',
      description: 'Formato geoespacial para sistemas de información geográfica',
      color: 'text-blue-600'
    },
    kml: {
      icon: Globe,
      title: 'KML (Google Earth)',
      description: 'Formato para visualización en Google Earth y Google Maps',
      color: 'text-purple-600'
    }
  };

  const currentFormat = formatInfo[format];
  const Icon = currentFormat.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-6 h-6 text-blue-600" />
            Exportar Datos Profesionales
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selector de formato */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Formato de Exportación
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(formatInfo).map(([key, info]) => {
                const FormatIcon = info.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setFormat(key as 'csv' | 'geojson' | 'kml')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      format === key
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FormatIcon className={`w-8 h-8 ${info.color} mx-auto mb-2`} />
                    <div className="text-sm font-semibold text-gray-900">
                      {key.toUpperCase()}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>{currentFormat.title}</strong>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {currentFormat.description}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Datos
            </h3>

            {/* Selector de proyectos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyectos (dejar vacío para todos)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {proyectos.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay proyectos disponibles</p>
                ) : (
                  proyectos.map(proyecto => (
                    <label
                      key={proyecto.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProyectos.includes(proyecto.id)}
                        onChange={() => toggleProyecto(proyecto.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{proyecto.nombre}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedProyectos.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {selectedProyectos.length} proyecto(s) seleccionado(s)
                </p>
              )}
            </div>

            {/* Filtro de fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Estado de exportación */}
          {exportStatus !== 'idle' && (
            <div
              className={`p-4 rounded-lg ${
                exportStatus === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {exportStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Exportación completada</p>
                      <p className="text-sm text-green-700">
                        El archivo se ha descargado correctamente
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Error en exportación</p>
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportar {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
