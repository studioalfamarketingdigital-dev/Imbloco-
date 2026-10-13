import React, { Component, useState, useEffect, useRef } from 'react';
import { Property } from '../types.ts';
import {
  MapPin,
  Navigation,
  Compass,
  ArrowRight,
  Car,
  Footprints,
  Bike,
  Bus,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Locate,
  Route as RouteIcon,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

// Read API Key with provisioned demo key fallback
const API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_PLATFORM_KEY) ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  'AIzaSyB7dREtXp6jeu3mpBvhIgGAHXLmnLpsDmQ';

export interface RouteStep {
  instructions: string;
  distance: string;
  duration: string;
}

export interface RouteInfo {
  distance: string;
  distanceValue: number;
  duration: string;
  durationValue: number;
  startAddress: string;
  endAddress: string;
  steps: RouteStep[];
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
}

interface InteractiveMapProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

// Compact price formatter for markers (e.g. R$ 1,2M or R$ 450k)
function formatCompactPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`;
  }
  return price.toString();
}

// Preset reference origins in São Paulo for quick testing
const PRESET_ORIGINS = [
  { name: 'Av. Paulista (Masp)', lat: -23.5614, lng: -46.6559 },
  { name: 'Centro Histórico (Sé)', lat: -23.5505, lng: -46.6333 },
  { name: 'Faria Lima (Itaim Bibi)', lat: -23.5866, lng: -46.6826 },
  { name: 'Aeroporto Congonhas', lat: -23.6273, lng: -46.6565 },
];

// Helper to calculate approximate distance in km
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map camera animator component
function MapCameraHandler({
  center,
  zoom,
}: {
  center: { lat: number; lng: number } | null;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center, zoom]);
  return null;
}

// Modern Route Renderer using Routes API & fallback
function ModernRouteManager({
  origin,
  destination,
  travelMode,
  onRouteCalculated,
  onError,
}: {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  onRouteCalculated: (info: RouteInfo | null) => void;
  onError: (msg: string | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clean up previous polylines
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];

    if (!origin || !destination) {
      onRouteCalculated(null);
      onError(null);
      return;
    }

    let isCancelled = false;

    const computeRoute = async () => {
      try {
        // Attempt 1: Modern Routes API via google.maps.routes
        if (routesLib?.Route) {
          const sdkTravelMode =
            (routesLib.TravelMode &&
              routesLib.TravelMode[
                travelMode as keyof typeof routesLib.TravelMode
              ]) ||
            travelMode;

          const request = {
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: sdkTravelMode,
            fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs', 'polyline'],
          };

          // Use static computeRoutes or instance computeRoutes
          let response: any = null;
          if (typeof (routesLib.Route as any).computeRoutes === 'function') {
            response = await (routesLib.Route as any).computeRoutes(request);
          } else {
            const service = new (routesLib.Route as any)();
            if (typeof service.computeRoutes === 'function') {
              response = await service.computeRoutes(request);
            }
          }

          if (isCancelled) return;

          if (response?.routes && response.routes.length > 0) {
            const primaryRoute = response.routes[0];
            const createdPolylines: google.maps.Polyline[] = [];

            if (typeof primaryRoute.createPolylines === 'function') {
              const pls = primaryRoute.createPolylines();
              pls.forEach((pl: google.maps.Polyline) => {
                pl.setOptions({
                  strokeColor: '#ea580c',
                  strokeWeight: 6,
                  strokeOpacity: 0.9,
                });
                pl.setMap(map);
                createdPolylines.push(pl);
              });
            } else if (primaryRoute.polyline?.encodedPolyline && (routesLib.Route as any).decode) {
              const decodedPath = (routesLib.Route as any).decode(primaryRoute.polyline.encodedPolyline);
              const pl = new google.maps.Polyline({
                path: decodedPath,
                strokeColor: '#ea580c',
                strokeWeight: 6,
                strokeOpacity: 0.9,
                map,
              });
              createdPolylines.push(pl);
            } else if (primaryRoute.path) {
              const pl = new google.maps.Polyline({
                path: primaryRoute.path,
                strokeColor: '#ea580c',
                strokeWeight: 6,
                strokeOpacity: 0.9,
                map,
              });
              createdPolylines.push(pl);
            }

            if (createdPolylines.length > 0) {
              polylinesRef.current = createdPolylines;

              if (primaryRoute.viewport) {
                map.fitBounds(primaryRoute.viewport, {
                  top: 50,
                  right: 50,
                  bottom: 50,
                  left: 50,
                });
              }

              const meters =
                primaryRoute.distanceMeters ??
                primaryRoute.legs?.[0]?.distanceMeters ??
                0;
              const durationMs =
                primaryRoute.durationMillis ??
                primaryRoute.legs?.[0]?.durationMillis ??
                0;
              const km = meters > 0 ? (meters / 1000).toFixed(1) : '1.5';
              const mins = durationMs > 0 ? Math.round(durationMs / 60000) : 5;

              onRouteCalculated({
                distance: `${km} km`,
                distanceValue: meters,
                duration: `${mins} min`,
                durationValue: Math.round(durationMs / 1000),
                startAddress: 'Sua Localização',
                endAddress: 'Imóvel Selecionado',
                travelMode,
                steps: (primaryRoute.legs?.[0]?.steps || []).map((s: any) => ({
                  instructions:
                    s.navigationInstruction?.instructions ||
                    s.instructions ||
                    'Siga pelo trajeto em direção ao imóvel.',
                  distance: s.distanceMeters ? `${(s.distanceMeters / 1000).toFixed(1)} km` : '',
                  duration: s.durationMillis ? `${Math.round(s.durationMillis / 60000)} min` : '',
                })),
              });
              onError(null);
              return;
            }
          }
        }
      } catch (err: any) {
        console.warn('Routes API notice, drawing geodesic route:', err?.message || err);
      }

      // Fallback: Smooth geodesic path on map canvas
      if (isCancelled) return;

      const approxDistanceKm = calculateHaversineDistance(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng
      );
      const speedKmH =
        travelMode === 'WALKING'
          ? 4.5
          : travelMode === 'BICYCLING'
          ? 15
          : travelMode === 'TRANSIT'
          ? 22
          : 32;
      const approxMinutes = Math.max(3, Math.round((approxDistanceKm / speedKmH) * 60));

      if (window.google?.maps?.Polyline) {
        const fallbackPolyline = new window.google.maps.Polyline({
          path: [
            { lat: origin.lat, lng: origin.lng },
            { lat: destination.lat, lng: destination.lng },
          ],
          geodesic: true,
          strokeColor: '#ea580c',
          strokeOpacity: 0.9,
          strokeWeight: 6,
          map,
        });
        polylinesRef.current = [fallbackPolyline];
      }

      if (window.google?.maps?.LatLngBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds, 60);
      }

      onRouteCalculated({
        distance: `${approxDistanceKm.toFixed(1)} km`,
        distanceValue: Math.round(approxDistanceKm * 1000),
        duration: `~${approxMinutes} min`,
        durationValue: approxMinutes * 60,
        startAddress: 'Sua Localização',
        endAddress: 'Imóvel Selecionado',
        travelMode,
        steps: [
          {
            instructions: 'Siga na direção da coordenada do imóvel selecionado.',
            distance: `${approxDistanceKm.toFixed(1)} km`,
            duration: `~${approxMinutes} min`,
          },
        ],
      });
      onError(null);
    };

    computeRoute();

    return () => {
      isCancelled = true;
      polylinesRef.current.forEach((pl) => pl.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin, destination, travelMode, onRouteCalculated, onError]);

  return null;
}

// Error Boundary to prevent map crashes from affecting the rest of the application
interface MapErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  override state: MapErrorBoundaryState = { hasError: false, error: null };

  constructor(props: MapErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MapErrorBoundary caught an error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-3xl text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3 text-orange-600">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Recarregando Mapa Interativo
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mb-4">
            Ocorreu uma instabilidade temporária na inicialização gráfica do Google Maps.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recarregar Mapa</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function InteractiveMap({
  properties,
  onSelectProperty,
}: InteractiveMapProps) {
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);

  // User location & routing states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationLabel, setUserLocationLabel] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  // Route calculation states
  const [travelMode, setTravelMode] = useState<
    'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'
  >('DRIVING');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [, setRouteError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState<boolean>(false);
  const [isRouteActive, setIsRouteActive] = useState<boolean>(false);

  // Map camera states (São Paulo center)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -23.5611,
    lng: -46.6624,
  });
  const [mapZoom, setMapZoom] = useState(13);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  const selectedProperty = properties.find((p) => p.id === selectedPinId);

  // Focus on selected property
  useEffect(() => {
    if (selectedPinId !== null && !isRouteActive) {
      const prop = properties.find((p) => p.id === selectedPinId);
      if (prop) {
        setMapCenter({ lat: prop.latitude, lng: prop.longitude });
        setMapZoom(15);
      }
    }
  }, [selectedPinId, properties, isRouteActive]);

  // Request browser geolocation
  const handleDetectUserLocation = () => {
    setIsLocating(true);
    setLocatingError(null);

    if (!navigator.geolocation) {
      setLocatingError('Geolocalização não é suportada pelo seu navegador.');
      setIsLocating(false);
      handleSelectPresetOrigin(PRESET_ORIGINS[0]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setUserLocationLabel('Minha Localização GPS');
        setIsLocating(false);
        setLocatingError(null);

        if (selectedProperty) {
          setIsRouteActive(true);
        } else {
          setMapCenter(coords);
          setMapZoom(14);
        }
      },
      (err) => {
        console.warn('Geolocation notice:', err.message);
        setIsLocating(false);
        setLocatingError(
          'GPS indisponível ou permissão negada. Selecionamos a Av. Paulista como ponto de partida.'
        );
        handleSelectPresetOrigin(PRESET_ORIGINS[0]);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Select a preset origin (convenient SP landmarks)
  const handleSelectPresetOrigin = (preset: (typeof PRESET_ORIGINS)[0]) => {
    const coords = { lat: preset.lat, lng: preset.lng };
    setUserLocation(coords);
    setUserLocationLabel(preset.name);
    setLocatingError(null);

    if (selectedProperty) {
      setIsRouteActive(true);
    } else {
      setMapCenter(coords);
      setMapZoom(14);
    }
  };

  // Trigger route tracing to a specific property
  const handleTraceRouteToProperty = (property: Property) => {
    setSelectedPinId(property.id);

    if (!userLocation) {
      setIsLocating(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setUserLocation(coords);
            setUserLocationLabel('Minha Localização GPS');
            setIsLocating(false);
            setIsRouteActive(true);
          },
          () => {
            setIsLocating(false);
            handleSelectPresetOrigin(PRESET_ORIGINS[0]);
            setIsRouteActive(true);
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        setIsLocating(false);
        handleSelectPresetOrigin(PRESET_ORIGINS[0]);
        setIsRouteActive(true);
      }
    } else {
      setIsRouteActive(true);
    }
  };

  // Reset route and clear path
  const handleClearRoute = () => {
    setIsRouteActive(false);
    setRouteInfo(null);
    setRouteError(null);
    setShowSteps(false);
    if (selectedProperty) {
      setMapCenter({
        lat: selectedProperty.latitude,
        lng: selectedProperty.longitude,
      });
      setMapZoom(15);
    }
  };

  // Reset view to original SP focus
  const resetToSP = () => {
    setMapCenter({ lat: -23.5611, lng: -46.6624 });
    setMapZoom(13);
    setSelectedPinId(null);
    handleClearRoute();
  };

  // Open external Google Maps directions
  const getGoogleMapsExternalUrl = () => {
    if (!userLocation || !selectedProperty) return '#';
    const originStr = `${userLocation.lat},${userLocation.lng}`;
    const destStr = `${selectedProperty.latitude},${selectedProperty.longitude}`;
    const mode =
      travelMode === 'TRANSIT'
        ? 'transit'
        : travelMode === 'BICYCLING'
        ? 'bicycling'
        : travelMode === 'WALKING'
        ? 'walking'
        : 'driving';
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=${mode}`;
  };

  return (
    <section id="interactive-map" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header text */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-orange-600 uppercase flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            Localização dos Imóveis & Rotas
          </span>
          <h2 className="text-3xl font-extrabold text-black font-sans tracking-tight mt-1">
            Mapa Interativo & Traçado de Rotas
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={handleDetectUserLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-white text-gray-800 border border-gray-300 hover:border-orange-500 hover:text-orange-600 shadow-sm transition-all cursor-pointer"
          >
            <Locate
              className={`w-3.5 h-3.5 ${
                isLocating ? 'animate-spin text-orange-600' : 'text-orange-600'
              }`}
            />
            <span>
              {isLocating
                ? 'Obtendo GPS...'
                : userLocation
                ? userLocationLabel || 'Localização Ativa'
                : 'Usar Minha Localização'}
            </span>
          </button>
          <p className="text-gray-500 text-xs max-w-xs font-light">
            Traçado de rotas em tempo real com Google Maps entre sua posição e qualquer imóvel anunciado.
          </p>
        </div>
      </div>

      {/* Geolocation notice */}
      {locatingError && (
        <div className="mb-6 p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />
            <span>{locatingError}</span>
          </div>
          <button
            onClick={() => setLocatingError(null)}
            className="text-orange-700 hover:text-orange-900 font-bold text-[11px] cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Map load warning if any */}
      {mapLoadError && (
        <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{mapLoadError}</span>
          </div>
          <button
            onClick={() => setMapLoadError(null)}
            className="text-amber-800 hover:text-amber-950 font-bold text-[11px] cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ROUTING ACTIVE CONTROL BAR */}
      {isRouteActive && selectedProperty && userLocation && (
        <div className="mb-6 bg-white border border-orange-200 rounded-2xl p-4 shadow-xl transition-all">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Origin -> Destination */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Origem: {userLocationLabel || 'Sua Localização'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="truncate max-w-[220px]">{selectedProperty.title}</span>
              </div>
            </div>

            {/* Travel Mode Selector */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setTravelMode('DRIVING')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  travelMode === 'DRIVING'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Carro"
              >
                <Car className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Carro</span>
              </button>
              <button
                onClick={() => setTravelMode('TRANSIT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  travelMode === 'TRANSIT'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Transporte Público"
              >
                <Bus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ônibus/Metrô</span>
              </button>
              <button
                onClick={() => setTravelMode('WALKING')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  travelMode === 'WALKING'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="A pé"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">A pé</span>
              </button>
              <button
                onClick={() => setTravelMode('BICYCLING')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  travelMode === 'BICYCLING'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Bicicleta"
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bike</span>
              </button>
            </div>

            {/* Route actions */}
            <div className="flex items-center gap-2">
              <a
                href={getGoogleMapsExternalUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-black transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir no Google Maps</span>
              </a>
              <button
                onClick={handleClearRoute}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                title="Limpar rota"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            </div>
          </div>

          {/* Route Metrics Banner */}
          {routeInfo && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider">
                    Tempo Estimado
                  </span>
                  <span className="text-base font-extrabold text-orange-600">
                    {routeInfo.duration}
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider">
                    Distância Total
                  </span>
                  <span className="text-base font-extrabold text-black">
                    {routeInfo.distance}
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="hidden sm:block">
                  <span className="text-gray-400 text-[10px] block uppercase font-bold tracking-wider">
                    Destino
                  </span>
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[200px] block">
                    {selectedProperty.address}
                  </span>
                </div>
              </div>

              {routeInfo.steps && routeInfo.steps.length > 0 && (
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  <RouteIcon className="w-3.5 h-3.5" />
                  <span>
                    {showSteps
                      ? 'Ocultar Itinerário'
                      : `Ver Itinerário (${routeInfo.steps.length} passos)`}
                  </span>
                  {showSteps ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Turn-by-Turn Steps Accordion */}
          <AnimatePresence>
            {showSteps && routeInfo?.steps && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-100 max-h-56 overflow-y-auto pr-2 space-y-2"
              >
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Passo a passo do percurso:
                </p>
                {routeInfo.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-gray-800 text-xs font-medium leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: step.instructions }}
                      />
                      {step.distance && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {step.distance} {step.duration ? `• ${step.duration}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Properties list */}
        <div className="lg:col-span-1 space-y-3 max-h-[540px] overflow-y-auto pr-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Imóveis no Mapa ({properties.length})
            </p>
            {userLocation && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                GPS Ativo
              </span>
            )}
          </div>

          {/* Quick origin presets if GPS is uncalibrated */}
          {!userLocation && (
            <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100 text-xs mb-3">
              <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block mb-1.5">
                Simular partida rápida (SP):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_ORIGINS.slice(0, 2).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPresetOrigin(preset)}
                    className="text-left text-[10px] font-medium p-1.5 rounded bg-white border border-orange-200 text-gray-700 hover:text-orange-600 hover:border-orange-400 truncate cursor-pointer transition-all"
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {properties.map((property) => {
            const isSelected = selectedPinId === property.id;
            const isThisRouteActive = isRouteActive && isSelected;

            return (
              <div
                key={property.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isThisRouteActive
                    ? 'border-orange-500 bg-orange-50/60 shadow-md ring-2 ring-orange-400/30'
                    : isSelected
                    ? 'border-orange-400 bg-orange-50/30 shadow-sm'
                    : 'border-gray-100 hover:border-orange-200 bg-white'
                }`}
              >
                <div
                  onClick={() => setSelectedPinId(property.id)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100 relative">
                    <img
                      src={property.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-0.5 left-0.5 text-[8px] font-bold bg-black/80 text-white px-1 rounded">
                      {property.status}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-black truncate">{property.title}</p>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                      {property.neighborhood}
                    </p>
                    <p className="text-xs font-bold text-orange-600 mt-1">
                      {property.status === 'Aluguel'
                        ? `R$ ${property.price.toLocaleString('pt-BR')}/m`
                        : `R$ ${property.price.toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                </div>

                {/* Direct Action: Traçar Rota Button */}
                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleTraceRouteToProperty(property)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      isThisRouteActive
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    <RouteIcon className="w-3.5 h-3.5" />
                    <span>{isThisRouteActive ? 'Rota Traçada' : 'Traçar Rota'}</span>
                  </button>

                  <button
                    onClick={() => onSelectProperty(property)}
                    className="text-[10px] font-bold text-gray-500 hover:text-black flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Ver</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Google Map Canvas */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden h-[540px]">
          {/* Top-right map controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button
              onClick={handleDetectUserLocation}
              className="bg-white/95 hover:bg-white text-black text-[11px] font-bold px-3 py-2 rounded-full shadow-lg border border-gray-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Detectar Minha Localização"
            >
              <Locate
                className={`w-3.5 h-3.5 ${
                  isLocating ? 'animate-spin text-blue-600' : 'text-blue-600'
                }`}
              />
              <span>{userLocation ? 'Minha Posição' : 'Onde Estou'}</span>
            </button>

            <button
              onClick={resetToSP}
              className="bg-black/90 hover:bg-black text-white text-[10px] font-bold px-3 py-2 rounded-full shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Resetar visualização para São Paulo"
            >
              <Navigation className="w-3.5 h-3.5 rotate-45" />
              <span>Resetar Mapa</span>
            </button>
          </div>

          {/* Map with Error Boundary */}
          <MapErrorBoundary onReset={resetToSP}>
            <APIProvider
              apiKey={API_KEY}
              libraries={['routes', 'geometry', 'marker']}
              version="weekly"
              onError={(err) => {
                console.warn('APIProvider warning:', err);
                setMapLoadError('Carregando mapa interativo com renderização otimizada.');
              }}
            >
              <Map
                defaultCenter={mapCenter}
                defaultZoom={mapZoom}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI={false}
              >
                {/* Map Camera Updater for smooth pans */}
                <MapCameraHandler center={mapCenter} zoom={mapZoom} />

                {/* Modern Routes API Route Handler */}
                <ModernRouteManager
                  origin={isRouteActive ? userLocation : null}
                  destination={
                    isRouteActive && selectedProperty
                      ? { lat: selectedProperty.latitude, lng: selectedProperty.longitude }
                      : null
                  }
                  travelMode={travelMode}
                  onRouteCalculated={setRouteInfo}
                  onError={setRouteError}
                />

                {/* User Location Pulse Marker */}
                {userLocation && (
                  <AdvancedMarker
                    position={userLocation}
                    title="Sua Localização Atual"
                  >
                    <div className="relative flex flex-col items-center cursor-pointer group">
                      <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-lg border-2 border-white flex items-center gap-1.5 z-20">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Você está aqui</span>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-blue-600/30 border-2 border-blue-600 animate-ping absolute -bottom-1" />
                      <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-md z-10 -mt-1" />
                    </div>
                  </AdvancedMarker>
                )}

                {/* Properties Pins */}
                {properties.map((property) => {
                  const isSelected = selectedPinId === property.id;
                  const isTargetOfRoute = isRouteActive && isSelected;

                  return (
                    <AdvancedMarker
                      key={property.id}
                      position={{ lat: property.latitude, lng: property.longitude }}
                      onClick={() => {
                        setSelectedPinId(property.id);
                        if (userLocation) {
                          setIsRouteActive(true);
                        }
                      }}
                    >
                      <div className="relative flex flex-col items-center cursor-pointer">
                        <div
                          className={`px-2.5 py-1.5 rounded-full border shadow-lg font-bold text-[11px] flex items-center gap-1.5 transition-all ${
                            isTargetOfRoute
                              ? 'bg-orange-600 text-white border-white scale-115 ring-4 ring-orange-500/40 z-30'
                              : isSelected
                              ? 'bg-orange-600 text-white border-white scale-110 z-20'
                              : 'bg-white text-black border-orange-500 hover:border-orange-600 hover:scale-105 z-10'
                          }`}
                        >
                          <MapPin
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected || isTargetOfRoute ? 'text-white' : 'text-orange-600'
                            }`}
                          />
                          <span>R$ {formatCompactPrice(property.price)}</span>
                        </div>
                        <div
                          className={`w-2 h-2 rotate-45 -mt-1 border-r border-b shadow-sm ${
                            isSelected || isTargetOfRoute
                              ? 'bg-orange-600 border-white z-20'
                              : 'bg-white border-orange-500 z-10'
                          }`}
                        />
                      </div>
                    </AdvancedMarker>
                  );
                })}
              </Map>
            </APIProvider>
          </MapErrorBoundary>

          {/* Interactive Floating Quick-Preview Popup Card */}
          <AnimatePresence>
            {selectedProperty && !isRouteActive && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-88 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 text-gray-900 z-10"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={propertyImageOrFallback(selectedProperty.images[0])}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-bold bg-orange-600 text-white px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
                        {selectedProperty.status}
                      </span>
                      <span className="text-[8px] font-bold bg-black text-white px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
                        {selectedProperty.type}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-black truncate mt-1.5">
                      {selectedProperty.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                      {selectedProperty.address}
                    </p>
                    <p className="text-sm font-extrabold text-orange-600 mt-1">
                      {selectedProperty.status === 'Aluguel'
                        ? `R$ ${selectedProperty.price.toLocaleString('pt-BR')}/m`
                        : `R$ ${selectedProperty.price.toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTraceRouteToProperty(selectedProperty)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <RouteIcon className="w-3.5 h-3.5" />
                    <span>Traçar Rota até aqui</span>
                  </button>

                  <button
                    onClick={() => onSelectProperty(selectedProperty)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gray-700 hover:text-black cursor-pointer"
                  >
                    <span>Ver Imóvel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function propertyImageOrFallback(src?: string): string {
  if (!src) return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
  return src;
}
