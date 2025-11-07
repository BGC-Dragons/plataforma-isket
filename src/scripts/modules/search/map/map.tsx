import { useCallback, useState, useMemo, useRef, useEffect } from "react";
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
  properties: PropertyData[];
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
}

// Coordenadas mockadas para Curitiba e região
const getMockCoordinates = (): { lat: number; lng: number } => {
  // Coordenadas base para Curitiba
  const baseLat = -25.4284;
  const baseLng = -49.2733;

  // Gera coordenadas aleatórias próximas ao centro de Curitiba
  const randomLat = baseLat + (Math.random() - 0.5) * 0.1;
  const randomLng = baseLng + (Math.random() - 0.5) * 0.1;

  return {
    lat: randomLat,
    lng: randomLng,
  };
};

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

export function MapComponent({
  properties,
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
}: MapProps) {
  const theme = useTheme();
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(
    null
  );
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
  // Carrega o script do Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_CONFIG.MAPS_API_KEY,
    libraries: ["places", "drawing", "geometry"],
    id: "google-maps-script",
  });

  // Adiciona coordenadas mockadas às propriedades
  const propertiesWithCoordinates = useMemo(() => {
    return properties.map((property) => ({
      ...property,
      coordinates: property.coordinates || getMockCoordinates(),
    }));
  }, [properties]);

  // Refs para rastrear o centro e zoom anteriores
  const previousCenterRef = useRef<{ lat: number; lng: number } | undefined>(center);
  const previousZoomRef = useRef<number | undefined>(zoom);

  // Callback quando o mapa é carregado
  const onMapLoad = useCallback((loadedMap: google.maps.Map) => {
    setMap(loadedMap);
    // Definir centro e zoom iniciais
    previousCenterRef.current = center;
    previousZoomRef.current = zoom;
  }, [center, zoom]);

  // Efeito para animar o mapa quando center ou zoom mudarem
  useEffect(() => {
    if (!map || !center || zoom === undefined) return;

    // Verificar se o centro ou zoom realmente mudaram
    const centerChanged =
      !previousCenterRef.current ||
      previousCenterRef.current.lat !== center.lat ||
      previousCenterRef.current.lng !== center.lng;

    const zoomChanged = previousZoomRef.current !== zoom;

    // Se não houve mudança, não fazer nada
    if (!centerChanged && !zoomChanged) return;

    // Coletar coordenadas de bairros e cidades para fitBounds
    const allCoordinates: google.maps.LatLng[] = [];

    // Adicionar coordenadas dos bairros selecionados
    const neighborhoodsToFit = neighborhoods.filter((neighborhood) =>
      selectedNeighborhoodNames.length === 0 ||
      selectedNeighborhoodNames.includes(neighborhood.name)
    );

    neighborhoodsToFit.forEach((neighborhood) => {
      const coords = neighborhood.geo?.coordinates?.[0];
      if (coords && coords.length > 0) {
        coords.forEach((coord) => {
          allCoordinates.push(
            new google.maps.LatLng(coord[1], coord[0]) // lat, lng
          );
        });
      }
    });

    // Adicionar coordenadas das cidades selecionadas
    const citiesToFit = cities.filter((city) =>
      selectedCityCodes.length === 0 ||
      selectedCityCodes.includes(city.cityStateCode)
    );

    citiesToFit.forEach((city) => {
      if (!city.geo?.geometry) return;
      
      const geometry = city.geo.geometry;
      if (geometry.type === "Polygon") {
        const coords = geometry.coordinates as number[][][];
        coords[0]?.forEach((coord) => {
          allCoordinates.push(
            new google.maps.LatLng(coord[1], coord[0]) // lat, lng
          );
        });
      } else if (geometry.type === "MultiPolygon") {
        const coords = geometry.coordinates as number[][][][];
        coords[0]?.[0]?.forEach((coord) => {
          allCoordinates.push(
            new google.maps.LatLng(coord[1], coord[0]) // lat, lng
          );
        });
      }
    });

    // Se há coordenadas, usar fitBounds para animação suave
    if (allCoordinates.length > 0) {
      // Criar bounds a partir das coordenadas
      const bounds = new google.maps.LatLngBounds();
      allCoordinates.forEach((coord) => {
        bounds.extend(coord);
      });

      // Usar fitBounds com padding para uma melhor visualização
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });

      // Atualizar refs
      previousCenterRef.current = center;
      previousZoomRef.current = zoom;
      return;
    }

    // Se não há bairros ou não foi possível criar bounds, usar panTo e setZoom
    // panTo já tem animação suave por padrão
    if (centerChanged && zoomChanged) {
      // Se ambos mudaram, fazer panTo primeiro e depois zoom para animação mais suave
      map.panTo(new google.maps.LatLng(center.lat, center.lng));
      // Usar setTimeout para fazer zoom após o pan começar
      setTimeout(() => {
        if (map) {
          map.setZoom(zoom);
        }
      }, 100);
    } else if (centerChanged) {
      map.panTo(new google.maps.LatLng(center.lat, center.lng));
    } else if (zoomChanged) {
      map.setZoom(zoom);
    }

    // Atualizar refs
    previousCenterRef.current = center;
    previousZoomRef.current = zoom;
  }, [map, center, zoom, neighborhoods, selectedNeighborhoodNames, cities, selectedCityCodes]);

  // Callback quando o mapa é clicado
  const onMapClick = useCallback(() => {
    setSelectedProperty(null);
  }, []);

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
        overlay.overlay.setMap(null);
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
      } else {
        console.log("🎨 DrawingManager ainda não carregado");
      }
    }, 100);
  };

  // Callback quando um marcador é clicado
  const onMarkerClick = useCallback((property: PropertyData) => {
    setSelectedProperty(property);
  }, []);

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
        center={center}
        zoom={zoom}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
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

        {/* Polígonos das cidades selecionadas */}
        {cities
          .filter((city) =>
            selectedCityCodes.length === 0 ||
            selectedCityCodes.includes(city.cityStateCode)
          )
          .map((city) => {
            // Converter coordenadas GeoJSON para formato do Google Maps
            // GeoJSON usa [lon, lat], Google Maps usa {lat, lng}
            // Suporta tanto Polygon quanto MultiPolygon
            if (!city.geo?.geometry) return null;
            
            const geometry = city.geo.geometry;
            let paths: { lat: number; lng: number }[] = [];
            
            if (geometry.type === "Polygon") {
              // Polygon: coordinates é number[][][]
              const coords = geometry.coordinates as number[][][];
              paths = coords[0]?.map((coord) => ({
                lat: coord[1], // latitude
                lng: coord[0], // longitude
              })) || [];
            } else if (geometry.type === "MultiPolygon") {
              // MultiPolygon: coordinates é number[][][][]
              // Pegamos o primeiro polígono do MultiPolygon
              const coords = geometry.coordinates as number[][][][];
              paths = coords[0]?.[0]?.map((coord) => ({
                lat: coord[1], // latitude
                lng: coord[0], // longitude
              })) || [];
            }

            if (paths.length === 0) return null;

            return (
              <Polygon
                key={city.id}
                paths={paths}
                options={{
                  fillColor: theme.palette.primary.main,
                  fillOpacity: 0.15,
                  strokeColor: theme.palette.primary.main,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  clickable: false,
                  editable: false,
                  draggable: false,
                  zIndex: 0, // Cidades ficam atrás dos bairros
                }}
              />
            );
          })}

        {/* Polígonos dos bairros selecionados ou todos os bairros para delimitar cidade */}
        {/* Se há bairros selecionados, mostrar apenas esses */}
        {neighborhoods.length > 0 && neighborhoods
          .filter((neighborhood) =>
            selectedNeighborhoodNames.length === 0 ||
            selectedNeighborhoodNames.includes(neighborhood.name)
          )
          .map((neighborhood) => {
            // Converter coordenadas GeoJSON para formato do Google Maps
            // GeoJSON usa [lon, lat], Google Maps usa {lat, lng}
            const paths =
              neighborhood.geo?.coordinates?.[0]?.map((coord) => ({
                lat: coord[1], // latitude
                lng: coord[0], // longitude
              })) || [];

            if (paths.length === 0) return null;

            return (
              <Polygon
                key={neighborhood.id}
                paths={paths}
                options={{
                  fillColor: theme.palette.primary.main,
                  fillOpacity: 0.15,
                  strokeColor: theme.palette.primary.main,
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  clickable: false,
                  editable: false,
                  draggable: false,
                  zIndex: 1, // Bairros ficam na frente das cidades
                }}
              />
            );
          })}


        {/* Marcadores das propriedades */}
        {propertiesWithCoordinates.map((property) => (
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
