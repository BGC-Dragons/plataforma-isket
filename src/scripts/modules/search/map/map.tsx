import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
  DrawingManager,
  Polygon,
  Circle,
} from "@react-google-maps/api";
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  useTheme,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  Bed,
  DirectionsCar,
  SquareFoot,
  Edit,
  RadioButtonUnchecked,
  Stop,
  Delete,
  Gesture,
} from "@mui/icons-material";
import { GOOGLE_CONFIG } from "../../../config/google.constant";
import type { INeighborhoodFull } from "../../../../services/get-locations-neighborhoods.service";
import type { ICityFull } from "../../../../services/get-locations-cities.service";
import {
  postPropertyAdSearchMap,
  type IMapCluster,
  type IMapPoint,
} from "../../../../services/post-property-ad-search-map.service";
import { mapFiltersToSearchMap } from "../../../../services/helpers/map-filters-to-search-map.helper";
import type { ILocalFilterState } from "../../../../services/helpers/map-filters-to-api.helper";

// Interface para os dados das propriedades
interface PropertyData {
  id: string;
  title?: string;
  price: number;
  pricePerSquareMeter: number;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  images: string[];
  isFavorite?: boolean;
  // Coordenadas do mapa (mockadas para demonstração)
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface MapProps {
  properties?: PropertyData[]; // Opcional - se não fornecido, usa busca do mapa
  onPropertyClick?: (propertyId: string) => void;
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  height?: string | number;
  onDrawingComplete?: (
    overlay: google.maps.drawing.OverlayCompleteEvent
  ) => void;
  onClearFilters?: () => void;
  neighborhoods?: INeighborhoodFull[];
  selectedNeighborhoodNames?: string[];
  cities?: ICityFull[];
  selectedCityCodes?: string[];
  allNeighborhoodsForCityBounds?: INeighborhoodFull[]; // Todos os bairros para mostrar delimitação da cidade
  // Novas props para busca de mapa
  filters?: ILocalFilterState;
  cityToCodeMap?: Record<string, string>;
  token?: string;
  useMapSearch?: boolean; // Se true, usa busca do mapa ao invés de properties
  onNeighborhoodClick?: (neighborhood: INeighborhoodFull) => void; // Callback quando um bairro é clicado
}

// Configurações do mapa
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: -25.4284, // Curitiba
  lng: -49.2733,
};

const defaultZoom = 12;

