import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';

interface PuntoGrabacion {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
}

interface MapViewProps {
  puntos?: PuntoGrabacion[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (punto: PuntoGrabacion) => void;
}

const containerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: -3.4653, // Manaus, Brasil (ejemplo para soundscapes amazónicos)
  lng: -62.2159,
};

export default function MapView({ puntos = [], center, zoom = 10, onMarkerClick }: MapViewProps) {
  const googleMapsApiKey = 'AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk';
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
  });

  const [selectedPunto, setSelectedPunto] = useState<PuntoGrabacion | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const handleMarkerClick = (punto: PuntoGrabacion) => {
    setSelectedPunto(punto);
    if (onMarkerClick) {
      onMarkerClick(punto);
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error al cargar el mapa</p>
          <p className="text-sm text-gray-600">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center || defaultCenter}
        zoom={zoom}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {puntos.map((punto) => (
          <Marker
            key={punto.id}
            position={{ lat: punto.latitud, lng: punto.longitud }}
            onClick={() => handleMarkerClick(punto)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        ))}

        {selectedPunto && (
          <InfoWindow
            position={{ lat: selectedPunto.latitud, lng: selectedPunto.longitud }}
            onCloseClick={() => setSelectedPunto(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-gray-900 mb-1">
                {selectedPunto.nombre}
              </h3>
              {selectedPunto.descripcion && (
                <p className="text-sm text-gray-600">{selectedPunto.descripcion}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {selectedPunto.latitud.toFixed(6)}, {selectedPunto.longitud.toFixed(6)}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
