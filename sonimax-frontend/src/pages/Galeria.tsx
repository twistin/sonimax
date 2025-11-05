import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Image as ImageIcon, 
  MapPin, 
  Calendar, 
  Cloud, 
  Filter,
  Search,
  Loader2,
  Music,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import ImageDetailModal from '../components/ImageDetailModal';

interface ImageData {
  id: string;
  nombre_archivo: string;
  url_publica: string;
  latitud: number | null;
  longitud: number | null;
  altitud: number | null;
  precision_gps: number | null;
  timestamp_captura: string;
  nombre_sitio: string | null;
  condiciones_atmosfericas: string | null;
  caracteristicas_sitio: string[] | null;
  descripcion: string | null;
  notas_campo: string | null;
  proyecto_id: string | null;
  grabacion_id: string | null;
  proyecto?: {
    nombre: string;
  };
  grabacion?: {
    nombre_archivo: string;
    url_publica: string;
  };
}

interface Proyecto {
  id: string;
  nombre: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const Galeria: React.FC = () => {
  const { user } = useAuth();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  
  // Estados de filtros
  const [searchText, setSearchText] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState<string>('');
  const [selectedCondicion, setSelectedCondicion] = useState<string>('');
  const [selectedCaracteristicas, setSelectedCaracteristicas] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const CONDICIONES_ATMOSFERICAS = [
    'Soleado', 'Parcialmente nublado', 'Nublado', 'Lluvioso', 
    'Ventoso', 'Tormentoso', 'Nevado', 'Niebla', 'Caluroso', 'Frio'
  ];

  const CARACTERISTICAS_SITIO = [
    'Bosque', 'Playa', 'Urbano', 'Rural', 'Montaña', 'Rio', 'Lago', 
    'Parque', 'Desierto', 'Humedal', 'Acantilado', 'Valle', 
    'Campo abierto', 'Jardin', 'Zona industrial'
  ];

  useEffect(() => {
    if (user) {
      fetchImages();
      fetchProyectos();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [images, searchText, selectedProyecto, selectedCondicion, selectedCaracteristicas, fechaInicio, fechaFin]);

  const fetchProyectos = async () => {
    try {
      const { data, error } = await supabase
        .from('proyectos')
        .select('id, nombre')
        .eq('user_id', user?.id)
        .order('nombre');

      if (error) throw error;
      setProyectos(data || []);
    } catch (error) {
      console.error('Error fetching proyectos:', error);
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('imagenes_lugares')
        .select(`
          *,
          proyecto:proyectos(nombre),
          grabacion:grabaciones(nombre_archivo, url_publica)
        `)
        .eq('usuario_id', user?.id)
        .order('timestamp_captura', { ascending: false });

      if (error) throw error;

      setImages(data || []);
      setFilteredImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...images];

    // Filtro de busqueda por texto
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(img => 
        img.nombre_sitio?.toLowerCase().includes(search) ||
        img.descripcion?.toLowerCase().includes(search) ||
        img.notas_campo?.toLowerCase().includes(search)
      );
    }

    // Filtro por proyecto
    if (selectedProyecto) {
      filtered = filtered.filter(img => img.proyecto_id === selectedProyecto);
    }

    // Filtro por condiciones atmosfericas
    if (selectedCondicion) {
      filtered = filtered.filter(img => img.condiciones_atmosfericas === selectedCondicion);
    }

    // Filtro por caracteristicas del sitio
    if (selectedCaracteristicas.length > 0) {
      filtered = filtered.filter(img => {
        if (!img.caracteristicas_sitio) return false;
        return selectedCaracteristicas.every(caracteristica => 
          img.caracteristicas_sitio?.includes(caracteristica)
        );
      });
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      filtered = filtered.filter(img => 
        new Date(img.timestamp_captura) >= new Date(fechaInicio)
      );
    }
    if (fechaFin) {
      filtered = filtered.filter(img => 
        new Date(img.timestamp_captura) <= new Date(fechaFin + 'T23:59:59')
      );
    }

    setFilteredImages(filtered);
  };

  const toggleCaracteristica = (caracteristica: string) => {
    setSelectedCaracteristicas(prev => {
      if (prev.includes(caracteristica)) {
        return prev.filter(c => c !== caracteristica);
      } else {
        return [...prev, caracteristica];
      }
    });
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedProyecto('');
    setSelectedCondicion('');
    setSelectedCaracteristicas([]);
    setFechaInicio('');
    setFechaFin('');
  };

  const mapCenter = filteredImages.length > 0 && filteredImages[0].latitud && filteredImages[0].longitud
    ? { lat: filteredImages[0].latitud, lng: filteredImages[0].longitud }
    : { lat: 40.416775, lng: -3.703790 }; // Madrid por defecto

  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando galeria...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-blue-600" />
            Galeria de Imagenes
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredImages.length} de {images.length} imagenes
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              Vista Cuadricula
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'map' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              Vista Mapa
            </button>
          </div>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filtros Avanzados</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Busqueda por texto */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nombre o descripcion
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por proyecto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto
              </label>
              <select
                value={selectedProyecto}
                onChange={(e) => setSelectedProyecto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los proyectos</option>
                {proyectos.map(proyecto => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por condiciones atmosfericas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condiciones Atmosfericas
              </label>
              <select
                value={selectedCondicion}
                onChange={(e) => setSelectedCondicion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las condiciones</option>
                {CONDICIONES_ATMOSFERICAS.map(condicion => (
                  <option key={condicion} value={condicion}>
                    {condicion}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por caracteristicas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caracteristicas del Sitio
            </label>
            <div className="flex flex-wrap gap-2">
              {CARACTERISTICAS_SITIO.map(caracteristica => (
                <button
                  key={caracteristica}
                  onClick={() => toggleCaracteristica(caracteristica)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCaracteristicas.includes(caracteristica)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {caracteristica}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vista de cuadricula */}
      {viewMode === 'grid' && (
        <div>
          {filteredImages.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron imagenes
              </h3>
              <p className="text-gray-500">
                {images.length === 0 
                  ? 'Aun no has capturado ninguna imagen'
                  : 'Intenta ajustar los filtros'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map(image => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group"
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={image.url_publica}
                      alt={image.nombre_sitio || 'Imagen'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {image.grabacion_id && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        Audio
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                      {image.nombre_sitio || 'Sin nombre'}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      {image.proyecto && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Proyecto:</span>
                          <span className="line-clamp-1">{image.proyecto.nombre}</span>
                        </div>
                      )}
                      
                      {image.condiciones_atmosfericas && (
                        <div className="flex items-center gap-1">
                          <Cloud className="w-3 h-3" />
                          {image.condiciones_atmosfericas}
                        </div>
                      )}
                      
                      {image.latitud && image.longitud && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {image.latitud.toFixed(4)}, {image.longitud.toFixed(4)}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(image.timestamp_captura).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    
                    {image.caracteristicas_sitio && image.caracteristicas_sitio.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {image.caracteristicas_sitio.slice(0, 3).map(caract => (
                          <span
                            key={caract}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {caract}
                          </span>
                        ))}
                        {image.caracteristicas_sitio.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{image.caracteristicas_sitio.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista de mapa */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '600px' }}
            center={mapCenter}
            zoom={12}
          >
              {filteredImages
                .filter(img => img.latitud && img.longitud)
                .map(image => (
                  <Marker
                    key={image.id}
                    position={{ lat: image.latitud!, lng: image.longitud! }}
                    onClick={() => setSelectedMarkerId(image.id)}
                    icon={{
                      url: image.grabacion_id 
                        ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }}
                  />
                ))}

              {selectedMarkerId && (
                <InfoWindow
                  position={{
                    lat: filteredImages.find(img => img.id === selectedMarkerId)?.latitud!,
                    lng: filteredImages.find(img => img.id === selectedMarkerId)?.longitud!,
                  }}
                  onCloseClick={() => setSelectedMarkerId(null)}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      const image = filteredImages.find(img => img.id === selectedMarkerId);
                      if (image) setSelectedImage(image);
                    }}
                  >
                    <img
                      src={filteredImages.find(img => img.id === selectedMarkerId)?.url_publica}
                      alt="Imagen"
                      className="w-48 h-32 object-cover rounded mb-2"
                    />
                    <h4 className="font-semibold text-sm">
                      {filteredImages.find(img => img.id === selectedMarkerId)?.nombre_sitio || 'Sin nombre'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Click para ver detalles
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
        </div>
      )}

      {/* Modal de detalle de imagen */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default Galeria;
