import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { MapPin, Route, Plus, Save, Trash2, Edit, Target, Navigation, Loader2, Camera, HelpCircle, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import CameraCaptureModal from './CameraCaptureModal';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk';
const libraries: ("drawing" | "places")[] = ['drawing', 'places'];

interface WayPoint {
  id?: string;
  orden: number;
  tipo_punto: 'inicio' | 'waypoint' | 'punto_interes' | 'fin';
  nombre: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  altitud?: number;
  distancia_desde_anterior?: number;
  tiempo_estimado_desde_anterior?: number;
  actividades_planificadas: string[];
  duracion_estimada_minutos?: number;
}

interface MapPlannerProps {
  rutaId?: string;
  proyectoId: string;
  onSave?: (rutaId: string) => void;
}

const MapPlannerFixed: React.FC<MapPlannerProps> = ({ rutaId, proyectoId, onSave }) => {
  const { user } = useAuth();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [waypoints, setWaypoints] = useState<WayPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [showPointDialog, setShowPointDialog] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Partial<WayPoint>>({});
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedPointForCamera, setSelectedPointForCamera] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [quickMode, setQuickMode] = useState(false); // Modo simplificado

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  const mapContainerStyle = {
    width: '100%',
    height: '600px'
  };

  const center = {
    lat: 40.4168,
    lng: -3.7038
  };

  // Cargar ruta existente si rutaId está definido
  useEffect(() => {
    if (rutaId) {
      loadRoute();
    }
  }, [rutaId]);

  const loadRoute = async () => {
    if (!rutaId) return;

    try {
      const { data: rutaData, error: rutaError } = await supabase
        .from('rutas')
        .select('*')
        .eq('id', rutaId)
        .single();

      if (rutaError) throw rutaError;

      setRouteName(rutaData.nombre);
      setRouteDescription(rutaData.descripcion || '');

      const { data: puntosData, error: puntosError } = await supabase
        .from('puntos_ruta')
        .select('*')
        .eq('ruta_id', rutaId)
        .order('orden', { ascending: true });

      if (puntosError) throw puntosError;

      setWaypoints(puntosData.map((p: any) => ({
        id: p.id,
        orden: p.orden,
        tipo_punto: p.tipo_punto,
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        latitud: parseFloat(p.latitud),
        longitud: parseFloat(p.longitud),
        altitud: p.altitud ? parseFloat(p.altitud) : undefined,
        distancia_desde_anterior: p.distancia_desde_anterior ? parseFloat(p.distancia_desde_anterior) : undefined,
        tiempo_estimado_desde_anterior: p.tiempo_estimado_desde_anterior,
        actividades_planificadas: p.actividades_planificadas || [],
        duracion_estimada_minutos: p.duracion_estimada_minutos
      })));
    } catch (error) {
      console.error('Error loading route:', error);
    }
  };

  const onMapClick = useCallback((e: any) => {
    if (!isDrawing || !e.latLng) return;

    if (quickMode) {
      // Modo rápido: punto con nombre automático
      const newPoint: WayPoint = {
        orden: waypoints.length,
        tipo_punto: waypoints.length === 0 ? 'inicio' : 'waypoint',
        nombre: waypoints.length === 0 ? 'Punto de Inicio' : `Punto ${waypoints.length}`,
        descripcion: 'Punto añadido rápidamente',
        latitud: e.latLng.lat(),
        longitud: e.latLng.lng(),
        actividades_planificadas: []
      };

      setWaypoints([...waypoints, newPoint]);
      calculateDistances([...waypoints, newPoint]);
    } else {
      // Modo normal: abrir diálogo de edición
      const newPoint: WayPoint = {
        orden: waypoints.length,
        tipo_punto: waypoints.length === 0 ? 'inicio' : 'waypoint',
        nombre: `Punto ${waypoints.length + 1}`,
        descripcion: '',
        latitud: e.latLng.lat(),
        longitud: e.latLng.lng(),
        actividades_planificadas: []
      };

      setEditingPoint(newPoint);
      setSelectedPoint(waypoints.length);
      setShowPointDialog(true);
    }
  }, [isDrawing, waypoints, quickMode]);

  const calculateDistances = (points: WayPoint[]) => {
    let totalDist = 0;
    let totalT = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const distance = calculateDistance(
        prev.latitud,
        prev.longitud,
        curr.latitud,
        curr.longitud
      );

      points[i].distancia_desde_anterior = distance;
      points[i].tiempo_estimado_desde_anterior = Math.round((distance / 1000) * 600); // 10 min/km

      totalDist += distance;
      totalT += points[i].tiempo_estimado_desde_anterior || 0;
    }

    setTotalDistance(totalDist);
    setTotalTime(totalT);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLocation({ lat, lng });
        setIsGettingLocation(false);

        // Centrar el mapa en la ubicación actual
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(15);
        }

        alert('Ubicación obtenida correctamente');
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Habilita el acceso a tu ubicación en la configuración del navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Asegúrate de tener GPS activado.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }
        
        setGpsError(errorMessage);
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const addPointAtCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const altitude = position.coords.altitude || undefined;
        const accuracy = position.coords.accuracy;

        setIsGettingLocation(false);

        // Crear nuevo punto en la ubicación GPS
        const newPoint: WayPoint = {
          orden: waypoints.length,
          tipo_punto: waypoints.length === 0 ? 'inicio' : 'waypoint',
          nombre: quickMode ? `Punto ${waypoints.length + 1}` : `Punto GPS ${waypoints.length + 1}`,
          descripcion: `Ubicación actual (±${Math.round(accuracy)}m)`,
          latitud: lat,
          longitud: lng,
          altitud: altitude,
          actividades_planificadas: []
        };

        const updatedWaypoints = [...waypoints, newPoint];
        setWaypoints(updatedWaypoints);
        calculateDistances(updatedWaypoints);

        // Centrar mapa en el nuevo punto
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(15);
        }

        alert('Punto agregado exitosamente');
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Error al obtener ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica que tu GPS esté activado.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        }
        
        setGpsError(errorMessage);
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    // Reordenar
    const reordered = newWaypoints.map((wp, i) => ({ ...wp, orden: i }));
    setWaypoints(reordered);
    calculateDistances(reordered);
  };

  const editWaypoint = (index: number) => {
    setEditingPoint(waypoints[index]);
    setSelectedPoint(index);
    setShowPointDialog(true);
  };

  const saveWaypointEdit = () => {
    if (selectedPoint === null) return;

    if (quickMode) {
      // Modo rápido: solo cambiar nombre
      const updated = [...waypoints];
      updated[selectedPoint] = { ...updated[selectedPoint], nombre: editingPoint.nombre || `Punto ${selectedPoint + 1}` };
      setWaypoints(updated);
    } else {
      // Modo normal: actualizar todo
      const updated = [...waypoints];
      updated[selectedPoint] = { ...updated[selectedPoint], ...editingPoint };
      setWaypoints(updated);
    }
    
    setShowPointDialog(false);
    setEditingPoint({});
    setSelectedPoint(null);
  };

  const openCameraForPoint = (index: number) => {
    setSelectedPointForCamera(index);
    setShowCameraModal(true);
  };

  const handleImageSaved = (imageId: string) => {
    console.log('Image saved with ID:', imageId);
    alert('Imagen guardada exitosamente');
  };

  const saveRoute = async () => {
    if (!user || !proyectoId || !routeName) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }

    if (waypoints.length === 0) {
      alert('Agrega al menos un punto a la ruta');
      return;
    }

    try {
      // Crear o actualizar ruta
      const routeData = {
        proyecto_id: proyectoId,
        nombre: routeName,
        descripcion: routeDescription,
        tipo_ruta: 'transecto',
        geometria: {
          type: 'LineString',
          coordinates: waypoints.map(wp => [wp.longitud, wp.latitud])
        },
        configuracion: {
          distancia_total_metros: totalDistance,
          tiempo_total_segundos: totalTime,
          numero_puntos: waypoints.length,
          modo_rapido: quickMode
        }
      };

      let savedRutaId = rutaId;

      if (rutaId) {
        // Actualizar ruta existente
        const { error: updateError } = await supabase
          .from('rutas')
          .update(routeData)
          .eq('id', rutaId);

        if (updateError) throw updateError;

        // Eliminar puntos antiguos
        await supabase
          .from('puntos_ruta')
          .delete()
          .eq('ruta_id', rutaId);
      } else {
        // Crear nueva ruta
        const { data: newRuta, error: insertError } = await supabase
          .from('rutas')
          .insert([routeData])
          .select()
          .single();

        if (insertError) throw insertError;
        savedRutaId = newRuta.id;
      }

      // Insertar puntos de ruta
      const puntosToInsert = waypoints.map(wp => ({
        ruta_id: savedRutaId,
        orden: wp.orden,
        tipo_punto: wp.tipo_punto,
        nombre: wp.nombre,
        descripcion: wp.descripcion,
        latitud: wp.latitud,
        longitud: wp.longitud,
        altitud: wp.altitud,
        distancia_desde_anterior: wp.distancia_desde_anterior,
        tiempo_estimado_desde_anterior: wp.tiempo_estimado_desde_anterior,
        actividades_planificadas: wp.actividades_planificadas,
        duracion_estimada_minutos: wp.duracion_estimada_minutos
      }));

      const { error: puntosError } = await supabase
        .from('puntos_ruta')
        .insert(puntosToInsert);

      if (puntosError) throw puntosError;

      alert('Ruta guardada exitosamente');
      if (onSave && savedRutaId) {
        onSave(savedRutaId);
      }
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Error al guardar la ruta');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando mapa...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de herramientas principal */}
      <div className="bg-white p-4 rounded-lg shadow">
        {/* Información básica de la ruta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la ruta
            </label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ej: Ruta del Parque Nacional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={routeDescription}
              onChange={(e) => setRouteDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Descripción breve de la ruta"
            />
          </div>
        </div>

        {/* Controles principales */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setIsDrawing(!isDrawing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              isDrawing
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isDrawing ? 'Añadiendo puntos...' : 'Añadir puntos'}
          </button>

          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300"
            title="Ver mi ubicación en el mapa"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            Mi ubicación
          </button>

          <button
            onClick={addPointAtCurrentLocation}
            disabled={isGettingLocation}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
            title="Agregar punto usando GPS"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            Grabar aquí
          </button>

          <button
            onClick={saveRoute}
            disabled={waypoints.length === 0 || !routeName}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" />
            Guardar ruta
          </button>

          <button
            onClick={() => setWaypoints([])}
            disabled={waypoints.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
        </div>

        {/* Configuraciones adicionales */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="quickMode"
              checked={quickMode}
              onChange={(e) => setQuickMode(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="quickMode" className="text-sm font-medium text-gray-700">
              Modo Rápido (nombres automáticos)
            </label>
          </div>
          
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <HelpCircle className="w-4 h-4" />
            Ayuda
          </button>
        </div>

        {/* Ayuda contextual */}
        {showHelp && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">¿Cómo crear una ruta?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Añadir puntos:</strong> Activa este botón y haz clic en el mapa</li>
              <li>• <strong>Grabar aquí:</strong> Usa tu GPS para agregar puntos automáticamente</li>
              <li>• <strong>Modo Rápido:</strong> Simplifica el proceso con nombres automáticos</li>
              <li>• <strong>Cámara:</strong> Haz clic en cualquier punto para tomar fotos</li>
            </ul>
          </div>
        )}

        {/* Estadísticas de la ruta */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Puntos</div>
            <div className="text-2xl font-bold">{waypoints.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Distancia</div>
            <div className="text-2xl font-bold">{(totalDistance / 1000).toFixed(2)} km</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">Tiempo</div>
            <div className="text-2xl font-bold">{Math.round(totalTime / 60)} min</div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={waypoints.length > 0 ? { lat: waypoints[0].latitud, lng: waypoints[0].longitud } : center}
          zoom={waypoints.length > 0 ? 13 : 6}
          onLoad={setMap}
          onClick={onMapClick}
        >
          {waypoints.map((point, index) => (
            <Marker
              key={index}
              position={{ lat: point.latitud, lng: point.longitud }}
              label={{
                text: (index + 1).toString(),
                color: 'white',
                fontWeight: 'bold'
              }}
              onClick={() => setSelectedPoint(index)}
            />
          ))}

          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4F46E5',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }}
              title="Tu ubicación actual"
            />
          )}

          {selectedPoint !== null && (
            <InfoWindow
              position={{
                lat: waypoints[selectedPoint].latitud,
                lng: waypoints[selectedPoint].longitud
              }}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div className="p-2">
                <h3 className="font-bold">{waypoints[selectedPoint].nombre}</h3>
                <p className="text-sm text-gray-600">{waypoints[selectedPoint].descripcion}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => openCameraForPoint(selectedPoint)}
                    className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    Cámara
                  </button>
                  <button
                    onClick={() => editWaypoint(selectedPoint)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => removeWaypoint(selectedPoint)}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

          {waypoints.length > 1 && (
            <Polyline
              path={waypoints.map(wp => ({ lat: wp.latitud, lng: wp.longitud }))}
              options={{
                strokeColor: '#3B82F6',
                strokeOpacity: 0.8,
                strokeWeight: 3
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* Lista de puntos simplificada */}
      {waypoints.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Puntos de la ruta</h3>
          <div className="space-y-2">
            {waypoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{point.nombre}</div>
                    <div className="text-sm text-gray-600">
                      {point.latitud.toFixed(6)}, {point.longitud.toFixed(6)}
                    </div>
                    {point.distancia_desde_anterior && (
                      <div className="text-xs text-gray-500">
                        +{(point.distancia_desde_anterior / 1000).toFixed(2)} km
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openCameraForPoint(index)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Capturar imagen"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => editWaypoint(index)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeWaypoint(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de edición simplificado */}
      {showPointDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Editar punto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={editingPoint.nombre || ''}
                  onChange={(e) => setEditingPoint({ ...editingPoint, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nombre del punto"
                />
              </div>
              
              {!quickMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={editingPoint.descripcion || ''}
                    onChange={(e) => setEditingPoint({ ...editingPoint, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Descripción opcional"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de punto</label>
                <select
                  value={editingPoint.tipo_punto || 'waypoint'}
                  onChange={(e) => setEditingPoint({ ...editingPoint, tipo_punto: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="inicio">Inicio</option>
                  <option value="waypoint">Waypoint</option>
                  <option value="punto_interes">Punto de interés</option>
                  <option value="fin">Fin</option>
                </select>
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowPointDialog(false);
                    setEditingPoint({});
                    setSelectedPoint(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={saveWaypointEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de captura de cámara */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => {
          setShowCameraModal(false);
          setSelectedPointForCamera(null);
        }}
        proyectoId={proyectoId}
        puntoId={selectedPointForCamera !== null && waypoints[selectedPointForCamera]?.id ? waypoints[selectedPointForCamera].id : undefined}
        gpsData={selectedPointForCamera !== null ? {
          latitud: waypoints[selectedPointForCamera].latitud,
          longitud: waypoints[selectedPointForCamera].longitud,
          altitud: waypoints[selectedPointForCamera].altitud,
          precision: userLocation ? 10 : undefined
        } : undefined}
        onImageSaved={handleImageSaved}
      />
    </div>
  );
};

export default MapPlannerFixed;
