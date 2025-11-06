import { memo } from 'react';
import { Mic, Play, Download } from 'lucide-react';

// Dynamic import for react-window to avoid build issues
// @ts-expect-error - react-window types
const FixedSizeList = (await import('react-window')).FixedSizeList;

interface Recording {
  id: string;
  nombre_archivo: string;
  formato_audio: string | null;
  tamano_archivo: number | null;
  duracion_segundos: number | null;
  estado_procesamiento: string;
  created_at: string;
  metadata_extras?: {
    storage_url?: string;
  };
}

interface VirtualizedRecordingsListProps {
  recordings: Recording[];
  onSelectRecording: (recording: Recording) => void;
  onDownloadRecording: (recording: Recording) => void;
  containerHeight?: number;
  itemHeight?: number;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completado':
      return 'bg-green-100 text-green-800';
    case 'procesando':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completado':
      return 'Completado';
    case 'procesando':
      return 'Procesando';
    case 'error':
      return 'Error';
    case 'pendiente':
      return 'Pendiente';
    default:
      return status;
  }
};

// Componente memoizado de fila individual
const RecordingRow = memo(({ 
  recording, 
  onSelect, 
  onDownload,
  style 
}: { 
  recording: Recording;
  onSelect: () => void;
  onDownload: () => void;
  style: React.CSSProperties;
}) => {
  return (
    <div style={style} className="border-b border-gray-200 hover:bg-gray-50">
      <div className="flex items-center px-6 py-4">
        {/* Columna 1: Archivo */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {recording.nombre_archivo}
              </p>
              <p className="text-xs text-gray-500">
                {formatDuration(recording.duracion_segundos)}
              </p>
            </div>
          </div>
        </div>

        {/* Columna 2: Formato */}
        <div className="w-24 px-4 text-sm text-gray-900">
          {recording.formato_audio || 'N/A'}
        </div>

        {/* Columna 3: Tamaño */}
        <div className="w-24 px-4 text-sm text-gray-900">
          {formatFileSize(recording.tamano_archivo)}
        </div>

        {/* Columna 4: Estado */}
        <div className="w-32 px-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recording.estado_procesamiento)}`}>
            {getStatusText(recording.estado_procesamiento)}
          </span>
        </div>

        {/* Columna 5: Fecha */}
        <div className="w-40 px-4 text-sm text-gray-900">
          {new Date(recording.created_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </div>

        {/* Columna 6: Acciones */}
        <div className="w-32 px-4 flex items-center gap-2">
          <button
            onClick={onSelect}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Reproducir"
          >
            <Play className="w-4 h-4" />
          </button>
          {recording.metadata_extras?.storage_url && (
            <button
              onClick={onDownload}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Descargar"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

RecordingRow.displayName = 'RecordingRow';

export default function VirtualizedRecordingsList({
  recordings,
  onSelectRecording,
  onDownloadRecording,
  containerHeight = 600,
  itemHeight = 80
}: VirtualizedRecordingsListProps) {
  
  // Si hay pocas grabaciones, renderizar lista normal (no virtual)
  if (recordings.length < 20) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recordings.map((recording) => (
                <tr key={recording.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {recording.nombre_archivo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDuration(recording.duracion_segundos)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {recording.formato_audio || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatFileSize(recording.tamano_archivo)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recording.estado_procesamiento)}`}>
                      {getStatusText(recording.estado_procesamiento)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(recording.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectRecording(recording)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Reproducir"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      {recording.metadata_extras?.storage_url && (
                        <button
                          onClick={() => onDownloadRecording(recording)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Renderizar lista virtualizada para muchas grabaciones
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header de la tabla */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center px-6 py-3">
          <div className="flex-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Archivo
          </div>
          <div className="w-24 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Formato
          </div>
          <div className="w-24 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tamaño
          </div>
          <div className="w-32 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Estado
          </div>
          <div className="w-40 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Fecha
          </div>
          <div className="w-32 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Acciones
          </div>
        </div>
      </div>

      {/* Lista virtualizada */}
      <FixedSizeList
        height={containerHeight}
        itemCount={recordings.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={5} // Pre-renderizar 5 items arriba y abajo
      >
        {({ index, style }) => (
          <RecordingRow
            recording={recordings[index]}
            onSelect={() => onSelectRecording(recordings[index])}
            onDownload={() => onDownloadRecording(recordings[index])}
            style={style}
          />
        )}
      </FixedSizeList>

      {/* Footer con información */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-sm text-gray-600">
        Mostrando {recordings.length} grabaciones (Virtual Scrolling activo para rendimiento óptimo)
      </div>
    </div>
  );
}