// Helper function to validate coordinates
const isValidCoordinate = (
  coord: { lat: number; lng: number } | null | undefined
): boolean => {
  if (!coord) return false;
  const { lat, lng } = coord;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export function MapComponent({
  properties = [],
  onPropertyClick,
  center = defaultCenter,
  zoom = defaultZoom,
  height = 500,
  onDrawingComplete,
  onClearFilters,
  neighborhoods = [],
  selectedNeighborhoodNames = [],
  cities = [],
  selectedCityCodes = [],
  allNeighborhoodsForCityBounds = [],
  filters,
  cityToCodeMap = {},
  token: tokenProp,
  useMapSearch = true, // Por padrão usa busca do mapa
  onNeighborhoodClick,
}: MapProps) {
  // Fallback: pegar token do localStorage se não foi passado via props
  const token =
    tokenProp ||
    (typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null) ||
    undefined;
  const theme = useTheme();

  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(
    null
  );
  const [selectedCluster, setSelectedCluster] = useState<IMapCluster | null>(
    null
  );
  const [hoveredNeighborhood, setHoveredNeighborhood] =
    useState<INeighborhoodFull | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drawingMode, setDrawingMode] =
    useState<google.maps.drawing.OverlayType | null>(null);
  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager | null>(null);
  const [drawnOverlays, setDrawnOverlays] = useState<
    google.maps.drawing.OverlayCompleteEvent[]
  >([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [freehandActive, setFreehandActive] = useState<boolean>(false);
  const isMouseDownRef = useRef<boolean>(false);
  const freehandPolylineRef = useRef<google.maps.Polyline | null>(null);
  const mouseMoveListenerRef = useRef<google.maps.MapsEventListener | null>(
    null
  );
  const mouseDownListenerRef = useRef<google.maps.MapsEventListener | null>(
    null
  );
  const mouseUpListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Estados para busca do mapa
  const [mapClusters, setMapClusters] = useState<IMapCluster[]>([]);
  const [mapPoints, setMapPoints] = useState<IMapPoint[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  // Estados para informações de localização da resposta da API (quando há busca por endereço)
  const [addressCenter, setAddressCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [addressMarker, setAddressMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [addressZoom, setAddressZoom] = useState<number | null>(null);
  const [addressCircle, setAddressCircle] = useState<{
    center: { lat: number; lng: number };
    radius: number;
  } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef<string | undefined>(token);
  const fetchMapDataRef = useRef<
    | ((bounds: google.maps.LatLngBounds, zoomLevel: number) => Promise<void>)
    | null
  >(null);
  const lastSearchKeyRef = useRef<string | null>(null);
  const isAnimatingRef = useRef<boolean>(false);

  // Carrega o script do Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_CONFIG.MAPS_API_KEY,
    libraries: ["places", "drawing", "geometry"],
    id: "google-maps-script",
  });

  // Filtra propriedades com coordenadas válidas e valida as coordenadas
  const propertiesWithCoordinates = useMemo(() => {
    return properties
      .filter((property) => {
        // Apenas incluir propriedades com coordenadas válidas
        if (!property.coordinates) return false;
        const { lat, lng } = property.coordinates;
        // Validar que as coordenadas são números válidos e estão em ranges válidos
        return (
          typeof lat === "number" &&
          typeof lng === "number" &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        );
      })
      .map((property) => ({
        ...property,
        coordinates: property.coordinates!, // Já validado acima
      }));
  }, [properties]);

  // Refs para rastrear o centro e zoom anteriores
  const previousCenterRef = useRef<{ lat: number; lng: number } | undefined>(
    center
  );
  const previousZoomRef = useRef<number | undefined>(zoom);

  // Função para limitar bbox baseado no zoom
  const calculateLimitedBbox = useCallback(
    (
      viewportBounds: google.maps.LatLngBounds,
      zoomLevel: number
    ): [number, number, number, number] => {
      const ne = viewportBounds.getNorthEast();
      const sw = viewportBounds.getSouthWest();

      // Zoom alto (> 14): usar apenas viewport (área pequena)
      if (zoomLevel > 14) {
        return [sw.lng(), sw.lat(), ne.lng(), ne.lat()];
      }
      // Zoom médio (10-14): expandir um pouco o viewport
      if (zoomLevel >= 10) {
        const latDiff = ne.lat() - sw.lat();
        const lngDiff = ne.lng() - sw.lng();
        const expansion = 0.3; // 30% de expansão
        return [
          sw.lng() - lngDiff * expansion,
          sw.lat() - latDiff * expansion,
          ne.lng() + lngDiff * expansion,
          ne.lat() + latDiff * expansion,
        ];
      }
      // Zoom baixo (< 10): limitar a uma área muito pequena (não o país inteiro)
      const maxArea = 0.5; // ~0.5 graus de latitude/longitude (área bem limitada)
      const centerLat = (ne.lat() + sw.lat()) / 2;
      const centerLng = (ne.lng() + sw.lng()) / 2;
      return [
        centerLng - maxArea / 2,
        centerLat - maxArea / 2,
        centerLng + maxArea / 2,
        centerLat + maxArea / 2,
      ];
    },
    []
  );

  // Função para buscar propriedades no mapa
  const fetchMapData = useCallback(
    async (bounds: google.maps.LatLngBounds, zoomLevel: number) => {
      const currentToken = tokenRef.current;

      if (!useMapSearch) {
        return;
      }

      // API requer autenticação - verificar se token está disponível
      if (!currentToken) {
        return;
      }

      // Só fazer busca se houver pelo menos uma cidade selecionada
      if (!filters || !filters.cities || filters.cities.length === 0) {
        // Limpar dados do mapa se não há cidade selecionada
        setMapClusters([]);
        setMapPoints([]);
        return;
      }

      // Limpar timeout anterior
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce de 500ms para evitar muitas requisições
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Calcular bbox limitado baseado no zoom e cidade selecionada
          const bbox = calculateLimitedBbox(bounds, zoomLevel);

          // Verificar se já fizemos uma busca com os mesmos bounds e zoom
          const boundsKey = JSON.stringify(bbox);
          const filtersKey = filters
            ? JSON.stringify({
                cities: filters.cities?.sort(),
                neighborhoods: filters.neighborhoods?.sort(),
                venda: filters.venda,
                aluguel: filters.aluguel,
              })
            : "";
          const searchKey = `${boundsKey}-${zoomLevel}-${filtersKey}`;

          if (lastSearchKeyRef.current === searchKey) {
            return;
          }

          setMapLoading(true);

          // Atualizar ref para evitar buscas duplicadas
          lastSearchKeyRef.current = searchKey;

          // Mapear filtros para o formato da API
          const request = mapFiltersToSearchMap(
            filters,
            cityToCodeMap,
            bbox,
            zoomLevel
          );

          const response = await postPropertyAdSearchMap(request, currentToken);

          setMapClusters(response.data.clusters || []);
          setMapPoints(response.data.points || []);

          // Se a resposta contém informações de localização (busca por endereço), usar para centralizar o mapa
          if (response.data.center) {
            setAddressCenter(response.data.center);
          } else {
            setAddressCenter(null);
          }

          if (response.data.markerPosition) {
            setAddressMarker(response.data.markerPosition);
          } else {
            setAddressMarker(null);
          }

          if (response.data.zoom !== undefined) {
            setAddressZoom(response.data.zoom);
          } else {
            setAddressZoom(null);
          }

          // Processar geometry para desenhar círculo
          if (response.data.geometry && response.data.geometry.length > 0) {
            const circleGeometry = response.data.geometry.find(
              (g) => g.type === "circle"
            );
            if (circleGeometry) {
              // Extrair coordenadas - pode ser [lng, lat] ou [[lng, lat]]
              let coords: [number, number];
              if (Array.isArray(circleGeometry.coordinates[0])) {
                coords = circleGeometry.coordinates[0] as [number, number];
              } else {
                coords = circleGeometry.coordinates as [number, number];
              }

              // Converter raio de string para número (metros)
              const radiusStr = circleGeometry.radius || "1000";
              const radius =
                parseInt(radiusStr.replace(/[^0-9]/g, ""), 10) || 1000;

              setAddressCircle({
                center: { lat: coords[1], lng: coords[0] },
                radius,
              });
            } else {
              setAddressCircle(null);
            }
          } else {
            setAddressCircle(null);
          }
        } catch {
          setMapClusters([]);
          setMapPoints([]);
          // Limpar estados de endereço em caso de erro
          setAddressCenter(null);
          setAddressMarker(null);
          setAddressZoom(null);
          setAddressCircle(null);
        } finally {
          setMapLoading(false);
        }
      }, 300);
    },
    [useMapSearch, filters, cityToCodeMap, calculateLimitedBbox]
  );

  // Atualizar ref da função fetchMapData
  useEffect(() => {
    fetchMapDataRef.current = fetchMapData;
  }, [fetchMapData]);

  // Atualizar tokenRef quando token mudar
  useEffect(() => {
    const tokenValue = token || null;
    tokenRef.current = tokenValue || undefined;
  }, [token]);

  // Callback quando o mapa é carregado
  const onMapLoad = useCallback(
    (loadedMap: google.maps.Map) => {
      setMap(loadedMap);
      // Definir centro e zoom iniciais
      previousCenterRef.current = center;
      previousZoomRef.current = zoom;
      setCurrentZoom(zoom);

      // Obter bounds iniciais - usar setTimeout para garantir que o mapa está totalmente renderizado
      setTimeout(() => {
        // Não buscar dados iniciais aqui - deixar os listeners fazerem isso quando necessário
      }, 100);
    },
    [center, zoom]
  );

  // Efeito para adicionar listeners quando o mapa é carregado
  useEffect(() => {
    if (!map || !useMapSearch) {
      return;
    }

    let boundsChangedListener: google.maps.MapsEventListener | null = null;
    let zoomChangedListener: google.maps.MapsEventListener | null = null;

    // Listener para mudanças de bounds (pan) - só quando usuário interage
    boundsChangedListener = map.addListener("bounds_changed", () => {
      // Ignorar se estamos animando programaticamente
      if (isAnimatingRef.current) {
        return;
      }

      const newBounds = map.getBounds();
      if (!newBounds) return;

      const newZoom = map.getZoom() || zoom;
      const currentToken = tokenRef.current;

      // Atualizar estado
      setCurrentZoom(newZoom);

      // Só chamar fetchMapData se tiver token e useMapSearch ativo
      if (currentToken && useMapSearch && fetchMapDataRef.current) {
        fetchMapDataRef.current(newBounds, newZoom);
      }
    });

    // Listener para mudanças de zoom - só quando usuário interage
    zoomChangedListener = map.addListener("zoom_changed", () => {
      // Ignorar se estamos animando programaticamente
      if (isAnimatingRef.current) {
        const newZoom = map.getZoom() || zoom;
        setCurrentZoom(newZoom);
        return;
      }

      const newZoom = map.getZoom() || zoom;
      const newBounds = map.getBounds();
      if (!newBounds) return;

      const currentToken = tokenRef.current;

      setCurrentZoom(newZoom);

      // Só chamar fetchMapData se tiver token e useMapSearch ativo
      if (currentToken && useMapSearch && fetchMapDataRef.current) {
        fetchMapDataRef.current(newBounds, newZoom);
      }
    });

    // Cleanup listeners quando componente desmontar ou dependências mudarem
    return () => {
      if (boundsChangedListener) {
        google.maps.event.removeListener(boundsChangedListener);
      }
      if (zoomChangedListener) {
        google.maps.event.removeListener(zoomChangedListener);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [map, useMapSearch, zoom]);

  // Criar uma chave serializada dos filtros relevantes para comparação
  const filtersKey = useMemo(() => {
    if (!filters) return "";
    // Serializar apenas os campos principais que afetam a busca
    return JSON.stringify({
      cities: filters.cities?.sort(), // Ordenar para comparação consistente
      neighborhoods: filters.neighborhoods?.sort(),
      search: filters.search,
      venda: filters.venda,
      aluguel: filters.aluguel,
      residencial: filters.residencial,
      comercial: filters.comercial,
      industrial: filters.industrial,
      agricultura: filters.agricultura,
      quartos: filters.quartos,
      banheiros: filters.banheiros,
      suites: filters.suites,
      garagem: filters.garagem,
      area_min: filters.area_min,
      area_max: filters.area_max,
      preco_min: filters.preco_min,
      preco_max: filters.preco_max,
    });
  }, [filters]);

  // Efeito para buscar quando filtros mudarem (especialmente cidades)
  useEffect(() => {
    if (!map || !useMapSearch || !token || !fetchMapDataRef.current) return;

    // Limpar ref para forçar nova busca mesmo com os mesmos bounds quando filtros mudarem
    lastSearchKeyRef.current = null;

    // Obter bounds atuais do mapa
    const bounds = map.getBounds();
    if (!bounds) return;

    // Fazer busca única quando filtros mudarem
    const newZoom = map.getZoom() || zoom;
    fetchMapDataRef.current(bounds, newZoom);
  }, [filtersKey, map, useMapSearch, token, zoom]);

  // Efeito para animar o mapa quando center ou zoom mudarem
  useEffect(() => {
    if (!map || !center || zoom === undefined) return;

    // Validar coordenadas antes de usar
    if (!isValidCoordinate(center)) {
      console.warn("Invalid center coordinates:", center);
      return;
    }

    // Verificar se o centro ou zoom realmente mudaram
    const centerChanged =
      !previousCenterRef.current ||
      previousCenterRef.current.lat !== center.lat ||
      previousCenterRef.current.lng !== center.lng;

    const zoomChanged = previousZoomRef.current !== zoom;

    // Se não houve mudança, não fazer nada
    if (!centerChanged && !zoomChanged) return;

    // Se há cidades selecionadas, usar fitBounds com as coordenadas das cidades
    // Caso contrário, usar panTo/setZoom diretamente
    const hasSelectedCities = cities.length > 0 && selectedCityCodes.length > 0;
    const hasSelectedNeighborhoods =
      neighborhoods.length > 0 && selectedNeighborhoodNames.length > 0;

    // Coletar coordenadas de bairros e cidades para fitBounds
    const allCoordinates: google.maps.LatLng[] = [];

    // Adicionar coordenadas dos bairros selecionados
    const neighborhoodsToFit = neighborhoods.filter(
      (neighborhood) =>
        selectedNeighborhoodNames.length === 0 ||
        selectedNeighborhoodNames.includes(neighborhood.name)
    );

    neighborhoodsToFit.forEach((neighborhood) => {
      const coords = neighborhood.geo?.coordinates?.[0];
      if (coords && Array.isArray(coords) && coords.length > 0) {
        coords.forEach((coord) => {
          if (
            Array.isArray(coord) &&
            coord.length >= 2 &&
            typeof coord[0] === "number" &&
            typeof coord[1] === "number"
          ) {
            try {
              allCoordinates.push(
                new google.maps.LatLng(coord[1], coord[0]) // lat, lng
              );
            } catch {
              // Ignorar coordenadas inválidas
            }
          }
        });
      }
    });

    // Adicionar coordenadas das cidades selecionadas
    const citiesToFit = cities.filter(
      (city) =>
        selectedCityCodes.length === 0 ||
        selectedCityCodes.includes(city.cityStateCode)
    );

    citiesToFit.forEach((city) => {
      if (!city.geo?.geometry) return;

      const geometry = city.geo.geometry;
      if (geometry.type === "Polygon") {
        const coords = geometry.coordinates as number[][][];
        if (coords && coords[0] && Array.isArray(coords[0])) {
          coords[0].forEach((coord) => {
            if (
              Array.isArray(coord) &&
              coord.length >= 2 &&
              typeof coord[0] === "number" &&
              typeof coord[1] === "number"
            ) {
              try {
                allCoordinates.push(
                  new google.maps.LatLng(coord[1], coord[0]) // lat, lng
                );
              } catch {
                // Ignorar coordenadas inválidas
              }
            }
          });
        }
      } else if (geometry.type === "MultiPolygon") {
        const coords = geometry.coordinates as number[][][][];
        if (
          coords &&
          coords[0] &&
          coords[0][0] &&
          Array.isArray(coords[0][0])
        ) {
          coords[0][0].forEach((coord) => {
            if (
              Array.isArray(coord) &&
              coord.length >= 2 &&
              typeof coord[0] === "number" &&
              typeof coord[1] === "number"
            ) {
              try {
                allCoordinates.push(
                  new google.maps.LatLng(coord[1], coord[0]) // lat, lng
                );
              } catch {
                // Ignorar coordenadas inválidas
              }
            }
          });
        }
      }
    });

    // Se há coordenadas de cidades/bairros, usar fitBounds
    // EXCETO quando for busca apenas por cidade (sem bairros) - nesse caso usar zoom calculado
    const isCityOnlySearch = hasSelectedCities && !hasSelectedNeighborhoods;

    if (allCoordinates.length > 0 && !isCityOnlySearch) {
      // Quando há bairros selecionados, usar fitBounds para mostrar todos os bairros
      try {
        const bounds = new google.maps.LatLngBounds();
        allCoordinates.forEach((coord) => {
          if (coord) {
            const lat =
              typeof coord.lat === "function" ? coord.lat() : coord.lat;
            const lng =
              typeof coord.lng === "function" ? coord.lng() : coord.lng;
            if (
              typeof lat === "number" &&
              typeof lng === "number" &&
              !isNaN(lat) &&
              !isNaN(lng) &&
              lat >= -90 &&
              lat <= 90 &&
              lng >= -180 &&
              lng <= 180
            ) {
              bounds.extend(coord);
            }
          }
        });

        if (bounds && bounds.getNorthEast() && bounds.getSouthWest()) {
          isAnimatingRef.current = true;
          map.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          });
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 500);
          previousCenterRef.current = center;
          previousZoomRef.current = zoom;
          return;
        }
      } catch {
        // Fallback para panTo
      }
    }

    // Se não há coordenadas ou fitBounds falhou, usar panTo e setZoom diretamente
    // SEMPRE garantir que o mapa se move quando center muda
    isAnimatingRef.current = true;

    try {
      if (centerChanged && zoomChanged) {
        // Validar novamente antes de usar (defesa em profundidade)
        if (isValidCoordinate(center)) {
          map.panTo(new google.maps.LatLng(center.lat, center.lng));
          setTimeout(() => {
            if (map) {
              map.setZoom(zoom);
            }
            setTimeout(() => {
              isAnimatingRef.current = false;
            }, 500);
          }, 100);
        } else {
          isAnimatingRef.current = false;
        }
      } else if (centerChanged) {
        // Validar novamente antes de usar (defesa em profundidade)
        if (isValidCoordinate(center)) {
          map.panTo(new google.maps.LatLng(center.lat, center.lng));
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 500);
        } else {
          isAnimatingRef.current = false;
        }
      } else if (zoomChanged) {
        map.setZoom(zoom);
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 500);
      }
    } catch (error) {
      console.error("Error panning/zooming map:", error);
      isAnimatingRef.current = false;
    }

    // Atualizar refs
    previousCenterRef.current = center;
    previousZoomRef.current = zoom;
  }, [
    map,
    center,
    zoom,
    neighborhoods,
    selectedNeighborhoodNames,
    cities,
    selectedCityCodes,
  ]);

  // Callback quando o mapa é clicado
  const onMapClick = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  // Função para calcular o centro e bounds de um bairro
  const calculateNeighborhoodBounds = useCallback(
    (neighborhood: INeighborhoodFull) => {
      const coords = neighborhood.geo?.coordinates?.[0];
      if (!coords || coords.length === 0) return null;

      const paths = coords.map((coord) => ({
        lat: coord[1],
        lng: coord[0],
      }));

      const lats = paths.map((p) => p.lat);
      const lngs = paths.map((p) => p.lng);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const center = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      };

      return { paths, center, bounds: { minLat, maxLat, minLng, maxLng } };
    },
    []
  );

  // Ref para armazenar o overlay usado para calcular posição do tooltip
  const tooltipOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const tooltipMouseMoveListenerRef =
    useRef<google.maps.MapsEventListener | null>(null);

  // Inicializar overlay para calcular posição do tooltip
  useEffect(() => {
    if (!map || tooltipOverlayRef.current) return;

    const overlay = new google.maps.OverlayView();
    overlay.draw = function () {};
    overlay.setMap(map);
    tooltipOverlayRef.current = overlay;

    return () => {
      if (tooltipOverlayRef.current) {
        tooltipOverlayRef.current.setMap(null);
        tooltipOverlayRef.current = null;
      }
    };
  }, [map]);

  // Handler para quando o mouse entra em um bairro
  const handleNeighborhoodMouseOver = useCallback(
    (neighborhood: INeighborhoodFull, event: google.maps.PolyMouseEvent) => {
      if (!map || !event.latLng) return;

      setHoveredNeighborhood(neighborhood);

      const overlay = tooltipOverlayRef.current;
      if (!overlay) return;

      // Função para calcular e atualizar posição
      const updateTooltipPosition = () => {
        try {
          const projection = overlay.getProjection();
          if (!projection || !event.latLng) return;

          const point = projection.fromLatLngToContainerPixel(event.latLng);
          if (!point) return;

          const mapDiv = map.getDiv();
          const rect = mapDiv.getBoundingClientRect();

          setTooltipPosition({
            x: point.x + rect.left,
            y: point.y + rect.top - 10, // Offset para aparecer acima do cursor
          });
        } catch {
          // Se falhar, tentar novamente no próximo frame
          setTimeout(updateTooltipPosition, 0);
        }
      };

      // Adicionar listener de mousemove para atualizar posição do tooltip
      if (tooltipMouseMoveListenerRef.current) {
        google.maps.event.removeListener(tooltipMouseMoveListenerRef.current);
      }

      tooltipMouseMoveListenerRef.current = google.maps.event.addListener(
        map,
        "mousemove",
        (e: google.maps.MapMouseEvent) => {
          if (!overlay || !e.latLng) return;

          try {
            const projection = overlay.getProjection();
            if (!projection) return;

            const point = projection.fromLatLngToContainerPixel(e.latLng);
            if (!point) return;

            const mapDiv = map.getDiv();
            const rect = mapDiv.getBoundingClientRect();

            setTooltipPosition({
              x: point.x + rect.left,
              y: point.y + rect.top - 10,
            });
          } catch {
            // Ignorar erros
          }
        }
      );

      // Calcular posição inicial
      updateTooltipPosition();
    },
    [map]
  );

  // Handler para quando o mouse sai de um bairro
  const handleNeighborhoodMouseOut = useCallback(() => {
    setHoveredNeighborhood(null);
    setTooltipPosition(null);

    // Remover listener de mousemove
    if (tooltipMouseMoveListenerRef.current) {
      google.maps.event.removeListener(tooltipMouseMoveListenerRef.current);
      tooltipMouseMoveListenerRef.current = null;
    }
  }, []);

  // Handler para quando um bairro é clicado
  const handleNeighborhoodClick = useCallback(
    (neighborhood: INeighborhoodFull) => {
      if (!map || !onNeighborhoodClick) return;

      const boundsData = calculateNeighborhoodBounds(neighborhood);
      if (!boundsData) return;

      // Fazer zoom no bairro
      try {
        const bounds = new google.maps.LatLngBounds();
        boundsData.paths.forEach((path) => {
          // Validar coordenadas antes de adicionar ao bounds
          if (isValidCoordinate(path)) {
            bounds.extend(new google.maps.LatLng(path.lat, path.lng));
          }
        });

        if (bounds && bounds.getNorthEast() && bounds.getSouthWest()) {
          map.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          });
        }
      } catch (error) {
        console.error("Error fitting bounds to neighborhood:", error);
      }

      // Chamar callback para atualizar filtros
      onNeighborhoodClick(neighborhood);
    },
    [map, onNeighborhoodClick, calculateNeighborhoodBounds]
  );

  // Callbacks para o DrawingManager
  const onDrawingCompleteCallback = useCallback(
    (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      setDrawnOverlays((prev) => [...prev, overlay]);
      if (onDrawingComplete) {
        onDrawingComplete(overlay);
      }
      setDrawingMode(null);
    },
    [onDrawingComplete]
  );

  // -------- Freehand drawing (desenho à mão livre) ---------
  const teardownFreehandListeners = useCallback(() => {
    mouseMoveListenerRef.current?.remove();
    mouseDownListenerRef.current?.remove();
    mouseUpListenerRef.current?.remove();
    mouseMoveListenerRef.current = null;
    mouseDownListenerRef.current = null;
    mouseUpListenerRef.current = null;
  }, []);

  const stopFreehand = useCallback(() => {
    setFreehandActive(false);
    isMouseDownRef.current = false;
    teardownFreehandListeners();
    if (map) {
      map.setOptions({ draggable: true });
      map.setOptions({ draggableCursor: undefined });
    }
  }, [map, teardownFreehandListeners]);

  const startFreehand = useCallback(() => {
    if (!map) return;
    setDrawingMode(null);
    drawingManager?.setDrawingMode(null);
    setFreehandActive(true);

    map.setOptions({ draggable: false });
    map.setOptions({ draggableCursor: "crosshair" });

    mouseDownListenerRef.current = map.addListener(
      "mousedown",
      (e: google.maps.MapMouseEvent) => {
        isMouseDownRef.current = true;
        // Inicia um novo traço
        if (freehandPolylineRef.current) {
          freehandPolylineRef.current.setMap(null);
          freehandPolylineRef.current = null;
        }
        freehandPolylineRef.current = new google.maps.Polyline({
          map,
          clickable: false,
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });
        const path = freehandPolylineRef.current.getPath();
        if (e.latLng) path.push(e.latLng);
      }
    );

    mouseMoveListenerRef.current = map.addListener(
      "mousemove",
      (e: google.maps.MapMouseEvent) => {
        if (!isMouseDownRef.current || !freehandPolylineRef.current) return;
        const path = freehandPolylineRef.current.getPath();
        if (e.latLng) path.push(e.latLng);
      }
    );

    mouseUpListenerRef.current = map.addListener("mouseup", () => {
      if (!freehandPolylineRef.current) return;
      isMouseDownRef.current = false;
      // Converte o polyline para polygon
      const path = freehandPolylineRef.current.getPath();
      const polygon = new google.maps.Polygon({
        map,
        paths: path,
        fillColor: "#4285F4",
        fillOpacity: 0.2,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: true,
      });
      freehandPolylineRef.current.setMap(null);
      freehandPolylineRef.current = null;

      // Emula OverlayCompleteEvent para manter fluxo existente
      const fakeEvent = {
        type: google.maps.drawing.OverlayType.POLYGON,
        overlay: polygon,
      } as unknown as google.maps.drawing.OverlayCompleteEvent;

      setDrawnOverlays((prev) => [...prev, fakeEvent]);
      if (onDrawingComplete) onDrawingComplete(fakeEvent);
      setDrawingMode(null);
      // Mantém modo freehand ativo até usuário desativar no botão
    });
  }, [map, drawingManager, onDrawingComplete]);

  const toggleFreehand = useCallback(() => {
    if (freehandActive) {
      stopFreehand();
    } else {
      startFreehand();
    }
  }, [freehandActive, startFreehand, stopFreehand]);

  // Função para parar de desenhar
  const stopDrawing = () => {
    setDrawingMode(null);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    if (freehandActive) {
      stopFreehand();
    }
  };

  // Função para limpar todos os desenhos
  const clearAllDrawings = () => {
    drawnOverlays.forEach((overlay) => {
      if (overlay.overlay) {
        try {
          // Verificar se o overlay tem o método setMap antes de usar
          if (typeof overlay.overlay.setMap === "function") {
            overlay.overlay.setMap(null);
          } else {
            // Alguns overlays podem ter método remove ao invés de setMap
            // Usar type assertion para acessar método remove se existir
            const overlayWithRemove = overlay.overlay as unknown as {
              remove?: () => void;
            };
            if (typeof overlayWithRemove.remove === "function") {
              overlayWithRemove.remove();
            }
          }
        } catch (error) {
          console.warn("Error removing overlay:", error);
        }
      }
    });
    setDrawnOverlays([]);
    setDrawingMode(null);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    if (freehandActive) {
      stopFreehand();
    }

    // Limpar filtros para mostrar todas as propriedades
    if (onClearFilters) {
      onClearFilters();
    }
  };

  // Função para definir modo de desenho
  const setDrawingModeHandler = (
    mode: google.maps.drawing.OverlayType | null
  ) => {
    if (freehandActive) {
      stopFreehand();
    }
    setDrawingMode(mode);

    // Aguardar um pouco para garantir que o drawingManager foi carregado
    setTimeout(() => {
      if (drawingManager) {
        drawingManager.setDrawingMode(mode);
      }
    }, 100);
  };

  // Callback quando um marcador é clicado
  const onMarkerClick = useCallback((property: PropertyData) => {
    setSelectedProperty(property);
    setSelectedCluster(null);
  }, []);

  // Callback quando um cluster é clicado
  const onClusterClick = useCallback(
    (cluster: IMapCluster) => {
      // Fechar o InfoWindow imediatamente
      setSelectedCluster(null);
      setSelectedProperty(null);

      // Fazer zoom no cluster e depois buscar novamente para expandir
      if (map) {
        isAnimatingRef.current = true;
        const newZoom = Math.min(currentZoom + 2, 18);

        map.setCenter({
          lat: cluster.coordinates[1],
          lng: cluster.coordinates[0],
        });
        map.setZoom(newZoom);

        // Após a animação terminar, fazer nova busca para expandir o cluster
        setTimeout(() => {
          isAnimatingRef.current = false;

          // Limpar cache para forçar nova busca
          lastSearchKeyRef.current = null;

          // Obter novos bounds após o zoom
          const newBounds = map.getBounds();
          if (newBounds && fetchMapDataRef.current) {
            const finalZoom = map.getZoom() || newZoom;
            fetchMapDataRef.current(newBounds, finalZoom);
          }
        }, 600); // Tempo suficiente para a animação terminar
      }
    },
    [map, currentZoom]
  );

  // Callback quando um point do mapa é clicado
  const onMapPointClick = useCallback(
    (point: IMapPoint) => {
      setSelectedCluster(null);
      // Converter point para PropertyData para InfoWindow
      const propertyData: PropertyData = {
        id: point.id,
        title: undefined,
        price: point.price || 0,
        pricePerSquareMeter:
          point.price && point.areaTotal ? point.price / point.areaTotal : 0,
        address: "",
        city: "",
        state: "",
        propertyType: "RESIDENCIAL", // Default, pode ser melhorado
        bedrooms: point.rooms || undefined,
        bathrooms: point.bathrooms || undefined,
        area: point.areaTotal || 0,
        images: point.firstImageUrl ? [point.firstImageUrl] : [],
        coordinates: {
          lat: point.coordinates[1],
          lng: point.coordinates[0],
        },
      };
      setSelectedProperty(propertyData);
      onPropertyClick?.(point.id);
    },
    [onPropertyClick]
  );

  // Callback para fechar o InfoWindow
  const onInfoWindowClose = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  // Função para obter a cor do tipo de propriedade
  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case "COMERCIAL":
        return theme.palette.error.main;
      case "RESIDENCIAL":
        return theme.palette.primary.main;
      case "TERRENO":
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Função para obter a cor dos ícones conforme o tipo de propriedade
  const getIconColor = (type: string) => {
    switch (type) {
      case "COMERCIAL":
        return theme.palette.error.main;
      case "RESIDENCIAL":
        return theme.palette.primary.main;
      case "TERRENO":
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Função para formatar preço por m²
  const formatPricePerSquareMeter = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Calcular center e zoom a serem usados
  // Prioridade: 1) addressCenter/addressZoom da resposta da API (searchMap), 2) center/zoom das props (search normal)
  const mapCenter = useMemo(() => {
    return addressCenter || center;
  }, [addressCenter, center]);

  const mapZoom = useMemo(() => {
    return addressZoom !== null ? addressZoom : zoom;
  }, [addressZoom, zoom]);

  // Efeito para centralizar o mapa quando há informações de endereço
  // Pode vir da resposta da API (searchMap) ou das props (search normal)
  useEffect(() => {
    if (map) {
      // Priorizar addressCenter/addressZoom da resposta da API (searchMap)
      if (addressCenter && addressZoom !== null) {
        // Validar coordenadas antes de usar
        if (!isValidCoordinate(addressCenter)) {
          console.warn("Invalid addressCenter coordinates:", addressCenter);
          return;
        }

        try {
          // Marcar que estamos animando para evitar que os listeners disparem
          isAnimatingRef.current = true;

          map.panTo(
            new google.maps.LatLng(addressCenter.lat, addressCenter.lng)
          );
          map.setZoom(addressZoom);

          // Resetar flag após animação
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 1000);
        } catch (error) {
          console.error("Error panning to addressCenter:", error);
          isAnimatingRef.current = false;
        }
      }
      // Se não há addressCenter da API mas há center/zoom das props e há busca por endereço nos filtros
      else if (filters?.addressCoordinates && center && zoom) {
        // Validar coordenadas antes de usar
        if (!isValidCoordinate(center)) {
          console.warn("Invalid center coordinates:", center);
          return;
        }

        try {
          // Verificar se o centro atual é diferente do centro desejado
          const currentCenter = map.getCenter();
          const targetCenter = new google.maps.LatLng(center.lat, center.lng);
          const currentZoom = map.getZoom() || zoom;

          // Só centralizar se o centro ou zoom forem diferentes
          if (
            !currentCenter ||
            Math.abs(currentCenter.lat() - center.lat) > 0.0001 ||
            Math.abs(currentCenter.lng() - center.lng) > 0.0001 ||
            Math.abs(currentZoom - zoom) > 0.5
          ) {
            // Marcar que estamos animando para evitar que os listeners disparem
            isAnimatingRef.current = true;

            map.panTo(targetCenter);
            map.setZoom(zoom);

            // Resetar flag após animação
            setTimeout(() => {
              isAnimatingRef.current = false;
            }, 1000);
          }
        } catch (error) {
          console.error("Error panning to center:", error);
          isAnimatingRef.current = false;
        }
      }
    }
  }, [
    map,
    addressCenter,
    addressZoom,
    filters?.addressCoordinates,
    center,
    zoom,
  ]);

  // Limpar estados de endereço quando não há mais busca por endereço nos filtros
  useEffect(() => {
    if (filters && !filters.search && !filters.addressCoordinates) {
      setAddressCenter(null);
      setAddressMarker(null);
      setAddressZoom(null);
      setAddressCircle(null);
    }
  }, [filters]);

  // Se houver erro ao carregar o mapa
  if (loadError) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.grey[100],
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" color="error">
          Erro ao carregar o mapa
        </Typography>
      </Box>
    );
  }

  // Se o mapa ainda não foi carregado
  if (!isLoaded) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.grey[100],
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Carregando mapa...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height,
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        position: "relative",
      }}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy", // Permite zoom com scroll sem precisar de Ctrl
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {/* DrawingManager - Sempre ativo */}
        <DrawingManager
          onOverlayComplete={onDrawingCompleteCallback}
          onLoad={(manager) => {
            setDrawingManager(manager);
          }}
          options={{
            drawingControl: false, // Desabilitar controles padrão
            drawingMode: drawingMode, // Usar o modo atual
            polygonOptions: {
              fillColor: "#4285F4",
              fillOpacity: 0.2,
              strokeColor: "#4285F4",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: true,
              editable: true,
              draggable: true,
            },
            circleOptions: {
              fillColor: "#4285F4",
              fillOpacity: 0.2,
              strokeColor: "#4285F4",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: true,
              editable: true,
              draggable: true,
            },
            // Retângulo foi substituído por desenho livre
          }}
        />

        {/* Polígonos dos bairros - mostrar todos os bairros disponíveis */}
        {/* Usar allNeighborhoodsForCityBounds como fonte principal (sempre tem todos os bairros) */}
        {/* Se não houver, usar neighborhoods como fallback */}
        {(() => {
          // Priorizar allNeighborhoodsForCityBounds (sempre tem todos os bairros)
          // Se não houver, usar neighborhoods como fallback
          const neighborhoodsToShow =
            allNeighborhoodsForCityBounds.length > 0
              ? allNeighborhoodsForCityBounds
              : neighborhoods;

          const allNeighborhoods = neighborhoodsToShow;

          return allNeighborhoods.map((neighborhood) => {
            // Converter coordenadas GeoJSON para formato do Google Maps
            // GeoJSON usa [lon, lat], Google Maps usa {lat, lng}
            const paths =
              neighborhood.geo?.coordinates?.[0]?.map((coord) => ({
                lat: coord[1], // latitude
                lng: coord[0], // longitude
              })) || [];

            if (paths.length === 0) return null;

            // Verificar se o bairro está selecionado
            const isSelected = selectedNeighborhoodNames.includes(
              neighborhood.name
            );

            // Desabilitar cliques e hovers quando um modo de desenho estiver ativo
            const isDrawingActive = drawingMode !== null || freehandActive;

            return (
              <Polygon
                key={neighborhood.id}
                paths={paths}
                options={{
                  fillColor: theme.palette.primary.main,
                  fillOpacity: isSelected ? 0.3 : 0.15, // Mais opaco se selecionado
                  strokeColor: theme.palette.primary.main,
                  strokeOpacity: isSelected ? 1 : 0.8, // Mais visível se selecionado
                  strokeWeight: isSelected ? 3 : 2, // Mais espesso se selecionado
                  clickable: !isDrawingActive, // Desabilitar cliques quando desenhando
                  editable: false,
                  draggable: false,
                  zIndex: isSelected ? 2 : 1, // Bairros selecionados ficam na frente
                }}
                onMouseOver={
                  !isDrawingActive
                    ? (e) => handleNeighborhoodMouseOver(neighborhood, e)
                    : undefined
                }
                onMouseOut={
                  !isDrawingActive ? handleNeighborhoodMouseOut : undefined
                }
                onClick={
                  !isDrawingActive
                    ? () => handleNeighborhoodClick(neighborhood)
                    : undefined
                }
              />
            );
          });
        })()}

        {/* Círculo e marcador do endereço (quando há busca por endereço) */}
        {addressCircle && (
          <Circle
            center={addressCircle.center}
            radius={addressCircle.radius}
            options={{
              fillColor: theme.palette.primary.main,
              fillOpacity: 0.15,
              strokeColor: theme.palette.primary.main,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: false,
              zIndex: 5,
            }}
          />
        )}
        {addressMarker && (
          <Marker
            position={addressMarker}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 0C8.954 0 0 8.954 0 20c0 20 20 30 20 30s20-10 20-30C40 8.954 31.046 0 20 0z" fill="${theme.palette.error.main}"/>
                  <circle cx="20" cy="20" r="8" fill="white"/>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(40, 50),
              anchor: new google.maps.Point(20, 50),
            }}
            zIndex={15}
          />
        )}

        {/* Clusters do mapa */}
        {useMapSearch &&
          mapClusters.map((cluster) => (
            <Marker
              key={`cluster-${cluster.clusterId}`}
              position={{
                lat: cluster.coordinates[1],
                lng: cluster.coordinates[0],
              }}
              onClick={() => onClusterClick(cluster)}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="25" cy="25" r="20" fill="${theme.palette.primary.main}" stroke="white" stroke-width="3"/>
                  <text x="25" y="25" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="14" font-weight="bold" fill="white">${cluster.count}</text>
                </svg>
              `)}`,
                scaledSize: new google.maps.Size(50, 50),
                anchor: new google.maps.Point(25, 25),
              }}
              zIndex={10}
            />
          ))}

        {/* Points individuais do mapa */}
        {useMapSearch &&
          mapPoints.map((point) => (
            <Marker
              key={`point-${point.id}`}
              position={{
                lat: point.coordinates[1],
                lng: point.coordinates[0],
              }}
              onClick={() => onMapPointClick(point)}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24c0-8.837-7.163-16-16-16z" fill="${theme.palette.primary.main}"/>
                  <circle cx="16" cy="16" r="8" fill="white"/>
                </svg>
              `)}`,
                scaledSize: new google.maps.Size(32, 40),
                anchor: new google.maps.Point(16, 40),
              }}
              zIndex={5}
            />
          ))}

        {/* Marcadores das propriedades (modo legado - quando useMapSearch é false) */}
        {!useMapSearch &&
          propertiesWithCoordinates.map((property) => (
            <Marker
              key={property.id}
              position={property.coordinates!}
              onClick={() => onMarkerClick(property)}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24c0-8.837-7.163-16-16-16z" fill="${getPropertyTypeColor(
                    property.propertyType
                  )}"/>
                  <circle cx="16" cy="16" r="8" fill="white"/>
                  <text x="16" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${getPropertyTypeColor(
                    property.propertyType
                  )}">${property.propertyType.charAt(0)}</text>
                </svg>
              `)}`,
                scaledSize: new google.maps.Size(32, 40),
                anchor: new google.maps.Point(16, 40),
              }}
            />
          ))}

        {/* InfoWindow para cluster selecionado */}
        {selectedCluster && (
          <InfoWindow
            position={{
              lat: selectedCluster.coordinates[1],
              lng: selectedCluster.coordinates[0],
            }}
            onCloseClick={() => setSelectedCluster(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -25),
            }}
          >
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: theme.shadows[4],
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: theme.palette.primary.main,
                }}
              >
                {selectedCluster.count}{" "}
                {selectedCluster.count === 1 ? "imóvel" : "imóveis"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 0.5,
                  fontSize: "0.8rem",
                }}
              >
                Clique para ampliar
              </Typography>
            </Paper>
          </InfoWindow>
        )}

        {/* InfoWindow para propriedade selecionada */}
        {selectedProperty && (
          <InfoWindow
            position={selectedProperty.coordinates!}
            onCloseClick={onInfoWindowClose}
            options={{
              pixelOffset: new google.maps.Size(0, -40),
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: 300,
                borderRadius: 2,
                boxShadow: theme.shadows[4],
              }}
            >
              {/* Cabeçalho do InfoWindow */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    lineHeight: 1.2,
                    flex: 1,
                    mr: 1,
                  }}
                >
                  {selectedProperty.title}
                </Typography>
                <IconButton
                  size="small"
                  onClick={onInfoWindowClose}
                  sx={{ p: 0.5 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>

              {/* Chip do tipo de propriedade */}
              <Chip
                label={selectedProperty.propertyType}
                size="small"
                sx={{
                  backgroundColor: getPropertyTypeColor(
                    selectedProperty.propertyType
                  ),
                  color: theme.palette.getContrastText(
                    getPropertyTypeColor(selectedProperty.propertyType)
                  ),
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.6rem",
                  height: 20,
                  mb: 1,
                  "& .MuiChip-label": {
                    px: 0.5,
                  },
                }}
              />

              {/* Preço */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  mb: 1,
                }}
              >
                {formatPrice(selectedProperty.price)}
              </Typography>

              {/* Preço por m² */}
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              >
                {formatPricePerSquareMeter(
                  selectedProperty.pricePerSquareMeter
                )}
                /m²
              </Typography>

              {/* Endereço */}
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mb: 1,
                  fontSize: "0.8rem",
                }}
              >
                {selectedProperty.address}
                <br />
                {selectedProperty.neighborhood && selectedProperty.city
                  ? `${selectedProperty.neighborhood}, ${selectedProperty.city}`
                  : selectedProperty.city || selectedProperty.neighborhood}
              </Typography>

              {/* Detalhes específicos */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                  mb: 1,
                }}
              >
                {/* Para terrenos, mostrar apenas a área */}
                {selectedProperty.propertyType === "TERRENO" ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <SquareFoot
                      sx={{
                        fontSize: 16,
                        color: getIconColor(selectedProperty.propertyType),
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                      {selectedProperty.area} m²
                    </Typography>
                  </Box>
                ) : (
                  /* Para outros tipos, mostrar quartos, banheiros e área */
                  <>
                    {selectedProperty.bedrooms &&
                      selectedProperty.bedrooms > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Bed
                            sx={{
                              fontSize: 16,
                              color: getIconColor(
                                selectedProperty.propertyType
                              ),
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.8rem" }}
                          >
                            {selectedProperty.bedrooms}
                          </Typography>
                        </Box>
                      )}
                    {selectedProperty.bathrooms &&
                      selectedProperty.bathrooms > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <DirectionsCar
                            sx={{
                              fontSize: 16,
                              color: getIconColor(
                                selectedProperty.propertyType
                              ),
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.8rem" }}
                          >
                            {selectedProperty.bathrooms}
                          </Typography>
                        </Box>
                      )}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <SquareFoot
                        sx={{
                          fontSize: 16,
                          color: getIconColor(selectedProperty.propertyType),
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                        {selectedProperty.area} m²
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              {/* Botão para ver detalhes */}
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.primary.main,
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "0.8rem",
                    "&:hover": {
                      color: theme.palette.primary.dark,
                    },
                  }}
                  onClick={() => {
                    onPropertyClick?.(selectedProperty.id);
                    onInfoWindowClose();
                  }}
                >
                  Ver detalhes
                </Typography>
              </Box>
            </Paper>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Tooltip para bairros */}
      {hoveredNeighborhood && tooltipPosition && (
        <Box
          sx={{
            position: "fixed",
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: "translate(-50%, -100%)",
            zIndex: 2000,
            pointerEvents: "none",
            backgroundColor: "#4A375B",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            whiteSpace: "nowrap",
            marginBottom: "8px",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: "white",
              lineHeight: 1.2,
              marginBottom: "2px",
            }}
          >
            Bairro:
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "white",
              lineHeight: 1.2,
            }}
          >
            {hoveredNeighborhood.name}
          </Typography>
        </Box>
      )}

      {/* Indicador de Loading */}
      {mapLoading && useMapSearch && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: theme.palette.background.paper,
            padding: 1,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            Carregando imóveis...
          </Typography>
        </Box>
      )}

      {/* Controles Customizados de Desenho */}
      <Box
        sx={{
          position: "absolute",
          top: 60,
          right: 10,
          zIndex: 1000,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: 0.25,
            borderRadius: 0.5,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            minWidth: 22,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Stack direction="column" spacing={0.25}>
            {/* Botão Polígono */}
            <Button
              variant={
                drawingMode === google.maps.drawing.OverlayType.POLYGON
                  ? "contained"
                  : "outlined"
              }
              size="small"
              onClick={() =>
                setDrawingModeHandler(
                  drawingMode === google.maps.drawing.OverlayType.POLYGON
                    ? null
                    : google.maps.drawing.OverlayType.POLYGON
                )
              }
              sx={{
                minWidth: 18,
                height: 18,
                borderRadius: 0.25,
                backgroundColor:
                  drawingMode === google.maps.drawing.OverlayType.POLYGON
                    ? theme.palette.primary.main
                    : "transparent",
                color:
                  drawingMode === google.maps.drawing.OverlayType.POLYGON
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                borderColor: theme.palette.divider,
                "&:hover": {
                  backgroundColor:
                    drawingMode === google.maps.drawing.OverlayType.POLYGON
                      ? theme.palette.primary.dark
                      : theme.palette.action.hover,
                },
              }}
            >
              <Edit fontSize="inherit" />
            </Button>

            {/* Botão Círculo */}
            <Button
              variant={
                drawingMode === google.maps.drawing.OverlayType.CIRCLE
                  ? "contained"
                  : "outlined"
              }
              size="small"
              onClick={() =>
                setDrawingModeHandler(
                  drawingMode === google.maps.drawing.OverlayType.CIRCLE
                    ? null
                    : google.maps.drawing.OverlayType.CIRCLE
                )
              }
              sx={{
                minWidth: 18,
                height: 18,
                borderRadius: 0.25,
                backgroundColor:
                  drawingMode === google.maps.drawing.OverlayType.CIRCLE
                    ? theme.palette.primary.main
                    : "transparent",
                color:
                  drawingMode === google.maps.drawing.OverlayType.CIRCLE
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                borderColor: theme.palette.divider,
                "&:hover": {
                  backgroundColor:
                    drawingMode === google.maps.drawing.OverlayType.CIRCLE
                      ? theme.palette.primary.dark
                      : theme.palette.action.hover,
                },
              }}
            >
              <RadioButtonUnchecked fontSize="inherit" />
            </Button>

            {/* Botão Desenho Livre (substitui Retângulo) */}
            <Button
              variant={freehandActive ? "contained" : "outlined"}
              size="small"
              onClick={toggleFreehand}
              sx={{
                minWidth: 18,
                height: 18,
                borderRadius: 0.25,
                backgroundColor: freehandActive
                  ? theme.palette.primary.main
                  : "transparent",
                color: freehandActive
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
                borderColor: theme.palette.divider,
                "&:hover": {
                  backgroundColor: freehandActive
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                },
              }}
            >
              <Gesture fontSize="inherit" />
            </Button>

            {/* Botão Parar Desenho */}
            {drawingMode && (
              <Button
                variant="outlined"
                size="small"
                onClick={stopDrawing}
                sx={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 0.25,
                  backgroundColor: theme.palette.error.main,
                  color: theme.palette.error.contrastText,
                  borderColor: theme.palette.error.main,
                  "&:hover": {
                    backgroundColor: theme.palette.error.dark,
                  },
                }}
              >
                <Stop fontSize="inherit" />
              </Button>
            )}

            {/* Botão Limpar Desenhos */}
            {drawnOverlays.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={clearAllDrawings}
                sx={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 0.25,
                  backgroundColor: theme.palette.warning.main,
                  color: theme.palette.warning.contrastText,
                  borderColor: theme.palette.warning.main,
                  "&:hover": {
                    backgroundColor: theme.palette.warning.dark,
                  },
                }}
              >
                <Delete fontSize="inherit" />
              </Button>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

export default MapComponent;
