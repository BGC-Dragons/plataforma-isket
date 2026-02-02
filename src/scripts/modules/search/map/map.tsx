import {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
  DrawingManager,
  Polygon,
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
  Popover,
} from "@mui/material";
import {
  Close,
  Bed,
  Bathtub,
  DirectionsCar,
  SquareFoot,
  Edit,
  RadioButtonUnchecked,
  Stop,
  Delete,
  Gesture,
  OpenWith,
  BarChart,
} from "@mui/icons-material";
import { GOOGLE_CONFIG } from "../../../config/google.constant";
import type { INeighborhoodFull } from "../../../../services/get-locations-neighborhoods.service";
import type { ICityFull } from "../../../../services/get-locations-cities.service";
import {
  postPropertyAdSearchMap,
  type IMapCluster,
  type IMapPoint,
} from "../../../../services/post-property-ad-search-map.service";
import { postPropertyAdSearchStatistics } from "../../../../services/post-property-ad-search-statistics.service";
import { mapFiltersToSearchMap } from "../../../../services/helpers/map-filters-to-search-map.helper";
import {
  mapFiltersToApi,
  type ILocalFilterState,
} from "../../../../services/helpers/map-filters-to-api.helper";

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
  parking?: number;
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
  heatmapData?: number[][]; // Array de [longitude, latitude] para heatmap
  refreshKey?: number; // Força atualização do mapa ao retornar dos detalhes
  /** Cidade padrão do plano (mesma lógica da listagem para montar o payload de estatísticas) */
  defaultCity?: string;
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

