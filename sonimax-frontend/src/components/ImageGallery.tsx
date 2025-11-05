import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Image as ImageIcon, MapPin, Calendar, Search, Filter, X, ZoomIn, Download, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ImageData {
  id: string;
  proyecto_id: string;
  punto_id?: string;
  grabacion_id?: string;
  nombre_archivo: string;
  url_publica: string;
  descripcion?: string;
  latitud?: number;
  longitud?: number;
  timestamp_captura?: string;
  tags: string[];
  ancho_px?: number;
  alto_px?: number;
  tamano_archivo?: number;
  proyecto?: {
    nombre: string;
  };
}

interface ImageGalleryProps {
  proyectoId?: string;
  showUpload?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ proyectoId, showUpload = false }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('');
  const [projects, setProjects] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
    if (!proyectoId) {
      loadProjects();
    }
  }, [proyectoId]);

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, filterProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('imagenes_lugares')
        .select(`
          *,
          proyecto:proyectos(nombre)
        `)
        .eq('usuario_id', user?.id)
        .order('created_at', { ascending: false });

      if (proyectoId) {
        query = query.eq('proyecto_id', proyectoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setImages(data || []);
      setFilteredImages(data || []);
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterImages = () => {
    let filtered = [...images];

    if (searchTerm) {
      filtered = filtered.filter(img =>
        img.nombre_archivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterProject) {
      filtered = filtered.filter(img => img.proyecto_id === filterProject);
    }

    setFilteredImages(filtered);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !proyectoId) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('imagenes-lugares')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('imagenes-lugares')
          .getPublicUrl(filePath);

        // Create image record
        const { error: dbError } = await supabase
          .from('imagenes_lugares')
          .insert({
            proyecto_id: proyectoId,
            usuario_id: user?.id,
            nombre_archivo: file.name,
            ruta_storage: filePath,
            url_publica: urlData.publicUrl,
            tamano_archivo: file.size,
            tipo_mime: file.type
          });

        if (dbError) throw dbError;
      }

      await loadImages();
      alert('Imagenes subidas exitosamente');
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error al subir imagenes');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string, rutaStorage: string) => {
    if (!confirm('¿Estas seguro de que deseas eliminar esta imagen?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('imagenes-lugares')
        .remove([rutaStorage]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('imagenes_lugares')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      await loadImages();
      setSelectedImage(null);
      alert('Imagen eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error al eliminar la imagen');
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Cargando imagenes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripcion o tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex gap-2">
            {showUpload && proyectoId && (
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                <Upload className="w-4 h-4" />
                Subir imagenes
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!proyectoId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proyecto
                  </label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Todos los proyectos</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredImages.length} de {images.length} imagenes
        </div>
      </div>

      {filteredImages.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No hay imagenes para mostrar</p>
          {showUpload && proyectoId && (
            <label className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
              <Upload className="w-4 h-4" />
              Subir primera imagen
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedImage(image)}
            >
              <div className="aspect-square relative">
                <img
                  src={image.url_publica}
                  alt={image.nombre_archivo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-3">
                <div className="font-medium text-sm truncate">{image.nombre_archivo}</div>
                {image.proyecto && (
                  <div className="text-xs text-gray-500 truncate">{image.proyecto.nombre}</div>
                )}
                {image.timestamp_captura && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(image.timestamp_captura), 'dd MMM yyyy', { locale: es })}
                  </div>
                )}
                {(image.latitud && image.longitud) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    GPS
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">{selectedImage.nombre_archivo}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
              <div className="lg:col-span-2">
                <img
                  src={selectedImage.url_publica}
                  alt={selectedImage.nombre_archivo}
                  className="w-full rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Informacion</h4>
                  <div className="space-y-2 text-sm">
                    {selectedImage.proyecto && (
                      <div>
                        <span className="text-gray-600">Proyecto:</span>
                        <div className="font-medium">{selectedImage.proyecto.nombre}</div>
                      </div>
                    )}
                    {selectedImage.descripcion && (
                      <div>
                        <span className="text-gray-600">Descripcion:</span>
                        <div>{selectedImage.descripcion}</div>
                      </div>
                    )}
                    {selectedImage.timestamp_captura && (
                      <div>
                        <span className="text-gray-600">Fecha:</span>
                        <div>{format(new Date(selectedImage.timestamp_captura), 'dd MMM yyyy HH:mm', { locale: es })}</div>
                      </div>
                    )}
                    {(selectedImage.latitud && selectedImage.longitud) && (
                      <div>
                        <span className="text-gray-600">Ubicacion:</span>
                        <div className="font-mono text-xs">
                          {selectedImage.latitud.toFixed(6)}, {selectedImage.longitud.toFixed(6)}
                        </div>
                      </div>
                    )}
                    {selectedImage.ancho_px && selectedImage.alto_px && (
                      <div>
                        <span className="text-gray-600">Dimensiones:</span>
                        <div>{selectedImage.ancho_px} x {selectedImage.alto_px} px</div>
                      </div>
                    )}
                    {selectedImage.tamano_archivo && (
                      <div>
                        <span className="text-gray-600">Tamaño:</span>
                        <div>{(selectedImage.tamano_archivo / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => downloadImage(selectedImage.url_publica, selectedImage.nombre_archivo)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                  <button
                    onClick={() => deleteImage(selectedImage.id, selectedImage.url_publica.split('/').slice(-2).join('/'))}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