// Zoom padrão mais baixo para mostrar uma área maior na inicialização
// Isso evita que o mapa apareça com zoom máximo quando não há dados
const defaultZoom = 8;

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
  heatmapData,
  refreshKey,
  defaultCity,
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(
    null
  );
  const [drawnOverlays, setDrawnOverlays] = useState<
    google.maps.drawing.OverlayCompleteEvent[]
  >([]);
  // Ref para manter referência atualizada dos overlays para cleanup
  const drawnOverlaysRef = useRef<google.maps.drawing.OverlayCompleteEvent[]>(
    []
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(
    null
  );
  const [freehandActive, setFreehandActive] = useState<boolean>(false);
  const isMouseDownRef = useRef<boolean>(false);
  const freehandPolylineRef = useRef<google.maps.Polyline | null>(null);
  const lastPointRef = useRef<google.maps.LatLng | null>(null);
  const mouseMoveListenerRef = useRef<google.maps.MapsEventListener | null>(
    null
  );
  const mouseDownListenerRef = useRef<google.maps.MapsEventListener | null>(
    null
  );
  const mouseUpListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const touchListenersRef = useRef<{ remove: () => void } | null>(null);

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
  const addressCircleOverlayRef = useRef<google.maps.Circle | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Estatísticas de anúncios (hover no botão)
  const [statisticsAnchorEl, setStatisticsAnchorEl] =
    useState<HTMLElement | null>(null);
  const [statisticsData, setStatisticsData] = useState<{
    avgPrice: number | null;
    avgTotalArea: number | null;
    avgUsableArea: number | null;
    avgTotalPricePerArea: number | null;
    avgUsablePricePerArea: number | null;
  } | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const statisticsTouchHandledRef = useRef(false);
  const tokenRef = useRef<string | undefined>(token);
  const fetchMapDataRef = useRef<
    | ((bounds: google.maps.LatLngBounds, zoomLevel: number) => Promise<void>)
    | null
  >(null);
  const lastSearchKeyRef = useRef<string | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  // Refs para armazenar listeners de arrasto/edição dos overlays
  const overlayListenersRef = useRef<
    Map<
      google.maps.Polygon | google.maps.Circle,
      google.maps.MapsEventListener[]
    >
  >(new Map());
  const overlayUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const drawingGeometriesKeyRef = useRef<string>("");
  // Ref para armazenar callback de desenho (garante usar versão mais recente)
  const onDrawingCompleteRef = useRef(onDrawingComplete);
  // Ref para rastrear polígonos dos bairros para cleanup seguro
  const neighborhoodPolygonsRef = useRef<Map<string, google.maps.Polygon>>(
    new Map()
  );
  const lastAllNeighborhoodsRef = useRef<{
    key: string;
    items: INeighborhoodFull[];
  }>({ key: "", items: [] });

  // Mantém a ref de onDrawingComplete atualizada
  useEffect(() => {
    onDrawingCompleteRef.current = onDrawingComplete;
  }, [onDrawingComplete]);

  // Carrega o script do Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_CONFIG.MAPS_API_KEY,
    libraries: ["places", "drawing", "geometry", "visualization"],
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

      // Só fazer busca se houver pelo menos um bairro selecionado OU desenho no mapa OU busca por endereço
      const hasNeighborhoods =
        filters?.neighborhoods && filters.neighborhoods.length > 0;
      const hasDrawingGeometries =
        filters?.drawingGeometries && filters.drawingGeometries.length > 0;
      const hasAddressCoordinates = filters?.addressCoordinates !== undefined;

      if (
        !filters ||
        (!hasNeighborhoods && !hasDrawingGeometries && !hasAddressCoordinates)
      ) {
        // Limpar dados do mapa se não há bairros selecionados nem desenho nem busca por endereço
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
          // Se há desenho no mapa, calcular bbox a partir das geometrias dos desenhos
          // Se há busca por endereço (sem desenho), calcular bbox a partir do círculo do endereço
          let bbox: [number, number, number, number];
          if (
            filters?.drawingGeometries &&
            filters.drawingGeometries.length > 0
          ) {
            // Calcular bbox combinado de todas as geometrias
            let minLng = Infinity;
            let maxLng = -Infinity;
            let minLat = Infinity;
            let maxLat = -Infinity;
            let hasValidGeometry = false;

            filters.drawingGeometries.forEach((geom) => {
              if (geom.type === "Polygon") {
                const allCoords = geom.coordinates[0];
                if (allCoords.length > 0) {
                  hasValidGeometry = true;
                  allCoords.forEach((coord) => {
                    const [lng, lat] = coord;
                    if (lng < minLng) minLng = lng;
                    if (lng > maxLng) maxLng = lng;
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                  });
                }
              } else if (geom.type === "circle") {
                const [centerLng, centerLat] = geom.coordinates[0];
                const radius = parseFloat(geom.radius); // em metros

                // Converter raio de metros para graus (aproximação)
                const latDiff = radius / 111000; // metros para graus
                const lngDiff =
                  radius / (111000 * Math.cos((centerLat * Math.PI) / 180));

                hasValidGeometry = true;
                const circleMinLng = centerLng - lngDiff;
                const circleMaxLng = centerLng + lngDiff;
                const circleMinLat = centerLat - latDiff;
                const circleMaxLat = centerLat + latDiff;

                if (circleMinLng < minLng) minLng = circleMinLng;
                if (circleMaxLng > maxLng) maxLng = circleMaxLng;
                if (circleMinLat < minLat) minLat = circleMinLat;
                if (circleMaxLat > maxLat) maxLat = circleMaxLat;
              }
            });

            if (hasValidGeometry) {
              bbox = [minLng, minLat, maxLng, maxLat];
            } else {
              bbox = calculateLimitedBbox(bounds, zoomLevel);
            }
          } else if (filters?.addressCoordinates) {
            // Quando há busca por endereço mas não há drawingGeometry, calcular bbox a partir do círculo do endereço
            // Usar o raio atual do círculo se disponível, senão usar o padrão de 1000 metros
            const centerLat = filters.addressCoordinates.lat;
            const centerLng = filters.addressCoordinates.lng;
            const circle = addressCircleOverlayRef.current;
            const radius = circle?.getRadius() || 1000; // Usar raio do círculo se disponível, senão 1000 metros (padrão)

            // Converter raio de metros para graus (aproximação)
            const latDiff = radius / 111000; // metros para graus
            const lngDiff =
              radius / (111000 * Math.cos((centerLat * Math.PI) / 180));

            bbox = [
              centerLng - lngDiff,
              centerLat - latDiff,
              centerLng + lngDiff,
              centerLat + latDiff,
            ];
          } else {
            // Calcular bbox limitado baseado no zoom e cidade selecionada
            bbox = calculateLimitedBbox(bounds, zoomLevel);
          }

          // Verificar se já fizemos uma busca com os mesmos bounds e zoom
          const boundsKey = JSON.stringify(bbox);
          const filtersKey = filters
            ? JSON.stringify({
                cities: filters.cities?.sort(),
                neighborhoods: filters.neighborhoods?.sort(),
                addressCoordinates: filters.addressCoordinates,
                drawingGeometries: filters.drawingGeometries,
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

          // O círculo agora é criado automaticamente como desenho editável quando há busca por endereço
          // Não precisamos mais processar o círculo da resposta da API aqui
        } catch {
          setMapClusters([]);
          setMapPoints([]);
          // Limpar estados de endereço em caso de erro, mas manter círculo se houver busca por endereço
          setAddressCenter(null);
          setAddressMarker(null);
          setAddressZoom(null);
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
      // Se zoom é undefined, usar o zoom atual do mapa (que pode ser defaultZoom)
      // Isso garante que quando o zoom calculado chegar, será detectado como mudança
      previousZoomRef.current = zoom !== undefined ? zoom : loadedMap.getZoom();
      setCurrentZoom(
        zoom !== undefined ? zoom : loadedMap.getZoom() || defaultZoom
      );

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
      addressCoordinates: filters.addressCoordinates, // Incluir coordenadas do endereço
      drawingGeometries: filters.drawingGeometries, // Incluir geometrias dos desenhos
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

  // Efeito para buscar quando filtros mudarem (especialmente bairros ou desenhos)
  useEffect(() => {
    if (!map || !useMapSearch || !token || !fetchMapDataRef.current) return;

    // Limpar ref para forçar nova busca mesmo com os mesmos bounds quando filtros mudarem
    lastSearchKeyRef.current = null;

    // Obter bounds atuais do mapa
    const bounds = map.getBounds();
    if (!bounds) return;

    // Fazer busca única quando filtros mudarem (a busca só será executada se houver bairros ou desenho)
    const newZoom = map.getZoom() || zoom;
    fetchMapDataRef.current(bounds, newZoom);
  }, [filtersKey, map, useMapSearch, token, zoom]);

  useEffect(() => {
    if (refreshKey === undefined) return;
    if (!map || !useMapSearch || !token || !fetchMapDataRef.current) return;

    lastSearchKeyRef.current = null;
    const bounds = map.getBounds();
    if (!bounds) return;

    const newZoom = map.getZoom() || zoom;
    fetchMapDataRef.current(bounds, newZoom);
  }, [refreshKey, map, useMapSearch, token, zoom]);

  // Buscar estatísticas quando o popover de estatísticas abrir (clique no botão)
  useEffect(() => {
    if (!statisticsAnchorEl || !token) return;

    let cancelled = false;
    setStatisticsLoading(true);
    setStatisticsData(null);

    // Mesma lógica da listagem: aplicar fallback de cidade padrão e montar payload completo
    let request: Parameters<typeof postPropertyAdSearchStatistics>[0];
    if (filters && cityToCodeMap) {
      const filtersForApi = { ...filters };
      if (
        filtersForApi.cities.length === 0 &&
        !filtersForApi.addressCoordinates &&
        (!filtersForApi.drawingGeometries ||
          filtersForApi.drawingGeometries.length === 0) &&
        defaultCity &&
        cityToCodeMap[defaultCity]
      ) {
        filtersForApi.cities = [defaultCity];
      }
      request = mapFiltersToApi(filtersForApi, cityToCodeMap, 1, 1);
    } else {
      request = {};
    }

    postPropertyAdSearchStatistics(request, token)
      .then((res) => {
        if (!cancelled) {
          setStatisticsData(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatisticsData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatisticsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [statisticsAnchorEl, token, filters, cityToCodeMap, defaultCity]);

  const handleStatisticsClick = (event: React.MouseEvent<HTMLElement>) => {
    if (statisticsTouchHandledRef.current) {
      statisticsTouchHandledRef.current = false;
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setStatisticsAnchorEl((prev) =>
      prev ? null : (event.currentTarget as HTMLElement)
    );
  };

  const handleStatisticsTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    statisticsTouchHandledRef.current = true;
    setStatisticsAnchorEl((prev) =>
      prev ? null : (event.currentTarget as HTMLElement)
    );
  };

  const formatStatCurrency = (value: number | null) => {
    if (value == null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatStatNumber = (value: number | null) => {
    if (value == null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Efeito para animar o mapa quando center ou zoom mudarem
  useEffect(() => {
    // Usar valores padrão se center ou zoom forem undefined
    const effectiveCenter = center || defaultCenter;
    const effectiveZoom = zoom !== undefined ? zoom : defaultZoom;

    if (!map) return;

    if (!isValidCoordinate(effectiveCenter)) {
      return;
    }

    // Verificar se o centro ou zoom realmente mudaram
    const centerChanged =
      !previousCenterRef.current ||
      previousCenterRef.current.lat !== effectiveCenter.lat ||
      previousCenterRef.current.lng !== effectiveCenter.lng;

    // Detectar mudança de zoom, considerando que undefined significa que ainda não foi setado
    const zoomChanged =
      (previousZoomRef.current === undefined && effectiveZoom !== undefined) ||
      (previousZoomRef.current !== undefined &&
        previousZoomRef.current !== effectiveZoom);

    // Se não houve mudança, não fazer nada
    if (!centerChanged && !zoomChanged) return;

    // Se há cidades selecionadas, usar fitBounds com as coordenadas das cidades
    // Caso contrário, usar panTo/setZoom diretamente
    const hasSelectedCities = cities.length > 0 && selectedCityCodes.length > 0;
    const hasSelectedNeighborhoods = selectedNeighborhoodNames.length > 0;

    // Se há bairros selecionados mas os dados ainda não chegaram, não animar
    if (hasSelectedNeighborhoods && neighborhoods.length === 0) {
      return;
    }

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
    // Quando há bairros selecionados, focar somente neles para evitar "zoom out"
    if (!hasSelectedNeighborhoods) {
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
          // Iterar sobre todos os polígonos no MultiPolygon, não apenas o primeiro
          if (coords && Array.isArray(coords)) {
            coords.forEach((polygon) => {
              if (polygon && polygon[0] && Array.isArray(polygon[0])) {
                polygon[0].forEach((coord) => {
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
          }
        }
      });
    }

    // Se há coordenadas de cidades/bairros, usar fitBounds
    // EXCETO quando for busca apenas por cidade (sem bairros) - nesse caso usar zoom calculado
    const isCityOnlySearch = hasSelectedCities && !hasSelectedNeighborhoods;

    // Quando é busca apenas por cidade, SEMPRE usar o zoom calculado (não usar fitBounds)
    // Isso garante que o zoom calculado em calculateMapBounds seja respeitado
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

          if (hasSelectedNeighborhoods) {
            // Para bairro selecionado, usar fitBounds padrão (sem padding e sem pós-zoom)
            map.fitBounds(bounds);
            setTimeout(() => {
              isAnimatingRef.current = false;
            }, 600);
          } else {
            // Usar fitBounds com padding e limitar zoom máximo
            map.fitBounds(bounds, {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50,
            });

            // Limitar o zoom após fitBounds para evitar zoom máximo
            setTimeout(() => {
              const currentZoom = map.getZoom();
              if (currentZoom && currentZoom > 13) {
                map.setZoom(13);
              }
              isAnimatingRef.current = false;
            }, 600);
          }

          previousCenterRef.current = effectiveCenter;
          previousZoomRef.current = effectiveZoom;
          return;
        }
      } catch {
        // Fallback para panTo
      }
    }

    // Quando é busca apenas por cidade (isCityOnlySearch = true),
    // garantir que o zoom calculado seja aplicado mesmo se não houver mudança de centro
    if (isCityOnlySearch && zoomChanged) {
      // Forçar atualização do zoom mesmo que o centro não tenha mudado
      isAnimatingRef.current = true;
      map.setZoom(effectiveZoom);
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 500);
      previousZoomRef.current = effectiveZoom;
      // Se o centro também mudou, aplicar panTo também
      if (centerChanged && isValidCoordinate(effectiveCenter)) {
        map.panTo(
          new google.maps.LatLng(effectiveCenter.lat, effectiveCenter.lng)
        );
      }
      previousCenterRef.current = effectiveCenter;
      return;
    }

    // Se não há coordenadas ou fitBounds falhou, usar panTo e setZoom diretamente
    // SEMPRE garantir que o mapa se move quando center muda
    isAnimatingRef.current = true;

    try {
      if (centerChanged && zoomChanged) {
        // Validar novamente antes de usar (defesa em profundidade)
        if (isValidCoordinate(effectiveCenter)) {
          map.panTo(
            new google.maps.LatLng(effectiveCenter.lat, effectiveCenter.lng)
          );
          setTimeout(() => {
            if (map) {
              map.setZoom(effectiveZoom);
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
        if (isValidCoordinate(effectiveCenter)) {
          map.panTo(
            new google.maps.LatLng(effectiveCenter.lat, effectiveCenter.lng)
          );
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 500);
        } else {
          isAnimatingRef.current = false;
        }
      } else if (zoomChanged) {
        map.setZoom(effectiveZoom);
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 500);
      }
    } catch {
      isAnimatingRef.current = false;
    }

    // Atualizar refs
    previousCenterRef.current = effectiveCenter;
    previousZoomRef.current = effectiveZoom;
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
        try {
          const overlay = tooltipOverlayRef.current;
          if (overlay && typeof overlay.setMap === "function") {
            overlay.setMap(null);
          }
        } catch {
          // Ignorar erros
        } finally {
          tooltipOverlayRef.current = null;
        }
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

      // Chamar callback para atualizar filtros
      onNeighborhoodClick(neighborhood);
    },
    [map, onNeighborhoodClick]
  );

  // Função para atualizar geometria e buscar quando overlay é modificado (com debounce)
  const handleOverlayUpdate = useCallback(
    (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      // SEMPRE usar debounce para evitar muitas requisições durante edição/arrasto
      if (overlayUpdateTimeoutRef.current) {
        clearTimeout(overlayUpdateTimeoutRef.current);
      }

      overlayUpdateTimeoutRef.current = setTimeout(() => {
        if (onDrawingCompleteRef.current) {
          onDrawingCompleteRef.current(overlay);
        }
      }, 500); // 500ms de debounce
    },
    []
  );

  // Função para adicionar listeners de arrasto/edição aos overlays
  const addOverlayListeners = useCallback(
    (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      if (!overlay.overlay) return;

      // Só adicionar listeners para Polygon e Circle
      const isPolygon =
        overlay.type === google.maps.drawing.OverlayType.POLYGON;
      const isCircle = overlay.type === google.maps.drawing.OverlayType.CIRCLE;

      if (!isPolygon && !isCircle) return;

      const overlayInstance = overlay.overlay as
        | google.maps.Polygon
        | google.maps.Circle;

      // Remover listeners anteriores se existirem
      const existingListeners =
        overlayListenersRef.current.get(overlayInstance);
      if (existingListeners) {
        existingListeners.forEach((listener) => {
          google.maps.event.removeListener(listener);
        });
        overlayListenersRef.current.delete(overlayInstance);
      }

      const listeners: google.maps.MapsEventListener[] = [];

      if (isPolygon) {
        const polygon = overlayInstance as google.maps.Polygon;
        const path = polygon.getPath();

        // Listener para quando um vértice é movido
        const setAtListener = path.addListener("set_at", () => {
          handleOverlayUpdate(overlay);
        });
        listeners.push(setAtListener);

        // Listener para quando um vértice é inserido
        const insertAtListener = path.addListener("insert_at", () => {
          handleOverlayUpdate(overlay);
        });
        listeners.push(insertAtListener);

        // Listener para quando um vértice é removido
        const removeAtListener = path.addListener("remove_at", () => {
          handleOverlayUpdate(overlay);
        });
        listeners.push(removeAtListener);

        // Listener para quando o polígono é arrastado (usa ref para pegar callback atualizado)
        const dragendListener = google.maps.event.addListener(
          polygon,
          "dragend",
          () => {
            // Cancelar debounce pendente para evitar duplicação
            if (overlayUpdateTimeoutRef.current) {
              clearTimeout(overlayUpdateTimeoutRef.current);
              overlayUpdateTimeoutRef.current = null;
            }
            if (onDrawingCompleteRef.current) {
              onDrawingCompleteRef.current(overlay);
            }
          }
        );
        listeners.push(dragendListener);

        const mouseUpListener = google.maps.event.addListener(
          polygon,
          "mouseup",
          () => {
            // Cancelar debounce pendente para evitar duplicação
            if (overlayUpdateTimeoutRef.current) {
              clearTimeout(overlayUpdateTimeoutRef.current);
              overlayUpdateTimeoutRef.current = null;
            }
            if (onDrawingCompleteRef.current) {
              onDrawingCompleteRef.current(overlay);
            }
          }
        );
        listeners.push(mouseUpListener);
      } else if (isCircle) {
        const circle = overlayInstance as google.maps.Circle;

        // Listener para quando o centro do círculo muda (arrasto)
        const centerChangedListener = google.maps.event.addListener(
          circle,
          "center_changed",
          () => {
            handleOverlayUpdate(overlay);
          }
        );
        listeners.push(centerChangedListener);

        // Listener para quando o raio do círculo muda (redimensionamento)
        const radiusChangedListener = google.maps.event.addListener(
          circle,
          "radius_changed",
          () => {
            handleOverlayUpdate(overlay);
          }
        );
        listeners.push(radiusChangedListener);

        // Listener para quando o círculo é arrastado (usa ref para pegar callback atualizado)
        const dragendListener = google.maps.event.addListener(
          circle,
          "dragend",
          () => {
            // Cancelar debounce pendente para evitar duplicação
            if (overlayUpdateTimeoutRef.current) {
              clearTimeout(overlayUpdateTimeoutRef.current);
              overlayUpdateTimeoutRef.current = null;
            }
            if (onDrawingCompleteRef.current) {
              onDrawingCompleteRef.current(overlay);
            }
          }
        );
        listeners.push(dragendListener);
      }

      // Armazenar listeners para cleanup posterior
      overlayListenersRef.current.set(overlayInstance, listeners);
    },
    [handleOverlayUpdate]
  );

  // Callbacks para o DrawingManager
  const onDrawingCompleteCallback = useCallback(
    (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      setDrawnOverlays((prev) => [...prev, overlay]);

      // Adicionar listeners de arrasto/edição
      addOverlayListeners(overlay);

      // Usar ref para garantir callback mais recente
      if (onDrawingCompleteRef.current) {
        onDrawingCompleteRef.current(overlay);
      }
      setDrawingMode(null);
    },
    [addOverlayListeners]
  );

  // -------- Freehand drawing (desenho à mão livre) ---------
  // Converte coordenadas de toque/tela (clientX, clientY) em LatLng no mapa
  const getLatLngFromClientCoords = useCallback(
    (
      mapInstance: google.maps.Map,
      clientX: number,
      clientY: number
    ): google.maps.LatLng | null => {
      const bounds = mapInstance.getBounds();
      if (!bounds) return null;
      const rect = mapInstance.getDiv().getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return null;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const lat = sw.lat() + (1 - y) * (ne.lat() - sw.lat());
      const lng = sw.lng() + x * (ne.lng() - sw.lng());
      return new google.maps.LatLng(lat, lng);
    },
    []
  );

  const teardownFreehandListeners = useCallback(() => {
    mouseMoveListenerRef.current?.remove();
    mouseDownListenerRef.current?.remove();
    mouseUpListenerRef.current?.remove();
    mouseMoveListenerRef.current = null;
    mouseDownListenerRef.current = null;
    mouseUpListenerRef.current = null;
    touchListenersRef.current?.remove();
    touchListenersRef.current = null;
  }, []);

  const stopFreehand = useCallback(() => {
    setFreehandActive(false);
    isMouseDownRef.current = false;
    lastPointRef.current = null;
    teardownFreehandListeners();
    if (map) {
      map.setOptions({ draggable: true });
      map.setOptions({ draggableCursor: undefined });
    }
  }, [map, teardownFreehandListeners]);

  // Função para simplificar um path removendo pontos redundantes
  const simplifyPolygonPath = useCallback(
    (path: google.maps.MVCArray<google.maps.LatLng>): google.maps.LatLng[] => {
      if (path.getLength() < 3) {
        // Polígono precisa de pelo menos 3 pontos
        const simplified: google.maps.LatLng[] = [];
        for (let i = 0; i < path.getLength(); i++) {
          simplified.push(path.getAt(i));
        }
        return simplified;
      }

      // Distância mínima em metros para considerar um ponto redundante
      const MIN_DISTANCE_FOR_SIMPLIFICATION = 100; // metros

      const simplified: google.maps.LatLng[] = [];
      const pathLength = path.getLength();

      // Sempre manter o primeiro ponto
      simplified.push(path.getAt(0));

      for (let i = 1; i < pathLength - 1; i++) {
        const prevPoint = simplified[simplified.length - 1];
        const currentPoint = path.getAt(i);
        const nextPoint = path.getAt(i + 1);

        // Calcular distância do ponto atual ao segmento formado pelos pontos adjacentes
        const distanceToSegment =
          google.maps.geometry.spherical.computeDistanceBetween(
            currentPoint,
            prevPoint
          );

        // Se a distância for significativa, manter o ponto
        // Também verificar se o ponto não está muito próximo do próximo ponto
        const distanceToNext =
          google.maps.geometry.spherical.computeDistanceBetween(
            currentPoint,
            nextPoint
          );

        if (
          distanceToSegment >= MIN_DISTANCE_FOR_SIMPLIFICATION ||
          distanceToNext >= MIN_DISTANCE_FOR_SIMPLIFICATION
        ) {
          simplified.push(currentPoint);
        }
      }

      // Sempre manter o último ponto
      simplified.push(path.getAt(pathLength - 1));

      // Garantir que temos pelo menos 3 pontos
      if (simplified.length < 3 && pathLength >= 3) {
        // Se simplificamos demais, manter pelo menos 3 pontos
        simplified.length = 0;
        simplified.push(path.getAt(0));
        if (pathLength > 1) {
          simplified.push(path.getAt(Math.floor(pathLength / 2)));
        }
        simplified.push(path.getAt(pathLength - 1));
      }

      return simplified;
    },
    []
  );

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
        if (e.latLng) {
          path.push(e.latLng);
          lastPointRef.current = e.latLng;
        }
      }
    );

    // Distância mínima em metros para adicionar um novo ponto durante o desenho
    const MIN_DISTANCE_DURING_DRAWING = 200; // metros

    const addPointToFreehand = (latLng: google.maps.LatLng) => {
      if (!freehandPolylineRef.current) return;
      if (lastPointRef.current) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          lastPointRef.current,
          latLng
        );
        if (distance < MIN_DISTANCE_DURING_DRAWING) return;
      }
      const path = freehandPolylineRef.current.getPath();
      path.push(latLng);
      lastPointRef.current = latLng;
    };

    const finishFreehandStroke = () => {
      if (!freehandPolylineRef.current) return;
      isMouseDownRef.current = false;
      const path = freehandPolylineRef.current.getPath();
      const simplifiedPath = simplifyPolygonPath(path);
      const simplifiedMVCArray = new google.maps.MVCArray<google.maps.LatLng>();
      simplifiedPath.forEach((point) => {
        simplifiedMVCArray.push(point);
      });
      const polygon = new google.maps.Polygon({
        map,
        paths: simplifiedMVCArray,
        fillColor: "#4285F4",
        fillOpacity: 0.2,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: isEditMode,
      });
      freehandPolylineRef.current.setMap(null);
      freehandPolylineRef.current = null;
      const fakeEvent = {
        type: google.maps.drawing.OverlayType.POLYGON,
        overlay: polygon,
      } as unknown as google.maps.drawing.OverlayCompleteEvent;
      setDrawnOverlays((prev) => [...prev, fakeEvent]);
      addOverlayListeners(fakeEvent);
      if (onDrawingCompleteRef.current) onDrawingCompleteRef.current(fakeEvent);
      setDrawingMode(null);
      setTimeout(() => {
        if (map) {
          const center = map.getCenter();
          if (center) {
            google.maps.event.trigger(map, "click", { latLng: center });
          }
        }
      }, 100);
      setFreehandActive(false);
      lastPointRef.current = null;
      teardownFreehandListeners();
      if (map) {
        map.setOptions({ draggable: true });
        map.setOptions({ draggableCursor: undefined });
      }
    };

    mouseMoveListenerRef.current = map.addListener(
      "mousemove",
      (e: google.maps.MapMouseEvent) => {
        if (
          !isMouseDownRef.current ||
          !freehandPolylineRef.current ||
          !e.latLng
        )
          return;
        addPointToFreehand(e.latLng);
      }
    );

    mouseUpListenerRef.current = map.addListener(
      "mouseup",
      finishFreehandStroke
    );

    // Suporte a toque (tablet/celular): desenho com dedo
    const mapDiv = map.getDiv();
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const latLng = getLatLngFromClientCoords(
        map,
        touch.clientX,
        touch.clientY
      );
      if (!latLng) return;
      isMouseDownRef.current = true;
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
      path.push(latLng);
      lastPointRef.current = latLng;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isMouseDownRef.current || e.touches.length === 0) return;
      e.preventDefault();
      const touch = e.touches[0];
      const latLng = getLatLngFromClientCoords(
        map,
        touch.clientX,
        touch.clientY
      );
      if (latLng) addPointToFreehand(latLng);
    };
    const onTouchEnd = () => {
      if (isMouseDownRef.current && freehandPolylineRef.current) {
        finishFreehandStroke();
      }
    };
    const touchOptions = { passive: false };
    mapDiv.addEventListener("touchstart", onTouchStart, touchOptions);
    mapDiv.addEventListener("touchmove", onTouchMove, touchOptions);
    mapDiv.addEventListener("touchend", onTouchEnd, touchOptions);
    mapDiv.addEventListener("touchcancel", onTouchEnd, touchOptions);
    touchListenersRef.current = {
      remove: () => {
        mapDiv.removeEventListener("touchstart", onTouchStart);
        mapDiv.removeEventListener("touchmove", onTouchMove);
        mapDiv.removeEventListener("touchend", onTouchEnd);
        mapDiv.removeEventListener("touchcancel", onTouchEnd);
        touchListenersRef.current = null;
      },
    };
  }, [
    map,
    drawingManager,
    teardownFreehandListeners,
    addOverlayListeners,
    simplifyPolygonPath,
    isEditMode,
    getLatLngFromClientCoords,
  ]);

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
    // Limpar listeners de todos os overlays
    overlayListenersRef.current.forEach((listeners) => {
      listeners.forEach((listener) => {
        google.maps.event.removeListener(listener);
      });
    });
    overlayListenersRef.current.clear();

    drawnOverlays.forEach((overlay) => {
      if (overlay.overlay?.setMap) {
        try {
          overlay.overlay.setMap(null);
        } catch {
          // Ignorar erros
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

    // Limpar também o círculo de endereço se existir
    if (addressCircleOverlayRef.current) {
      const circle = addressCircleOverlayRef.current;
      if (circle && circle.getMap()) {
        circle.setMap(null);
      }
      addressCircleOverlayRef.current = null;
    }
    setAddressMarker(null);
    setAddressCenter(null);

    // Limpar timeout de atualização
    if (overlayUpdateTimeoutRef.current) {
      clearTimeout(overlayUpdateTimeoutRef.current);
      overlayUpdateTimeoutRef.current = null;
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

  const selectedCityCodesKey = useMemo(() => {
    return [...selectedCityCodes].sort().join(",");
  }, [selectedCityCodes]);

  // Preservar lista completa de bairros para evitar flicker durante refetch
  useEffect(() => {
    if (selectedCityCodesKey.length === 0) {
      lastAllNeighborhoodsRef.current = { key: "", items: [] };
      return;
    }
    if (allNeighborhoodsForCityBounds.length > 0) {
      lastAllNeighborhoodsRef.current = {
        key: selectedCityCodesKey,
        items: allNeighborhoodsForCityBounds,
      };
    }
  }, [allNeighborhoodsForCityBounds, selectedCityCodesKey]);

  const neighborhoodsForCityBounds = useMemo(() => {
    if (allNeighborhoodsForCityBounds.length > 0) {
      return allNeighborhoodsForCityBounds;
    }
    if (
      selectedCityCodesKey.length > 0 &&
      lastAllNeighborhoodsRef.current.key === selectedCityCodesKey
    ) {
      return lastAllNeighborhoodsRef.current.items;
    }
    return neighborhoods;
  }, [allNeighborhoodsForCityBounds, neighborhoods, selectedCityCodesKey]);

  // Calcular center e zoom a serem usados
  // Prioridade: 1) addressCenter/addressZoom da resposta da API (searchMap), 2) center/zoom das props (search normal)
  const mapCenter = useMemo(() => {
    // Priorizar addressCenter, depois center, depois defaultCenter
    return addressCenter || center || defaultCenter;
  }, [addressCenter, center]);

  const mapZoom = useMemo(() => {
    // Priorizar addressZoom, depois zoom, depois defaultZoom
    // Garantir que nunca seja undefined para evitar zoom máximo do Google Maps
    const calculatedZoom =
      addressZoom !== null
        ? addressZoom
        : zoom !== undefined
        ? zoom
        : defaultZoom;

    // Garantir que o zoom nunca ultrapasse 13 (limite máximo)
    const finalZoom = Math.min(calculatedZoom, 13);

    return finalZoom;
  }, [addressZoom, zoom]);

  // Efeito para centralizar o mapa quando há informações de endereço
  // Pode vir da resposta da API (searchMap) ou das props (search normal)
  useEffect(() => {
    if (map) {
      // Priorizar addressCenter/addressZoom da resposta da API (searchMap)
      if (addressCenter && addressZoom !== null) {
        // Validar coordenadas antes de usar
        if (!isValidCoordinate(addressCenter)) {
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
        } catch {
          isAnimatingRef.current = false;
        }
      }
      // Se não há addressCenter da API mas há center/zoom das props e há busca por endereço nos filtros
      else if (filters?.addressCoordinates && center && zoom) {
        // Validar coordenadas antes de usar
        if (!isValidCoordinate(center)) {
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
        } catch {
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

  // Efeito para criar e atualizar o heatmap
  useEffect(() => {
    if (!map || !heatmapData || !isLoaded) {
      // Limpar heatmap se não há dados
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
        heatmapLayerRef.current = null;
      }
      return;
    }

    // Verificar se a biblioteca de visualização está disponível
    if (!window.google?.maps?.visualization) {
      console.warn("Google Maps Visualization library not loaded");
      return;
    }

    // Converter dados de [longitude, latitude] para google.maps.LatLng
    const heatmapPoints = heatmapData
      .filter(
        (coord) => coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])
      )
      .map((coord) => {
        // API retorna [longitude, latitude], Google Maps usa {lat, lng}
        return new google.maps.LatLng(coord[1], coord[0]);
      });

    if (heatmapPoints.length === 0) {
      // Limpar heatmap se não há pontos válidos
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
        heatmapLayerRef.current = null;
      }
      return;
    }

    // Se já existe um heatmap layer, atualizar os dados
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setData(heatmapPoints);
    } else {
      // Criar novo heatmap layer
      const newHeatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmapPoints,
        map: map,
        radius: 20,
        opacity: 0.6,
        gradient: [
          "rgba(0, 255, 255, 0)",
          "rgba(0, 255, 255, 1)",
          "rgba(0, 191, 255, 1)",
          "rgba(0, 127, 255, 1)",
          "rgba(0, 63, 255, 1)",
          "rgba(0, 0, 255, 1)",
          "rgba(0, 0, 223, 1)",
          "rgba(0, 0, 191, 1)",
          "rgba(0, 0, 159, 1)",
          "rgba(0, 0, 127, 1)",
          "rgba(63, 0, 91, 1)",
          "rgba(127, 0, 63, 1)",
          "rgba(191, 0, 31, 1)",
          "rgba(255, 0, 0, 1)",
        ],
      });
      heatmapLayerRef.current = newHeatmapLayer;
    }

    // Cleanup: remover heatmap quando componente desmontar ou dados mudarem
    return () => {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
        heatmapLayerRef.current = null;
      }
    };
  }, [map, heatmapData, isLoaded]);

  // Limpar estados de endereço quando não há mais busca por endereço nos filtros
  useEffect(() => {
    if (filters && !filters.search && !filters.addressCoordinates) {
      setAddressCenter(null);
      setAddressMarker(null);
      setAddressZoom(null);
    }
  }, [filters]);

  // Limpar todos os desenhos quando os filtros são completamente limpos (sem drawingGeometries e sem addressCoordinates)
  useEffect(() => {
    if (
      filters &&
      (!filters.drawingGeometries || filters.drawingGeometries.length === 0) &&
      !filters.addressCoordinates
    ) {
      // Se não há desenho nos filtros e não há busca por endereço, limpar todos os desenhos
      // Mas só se houver desenhos para evitar loops
      if (drawnOverlays.length > 0 || addressCircleOverlayRef.current) {
        // Limpar todos os desenhos manualmente criados
        drawnOverlays.forEach((overlay) => {
          if (
            overlay.overlay &&
            overlay.overlay !== addressCircleOverlayRef.current
          ) {
            try {
              if (typeof overlay.overlay.setMap === "function") {
                overlay.overlay.setMap(null);
              }
            } catch {
              // Ignorar erros
            }
          }
        });
        setDrawnOverlays([]);

        // Limpar círculo de endereço se existir
        if (addressCircleOverlayRef.current) {
          const circle = addressCircleOverlayRef.current;
          if (circle && circle.getMap()) {
            circle.setMap(null);
          }
          addressCircleOverlayRef.current = null;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.drawingGeometries, filters?.addressCoordinates]);

  // Criar círculo automaticamente quando há busca por endereço (como desenho editável)
  useEffect(() => {
    if (filters?.addressCoordinates && map) {
      const coords = filters.addressCoordinates;

      // Se já existe um círculo de endereço, não criar novamente
      if (addressCircleOverlayRef.current) {
        return;
      }

      // Criar círculo editável usando Google Maps API
      const circle = new google.maps.Circle({
        map,
        center: new google.maps.LatLng(coords.lat, coords.lng),
        radius: 1000, // 1000 metros
        fillColor: "#4285F4",
        fillOpacity: 0.2,
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: isEditMode,
      });

      // Armazenar referência ao círculo do endereço
      addressCircleOverlayRef.current = circle;

      // Criar um evento fake para adicionar aos drawnOverlays
      const fakeEvent = {
        type: google.maps.drawing.OverlayType.CIRCLE,
        overlay: circle,
      } as unknown as google.maps.drawing.OverlayCompleteEvent;

      // Adicionar aos desenhos
      setDrawnOverlays((prev) => [...prev, fakeEvent]);

      // Adicionar listeners de arrasto/edição
      addOverlayListeners(fakeEvent);

      // Também atualizar estados para marcador e centro
      setAddressMarker({
        lat: coords.lat,
        lng: coords.lng,
      });
      setAddressCenter({
        lat: coords.lat,
        lng: coords.lng,
      });
    } else if (
      !filters?.addressCoordinates &&
      addressCircleOverlayRef.current
    ) {
      // Remover listeners do círculo de endereço antes de removê-lo
      const existingListeners = overlayListenersRef.current.get(
        addressCircleOverlayRef.current
      );
      if (existingListeners) {
        existingListeners.forEach((listener) => {
          google.maps.event.removeListener(listener);
        });
        overlayListenersRef.current.delete(addressCircleOverlayRef.current);
      }
      // Remover círculo de endereço quando não há mais busca por endereço
      const circle = addressCircleOverlayRef.current;

      // Remover do mapa
      if (circle && circle.getMap()) {
        circle.setMap(null);
      }

      // Remover dos desenhos
      setDrawnOverlays((prev) => {
        return prev.filter((overlay) => {
          // Remover apenas o círculo de endereço (identificado pela referência)
          return overlay.overlay !== circle;
        });
      });

      // Limpar referência
      addressCircleOverlayRef.current = null;
      setAddressMarker(null);
      setAddressCenter(null);
    }
  }, [filters?.addressCoordinates, map, addOverlayListeners, isEditMode]);

  const fitMapToDrawingGeometries = useCallback(
    (
      geometries: Array<
        | { type: "Polygon"; coordinates: number[][][] }
        | { type: "circle"; coordinates: [[number, number]]; radius: string }
      >
    ) => {
      if (!map || geometries.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      let hasPoint = false;

      geometries.forEach((geom) => {
        if (geom.type === "Polygon") {
          const coords = geom.coordinates[0] || [];
          coords.forEach(([lng, lat]) => {
            bounds.extend({ lat, lng });
            hasPoint = true;
          });
        } else if (geom.type === "circle") {
          const coord = geom.coordinates[0];
          if (!coord) return;
          const [lng, lat] = coord;
          const radius = Number(geom.radius);
          if (isNaN(radius)) return;
          const circleBounds = new google.maps.Circle({
            center: { lat, lng },
            radius,
          }).getBounds();
          if (circleBounds) {
            bounds.extend(circleBounds.getNorthEast());
            bounds.extend(circleBounds.getSouthWest());
            hasPoint = true;
          }
        }
      });

      if (hasPoint) {
        map.fitBounds(bounds, 80);
      }
    },
    [map]
  );

  // Reidratar desenhos do filtro para overlays editáveis
  useEffect(() => {
    if (!map) return;

    const drawingGeometries = filters?.drawingGeometries || [];
    const geometriesKey = JSON.stringify(drawingGeometries);
    const nonAddressOverlays = drawnOverlays.filter(
      (overlay) => overlay.overlay !== addressCircleOverlayRef.current
    );

    if (drawingGeometries.length === 0) {
      drawingGeometriesKeyRef.current = geometriesKey;
      return;
    }

    // Verificar se os overlays existentes precisam ter draggable atualizado
    if (nonAddressOverlays.length === drawingGeometries.length) {
      // Atualizar draggable dos overlays existentes e garantir que listeners estão configurados
      let needsRecreation = false;
      nonAddressOverlays.forEach((overlay) => {
        const overlayInstance = overlay.overlay as
          | (google.maps.Polygon & { __rehydrated?: boolean })
          | (google.maps.Circle & { __rehydrated?: boolean })
          | null;
        if (overlayInstance) {
          const currentDraggable = overlayInstance.getDraggable?.() ?? false;
          if (currentDraggable !== isEditMode) {
            overlayInstance.setOptions({ draggable: isEditMode });
          }
          // Verificar se listeners existem, se não, readicionar
          if (!overlayListenersRef.current.has(overlayInstance)) {
            needsRecreation = true;
          }
        }
      });
      if (!needsRecreation) {
        drawingGeometriesKeyRef.current = geometriesKey;
        fitMapToDrawingGeometries(drawingGeometries);
        return;
      }
    }

    if (drawingGeometriesKeyRef.current === geometriesKey) {
      return;
    }

    // Limpar overlays existentes (exceto círculo de endereço)
    nonAddressOverlays.forEach((overlay) => {
      const overlayInstance = overlay.overlay as
        | google.maps.Polygon
        | google.maps.Circle
        | null;
      if (!overlayInstance) return;
      const listeners = overlayListenersRef.current.get(overlayInstance);
      if (listeners) {
        listeners.forEach((listener) => {
          google.maps.event.removeListener(listener);
        });
        overlayListenersRef.current.delete(overlayInstance);
      }
      if (typeof overlayInstance.setMap === "function") {
        overlayInstance.setMap(null);
      }
    });

    const newOverlays: google.maps.drawing.OverlayCompleteEvent[] = [];

    drawingGeometries.forEach((geom, index) => {
      if (geom.type === "Polygon") {
        const paths = (geom.coordinates[0] || []).map(([lng, lat]) => ({
          lat,
          lng,
        }));
        if (paths.length === 0) return;
        const polygon = new google.maps.Polygon({
          map,
          paths,
          fillColor: "#4285F4",
          fillOpacity: 0.2,
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: true,
          editable: true,
          draggable: isEditMode,
        });
        (
          polygon as unknown as {
            __drawingIndex?: number;
            __rehydrated?: boolean;
          }
        ).__drawingIndex = index;
        (polygon as unknown as { __rehydrated?: boolean }).__rehydrated = true;
        const fakeEvent = {
          type: google.maps.drawing.OverlayType.POLYGON,
          overlay: polygon,
        } as unknown as google.maps.drawing.OverlayCompleteEvent;
        addOverlayListeners(fakeEvent);
        newOverlays.push(fakeEvent);
      } else if (geom.type === "circle") {
        const coord = geom.coordinates[0];
        if (!coord) return;
        const [lng, lat] = coord;
        const radius = Number(geom.radius);
        if (isNaN(radius)) return;
        const circle = new google.maps.Circle({
          map,
          center: new google.maps.LatLng(lat, lng),
          radius,
          fillColor: "#4285F4",
          fillOpacity: 0.2,
          strokeColor: "#4285F4",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: true,
          editable: true,
          draggable: isEditMode,
        });
        (
          circle as unknown as {
            __drawingIndex?: number;
            __rehydrated?: boolean;
          }
        ).__drawingIndex = index;
        (circle as unknown as { __rehydrated?: boolean }).__rehydrated = true;
        const fakeEvent = {
          type: google.maps.drawing.OverlayType.CIRCLE,
          overlay: circle,
        } as unknown as google.maps.drawing.OverlayCompleteEvent;
        addOverlayListeners(fakeEvent);
        newOverlays.push(fakeEvent);
      }
    });

    if (newOverlays.length > 0) {
      setDrawnOverlays((prev) => {
        const kept = prev.filter(
          (overlay) => overlay.overlay === addressCircleOverlayRef.current
        );
        return [...kept, ...newOverlays];
      });
      fitMapToDrawingGeometries(drawingGeometries);
    }

    drawingGeometriesKeyRef.current = geometriesKey;
  }, [
    map,
    filters?.drawingGeometries,
    drawnOverlays,
    addOverlayListeners,
    isEditMode,
    fitMapToDrawingGeometries,
  ]);

  // Atualizar refs sempre que mudarem
  useEffect(() => {
    drawnOverlaysRef.current = drawnOverlays;
  }, [drawnOverlays]);

  useEffect(() => {
    drawnOverlays.forEach((overlay) => {
      const overlayInstance = overlay.overlay as
        | google.maps.Polygon
        | google.maps.Circle
        | null;
      if (overlayInstance && typeof overlayInstance.setOptions === "function") {
        const currentDraggable = overlayInstance.getDraggable?.() ?? false;
        if (currentDraggable !== isEditMode) {
          overlayInstance.setOptions({ draggable: isEditMode });
        }
        // Garantir que os listeners existem
        if (!overlayListenersRef.current.has(overlayInstance)) {
          addOverlayListeners(overlay);
        }
      }
    });
  }, [drawnOverlays, isEditMode, addOverlayListeners]);

  useEffect(() => {
    if (!drawnOverlays.length) return;
    drawnOverlays.forEach((overlay) => {
      const overlayInstance = overlay.overlay as
        | google.maps.Polygon
        | google.maps.Circle
        | null;
      if (!overlayInstance) return;
      if (!overlayListenersRef.current.has(overlayInstance)) {
        addOverlayListeners(overlay);
      }
    });
  }, [drawnOverlays, addOverlayListeners]);

  useEffect(() => {
    if (drawnOverlays.length === 0 && isEditMode) {
      setIsEditMode(false);
    }
  }, [drawnOverlays.length, isEditMode]);

  useEffect(() => {
    drawingManagerRef.current = drawingManager;
  }, [drawingManager]);

  useEffect(() => {
    if (!map) return;
    if (freehandActive) return;
    map.setOptions({ draggable: true, draggableCursor: undefined });
  }, [map, freehandActive]);

  // Limpar polígonos dos bairros quando os bairros mudarem
  // Isso previne que polígonos antigos fiquem no mapa quando os bairros são atualizados
  useEffect(() => {
    // Limpar polígonos antigos que não estão mais na lista atual
    const currentNeighborhoodIds = new Set(
      neighborhoodsForCityBounds.map((n) => n.id)
    );

    neighborhoodPolygonsRef.current.forEach((polygon, id) => {
      if (!currentNeighborhoodIds.has(id)) {
        // Remover polígono que não está mais na lista
        try {
          if (polygon && typeof polygon.setMap === "function") {
            // Verificar se o polígono ainda está no mapa antes de remover
            const map = polygon.getMap();
            if (map) {
              polygon.setMap(null);
            }
          }
        } catch {
          // Ignorar erros durante cleanup
        }
        neighborhoodPolygonsRef.current.delete(id);
      }
    });
  }, [
    neighborhoods,
    allNeighborhoodsForCityBounds,
    selectedNeighborhoodNames,
    selectedCityCodesKey,
  ]);

  useLayoutEffect(() => {
    const neighborhoodPolygons = neighborhoodPolygonsRef.current;
    const drawnOverlays = drawnOverlaysRef.current;
    const drawingManager = drawingManagerRef.current;

    const originalErrorHandler = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;

    const errorHandler = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      const messageStr = String(message || "");
      const sourceStr = String(source || "");
      const errorMessage = error?.message ? String(error.message) : "";
      const errorStack = error?.stack ? String(error.stack) : "";

      const isOverlayRemoveError =
        messageStr.includes("overlay.remove") ||
        messageStr.includes("remove is not a function") ||
        messageStr.includes("b.overlay.remove") ||
        messageStr.includes(".overlay.remove") ||
        messageStr.includes("overlay.remove is not a function") ||
        sourceStr.includes("overlay.js") ||
        errorMessage.includes("overlay.remove") ||
        errorMessage.includes("remove is not a function") ||
        errorMessage.includes("b.overlay.remove") ||
        errorStack.includes("overlay.remove") ||
        errorStack.includes("b.overlay.remove") ||
        errorStack.includes("map_changed") ||
        errorStack.includes("commitPassiveUnmountEffects");

      if (isOverlayRemoveError) {
        return true;
      }
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonMessage =
        reason && typeof reason === "object" && "message" in reason
          ? String(reason.message)
          : String(reason || "");
      const reasonStack =
        reason && typeof reason === "object" && "stack" in reason
          ? String(reason.stack)
          : "";

      const isOverlayRemoveError =
        reasonMessage.includes("overlay.remove") ||
        reasonMessage.includes("remove is not a function") ||
        reasonMessage.includes("b.overlay.remove") ||
        reasonMessage.includes(".overlay.remove") ||
        reasonMessage.includes("overlay.remove is not a function") ||
        reasonStack.includes("overlay.remove") ||
        reasonStack.includes("b.overlay.remove") ||
        reasonStack.includes("map_changed") ||
        reasonStack.includes("commitPassiveUnmountEffects");

      if (isOverlayRemoveError) {
        event.preventDefault();
        return;
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };

    window.onerror = errorHandler;
    window.addEventListener("unhandledrejection", rejectionHandler);

    return () => {
      // Limpar tooltip overlay primeiro
      try {
        const tooltipOverlay = tooltipOverlayRef.current;
        if (tooltipOverlay && typeof tooltipOverlay.setMap === "function") {
          tooltipOverlay.setMap(null);
        }
        tooltipOverlayRef.current = null;
      } catch {
        // Ignorar erros durante cleanup
      }

      // Desabilitar DrawingManager e limpar overlays internos
      try {
        if (drawingManager) {
          drawingManager.setDrawingMode(null);

          const manager = drawingManager as unknown as {
            overlays?: Array<{
              overlay?: {
                setMap?: (map: google.maps.Map | null) => void;
              };
            }>;
          };

          if (Array.isArray(manager.overlays)) {
            manager.overlays.forEach((item) => {
              if (item?.overlay?.setMap) {
                try {
                  item.overlay.setMap(null);
                } catch {
                  // Ignorar erros
                }
              }
            });
            manager.overlays = [];
          }
        }
      } catch {
        // Ignorar erros
      }

      // Limpar polígonos dos bairros
      try {
        neighborhoodPolygons.forEach((polygon) => {
          if (polygon && typeof polygon.setMap === "function") {
            try {
              polygon.setMap(null);
            } catch {
              // Ignorar erros
            }
          }
        });
        neighborhoodPolygons.clear();
      } catch {
        // Ignorar erros
      }

      // Remover overlays desenhados
      drawnOverlays.forEach((overlay) => {
        if (overlay?.overlay?.setMap) {
          try {
            overlay.overlay.setMap(null);
          } catch {
            // Ignorar erros
          }
        }
      });

      // Restaurar handlers de erro originais
      window.onerror = originalErrorHandler || null;
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  useEffect(() => {
    const overlayListeners = overlayListenersRef.current;
    const neighborhoodPolygons = neighborhoodPolygonsRef.current;
    const drawnOverlays = drawnOverlaysRef.current;
    const drawingManager = drawingManagerRef.current;
    const originalErrorHandler = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;

    window.onerror = (message, source, lineno, colno, error) => {
      const messageStr = String(message || "");
      const sourceStr = String(source || "");
      const errorMessage = error?.message ? String(error.message) : "";
      const errorStack = error?.stack ? String(error.stack) : "";

      const isOverlayRemoveError =
        messageStr.includes("overlay.remove") ||
        messageStr.includes("remove is not a function") ||
        messageStr.includes("b.overlay.remove") ||
        messageStr.includes(".overlay.remove") ||
        messageStr.includes("overlay.remove is not a function") ||
        messageStr.includes("overlay.remove") ||
        sourceStr.includes("overlay.js") ||
        sourceStr.includes("overlay") ||
        errorMessage.includes("overlay.remove") ||
        errorMessage.includes("remove is not a function") ||
        errorMessage.includes("b.overlay.remove") ||
        errorStack.includes("overlay.remove") ||
        errorStack.includes("b.overlay.remove") ||
        errorStack.includes("map_changed") ||
        errorStack.includes("commitPassiveUnmountEffects");

      if (isOverlayRemoveError) {
        return true;
      }
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonMessage =
        reason && typeof reason === "object" && "message" in reason
          ? String(reason.message)
          : String(reason || "");
      const reasonStack =
        reason && typeof reason === "object" && "stack" in reason
          ? String(reason.stack)
          : "";

      const isOverlayRemoveError =
        reasonMessage.includes("overlay.remove") ||
        reasonMessage.includes("remove is not a function") ||
        reasonMessage.includes("b.overlay.remove") ||
        reasonMessage.includes(".overlay.remove") ||
        reasonMessage.includes("overlay.remove is not a function") ||
        reasonStack.includes("overlay.remove") ||
        reasonStack.includes("b.overlay.remove") ||
        reasonStack.includes("map_changed") ||
        reasonStack.includes("commitPassiveUnmountEffects");

      if (isOverlayRemoveError) {
        event.preventDefault();
        return;
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };

    window.addEventListener("unhandledrejection", unhandledRejectionHandler);

    return () => {
      // Desabilitar DrawingManager
      try {
        if (drawingManager) {
          drawingManager.setDrawingMode(null);

          const manager = drawingManager as unknown as {
            overlays?: Array<{
              overlay?: {
                setMap?: (map: google.maps.Map | null) => void;
              };
            }>;
          };

          if (Array.isArray(manager.overlays)) {
            manager.overlays.forEach((item) => {
              if (item?.overlay?.setMap) {
                try {
                  item.overlay.setMap(null);
                } catch {
                  // Ignorar erros
                }
              }
            });
            manager.overlays = [];
          }
        }
      } catch {
        // Ignorar erros
      }

      // Remover overlays desenhados
      drawnOverlays.forEach((overlay) => {
        if (overlay?.overlay?.setMap) {
          try {
            overlay.overlay.setMap(null);
          } catch {
            // Ignorar erros
          }
        }
      });

      // Pequeno delay para garantir que o DrawingManager foi desabilitado
      // e que ele não tentará limpar overlays automaticamente
      setTimeout(() => {
        // Limpar círculo de endereço se existir
        if (addressCircleOverlayRef.current) {
          try {
            const circle = addressCircleOverlayRef.current;
            if (circle && typeof circle.setMap === "function") {
              circle.setMap(null);
            }
            addressCircleOverlayRef.current = null;
          } catch {
            // Ignorar erros silenciosamente durante cleanup
          }
        }

        // Limpar listeners do freehand (mouse e touch)
        try {
          if (mouseMoveListenerRef.current) {
            mouseMoveListenerRef.current.remove();
            mouseMoveListenerRef.current = null;
          }
          if (mouseDownListenerRef.current) {
            mouseDownListenerRef.current.remove();
            mouseDownListenerRef.current = null;
          }
          if (mouseUpListenerRef.current) {
            mouseUpListenerRef.current.remove();
            mouseUpListenerRef.current = null;
          }
          touchListenersRef.current?.remove();
          touchListenersRef.current = null;
        } catch {
          // Ignorar erros silenciosamente durante cleanup
        }

        // Limpar listener de tooltip
        try {
          if (tooltipMouseMoveListenerRef.current) {
            google.maps.event.removeListener(
              tooltipMouseMoveListenerRef.current
            );
            tooltipMouseMoveListenerRef.current = null;
          }
        } catch {
          // Ignorar erros silenciosamente durante cleanup
        }

        // Limpar tooltip overlay
        try {
          if (tooltipOverlayRef.current) {
            tooltipOverlayRef.current.setMap(null);
            tooltipOverlayRef.current = null;
          }
        } catch {
          // Ignorar erros silenciosamente durante cleanup
        }

        // Limpar timeout de busca
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = null;
        }

        // Limpar listeners de overlays
        // Usar a cópia feita no início do useEffect
        const listenersToClean = new Map(overlayListeners);
        listenersToClean.forEach((listeners) => {
          listeners.forEach((listener) => {
            google.maps.event.removeListener(listener);
          });
        });
        overlayListeners.clear();

        // Limpar timeout de atualização de overlay
        if (overlayUpdateTimeoutRef.current) {
          clearTimeout(overlayUpdateTimeoutRef.current);
          overlayUpdateTimeoutRef.current = null;
        }

        // Drawing manager já foi limpo no início do cleanup
        // Não precisa fazer nada aqui pois já removemos os overlays e desabilitamos o modo

        // Limpar freehand polyline
        try {
          if (freehandPolylineRef.current) {
            freehandPolylineRef.current.setMap(null);
            freehandPolylineRef.current = null;
          }
        } catch {
          // Ignorar erros silenciosamente durante cleanup
        }

        // Limpar polígonos dos bairros de forma segura
        try {
          neighborhoodPolygons.forEach((polygon) => {
            if (polygon && typeof polygon.setMap === "function") {
              try {
                polygon.setMap(null);
              } catch {
                // Ignorar erros durante cleanup
              }
            }
          });
          neighborhoodPolygons.clear();
        } catch {
          // Ignorar erros silenciosamente durante cleanup
        }

        // Restaurar handlers de erro originais
        window.onerror = originalErrorHandler || null;
        window.removeEventListener(
          "unhandledrejection",
          unhandledRejectionHandler
        );
      }, 0);
    };
  }, []); // Executar apenas uma vez no mount/unmount

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

  // Se o mapa ainda não foi carregado ou se a biblioteca de drawing não está disponível
  if (
    !isLoaded ||
    typeof window === "undefined" ||
    !window.google ||
    !window.google.maps ||
    !window.google.maps.drawing
  ) {
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

  // Constante segura para acessar OverlayType (já verificamos que está disponível acima)
  const OverlayType = window.google.maps.drawing.OverlayType;

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
          minZoom: 3, // Zoom mínimo (mostra continente)
          maxZoom: 20, // Zoom máximo (evita zoom extremo)
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {map && (
          <DrawingManager
            key="drawing-manager"
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
                draggable: isEditMode,
              },
              circleOptions: {
                fillColor: "#4285F4",
                fillOpacity: 0.2,
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                clickable: true,
                editable: true,
                draggable: isEditMode,
              },
              // Retângulo foi substituído por desenho livre
            }}
          />
        )}

        {/* Polígonos dos bairros - mostrar todos os bairros disponíveis */}
        {/* Usar allNeighborhoodsForCityBounds como fonte principal (sempre tem todos os bairros) */}
        {/* Se não houver, usar neighborhoods como fallback */}
        {/* Ocultar quando há um desenho ativo para não poluir o mapa */}
        {(!filters?.drawingGeometries ||
          filters.drawingGeometries.length === 0) &&
          (() => {
            // Priorizar allNeighborhoodsForCityBounds (sempre tem todos os bairros)
            // Se não houver, usar neighborhoods como fallback
            const neighborhoodsToShow = neighborhoodsForCityBounds;

            const allNeighborhoods = neighborhoodsToShow;

            // Filtrar bairros válidos antes de renderizar
            return allNeighborhoods
              .filter((neighborhood) => {
                // Verificar se o bairro tem dados geoespaciais válidos
                return (
                  neighborhood.geo &&
                  neighborhood.geo.coordinates &&
                  Array.isArray(neighborhood.geo.coordinates) &&
                  neighborhood.geo.coordinates.length > 0 &&
                  Array.isArray(neighborhood.geo.coordinates[0]) &&
                  neighborhood.geo.coordinates[0].length > 0
                );
              })
              .map((neighborhood) => {
                // Converter coordenadas GeoJSON para formato do Google Maps
                // GeoJSON usa [lon, lat], Google Maps usa {lat, lng}
                const paths =
                  neighborhood.geo?.coordinates?.[0]
                    ?.map((coord) => {
                      // Validar coordenadas antes de adicionar
                      if (
                        !Array.isArray(coord) ||
                        coord.length < 2 ||
                        typeof coord[0] !== "number" ||
                        typeof coord[1] !== "number"
                      ) {
                        return null;
                      }
                      const lng = coord[0];
                      const lat = coord[1];
                      // Validar se as coordenadas estão dentro dos limites válidos
                      if (!isValidCoordinate({ lat, lng })) {
                        return null;
                      }
                      return {
                        lat,
                        lng,
                      };
                    })
                    .filter(
                      (coord): coord is { lat: number; lng: number } =>
                        coord !== null
                    ) || [];

                // Se não há paths válidos após a filtragem, não renderizar
                if (paths.length === 0) return null;

                // Verificar se o bairro está selecionado
                const isSelected = selectedNeighborhoodNames.includes(
                  neighborhood.name
                );

                // Desabilitar cliques e hovers quando um modo de desenho estiver ativo
                const isDrawingActive = drawingMode !== null || freehandActive;

                return (
                  <Polygon
                    key={`neighborhood-${neighborhood.id}`}
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

        {/* Marcador do endereço (quando há busca por endereço) */}
        {/* O círculo é criado automaticamente como desenho editável no useEffect */}
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
                          <Bathtub
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
                    {selectedProperty.parking &&
                      selectedProperty.parking > 0 && (
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
                            {selectedProperty.parking}
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

      {/* Botão Estatísticas - centralizado no topo (desktop); à direita com 20px no mobile */}
      {useMapSearch && token && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 60,
            left: "auto",
            transform: "none",
            zIndex: 2000,
            pointerEvents: "auto",
          }}
        >
          <Paper
            elevation={2}
            sx={{
              borderRadius: 1,
              overflow: "hidden",
              backgroundColor: theme.palette.common.white,
              border: `1px solid ${theme.palette.divider}`,
              pointerEvents: "auto",
            }}
          >
            <IconButton
              onClick={handleStatisticsClick}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={handleStatisticsTouchEnd}
              title="Ver estatísticas dos imóveis filtrados"
              aria-label="Estatísticas"
              sx={{
                width: 40,
                height: 40,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.common.white,
                pointerEvents: "auto",
                touchAction: "manipulation",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.primary.main,
                },
              }}
            >
              <BarChart />
            </IconButton>
          </Paper>
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
                drawingMode === OverlayType.POLYGON ? "contained" : "outlined"
              }
              size="small"
              onClick={() =>
                setDrawingModeHandler(
                  drawingMode === OverlayType.POLYGON
                    ? null
                    : OverlayType.POLYGON
                )
              }
              sx={{
                minWidth: 18,
                height: 18,
                borderRadius: 0.25,
                backgroundColor:
                  drawingMode === OverlayType.POLYGON
                    ? theme.palette.primary.main
                    : "transparent",
                color:
                  drawingMode === OverlayType.POLYGON
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                borderColor: theme.palette.divider,
                "&:hover": {
                  backgroundColor:
                    drawingMode === OverlayType.POLYGON
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
                drawingMode === OverlayType.CIRCLE ? "contained" : "outlined"
              }
              size="small"
              onClick={() =>
                setDrawingModeHandler(
                  drawingMode === OverlayType.CIRCLE ? null : OverlayType.CIRCLE
                )
              }
              sx={{
                minWidth: 18,
                height: 18,
                borderRadius: 0.25,
                backgroundColor:
                  drawingMode === OverlayType.CIRCLE
                    ? theme.palette.primary.main
                    : "transparent",
                color:
                  drawingMode === OverlayType.CIRCLE
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                borderColor: theme.palette.divider,
                "&:hover": {
                  backgroundColor:
                    drawingMode === OverlayType.CIRCLE
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

            {/* Botão Editar (mover desenhos) */}
            {drawnOverlays.length > 0 && (
              <Button
                variant={isEditMode ? "contained" : "outlined"}
                size="small"
                onClick={() => setIsEditMode((prev) => !prev)}
                title={
                  isEditMode ? "Desativar edição" : "Ativar edição dos desenhos"
                }
                aria-label="Editar desenhos"
                sx={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 0.25,
                  backgroundColor: isEditMode
                    ? theme.palette.primary.main
                    : "transparent",
                  color: isEditMode
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
                  borderColor: theme.palette.divider,
                  "&:hover": {
                    backgroundColor: isEditMode
                      ? theme.palette.primary.dark
                      : theme.palette.action.hover,
                  },
                }}
              >
                <OpenWith fontSize="inherit" />
              </Button>
            )}

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

      {/* Popover de estatísticas - z-index acima do modal do mapa em telas touch */}
      <Popover
        open={Boolean(statisticsAnchorEl)}
        anchorEl={statisticsAnchorEl}
        onClose={() => setStatisticsAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disableRestoreFocus
        slotProps={{
          root: {
            sx: { zIndex: theme.zIndex.modal + 20 },
          },
        }}
      >
        <Box sx={{ pointerEvents: "auto", p: 2, minWidth: 220 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.primary.main }}
          >
            Estatísticas dos imóveis
          </Typography>
          {statisticsLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">Carregando...</Typography>
            </Box>
          ) : statisticsData ? (
            <Stack spacing={0.75}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Preço médio
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {formatStatCurrency(statisticsData.avgPrice)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Área total média
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {formatStatNumber(statisticsData.avgTotalArea)} m²
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Área útil média
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {formatStatNumber(statisticsData.avgUsableArea)} m²
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Preço/m² (total)
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {formatStatCurrency(statisticsData.avgTotalPricePerArea)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Preço/m² (útil)
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {formatStatCurrency(statisticsData.avgUsablePricePerArea)}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Nenhum dado disponível para os filtros atuais.
            </Typography>
          )}
        </Box>
      </Popover>
    </Box>
  );
}

export default MapComponent;
