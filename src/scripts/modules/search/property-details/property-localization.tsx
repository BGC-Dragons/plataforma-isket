import { useCallback, useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Box, Typography, useTheme, Stack, Chip } from "@mui/material";
import {
  Restaurant,
  LocalPharmacy,
  School,
  LocalHospital,
  ShoppingCart,
  LocalGasStation,
  AccountBalance,
  Park,
} from "@mui/icons-material";
import { GOOGLE_CONFIG } from "../../../config/google.constant";

// Interface para coordenadas
interface Coordinates {
  lat: number;
  lng: number;
}

// Interface para os dados da propriedade
interface PropertyLocalizationData {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  coordinates?: Coordinates;
}

interface PropertyLocalizationProps {
  property: PropertyLocalizationData;
  height?: string | number;
}

// Interface para POI
interface POI {
  placeId: string;
  name: string;
  location: Coordinates;
  type: string;
  rating?: number;
}

// Tipos de POI disponíveis
type POICategory =
  | "restaurant"
  | "pharmacy"
  | "school"
  | "hospital"
  | "supermarket"
  | "gas_station"
  | "bank"
  | "park";

// Configuração das categorias de POI
const POI_CATEGORIES: Record<
  POICategory,
  { label: string; icon: React.ReactElement; color: string }
> = {
  restaurant: {
    label: "Restaurantes",
    icon: <Restaurant />,
    color: "#FF6B6B",
  },
  pharmacy: {
    label: "Farmácias",
    icon: <LocalPharmacy />,
    color: "#4ECDC4",
  },
  school: {
    label: "Escolas",
    icon: <School />,
    color: "#45B7D1",
  },
  hospital: {
    label: "Hospitais",
    icon: <LocalHospital />,
    color: "#FFA07A",
  },
  supermarket: {
    label: "Supermercados",
    icon: <ShoppingCart />,
    color: "#98D8C8",
  },
  gas_station: {
    label: "Postos",
    icon: <LocalGasStation />,
    color: "#F7DC6F",
  },
  bank: {
    label: "Bancos",
    icon: <AccountBalance />,
    color: "#BB8FCE",
  },
  park: {
    label: "Parques",
    icon: <Park />,
    color: "#52BE80",
  },
};

// Configurações do mapa
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Coordenadas padrão para Curitiba (fallback)
const defaultCenter = {
  lat: -25.4284,
  lng: -49.2733,
};

const defaultZoom = 15;
const POI_SEARCH_RADIUS = 2000; // 2km em metros

export function PropertyLocalization({
  property,
  height = 300,
}: PropertyLocalizationProps) {
  const theme = useTheme();

  // Estados para POIs
  const [selectedCategories, setSelectedCategories] = useState<
    Set<POICategory>
  >(new Set());
  const [pois, setPois] = useState<Map<POICategory, POI[]>>(new Map());
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );

  // Carrega o script do Google Maps com ID único para evitar conflitos
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_CONFIG.MAPS_API_KEY,
    libraries: ["places"],
    id: "google-maps-script-property-localization-v2",
  });

  // Inicializar PlacesService quando o mapa estiver carregado
  useEffect(() => {
    if (isLoaded && mapInstance && window.google?.maps?.places) {
      placesServiceRef.current = new google.maps.places.PlacesService(
        mapInstance
      );
    }
  }, [isLoaded, mapInstance]);

  // Callback quando o mapa é carregado
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  // Função para buscar POIs de uma categoria
  const searchPOIs = useCallback(
    (category: POICategory) => {
      if (!placesServiceRef.current || !property.coordinates) return;

      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(
          property.coordinates.lat,
          property.coordinates.lng
        ),
        radius: POI_SEARCH_RADIUS,
        type: category,
      };

      placesServiceRef.current.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const newPois: POI[] = results.map((place) => ({
            placeId: place.place_id || "",
            name: place.name || "",
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            type: category,
            rating: place.rating,
          }));

          setPois((prev) => {
            const updated = new Map(prev);
            updated.set(category, newPois);
            return updated;
          });
        } else if (
          status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          // Nenhum resultado encontrado
          setPois((prev) => {
            const updated = new Map(prev);
            updated.set(category, []);
            return updated;
          });
        }
      });
    },
    [property.coordinates]
  );

  // Função para alternar categoria
  const toggleCategory = useCallback(
    (category: POICategory) => {
      setSelectedCategories((prev) => {
        const updated = new Set(prev);
        if (updated.has(category)) {
          updated.delete(category);
          // Remover POIs da categoria
          setPois((current) => {
            const newMap = new Map(current);
            newMap.delete(category);
            return newMap;
          });
        } else {
          updated.add(category);
          // Buscar POIs da categoria
          searchPOIs(category);
        }
        return updated;
      });
    },
    [searchPOIs]
  );

  // Determina o centro do mapa baseado nas coordenadas da propriedade
  const mapCenter = property.coordinates || defaultCenter;

  // Se houver erro ao carregar o mapa
  if (loadError) {
    console.error("Erro ao carregar Google Maps:", loadError);
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
      {/* Botões de categorias de POI */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          p: 1,
          boxShadow: theme.shadows[4],
          maxWidth: "calc(100% - 20px)",
          overflowX: "auto",
          "&::-webkit-scrollbar": {
            height: 6,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: theme.palette.grey[200],
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.grey[400],
            borderRadius: 3,
            "&:hover": {
              backgroundColor: theme.palette.grey[600],
            },
          },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
          {(Object.keys(POI_CATEGORIES) as POICategory[]).map((category) => {
            const categoryConfig = POI_CATEGORIES[category];
            const isSelected = selectedCategories.has(category);
            return (
              <Chip
                key={category}
                icon={categoryConfig.icon}
                label={categoryConfig.label}
                onClick={() => toggleCategory(category)}
                sx={{
                  backgroundColor: isSelected
                    ? categoryConfig.color
                    : theme.palette.grey[200],
                  color: isSelected
                    ? theme.palette.common.white
                    : theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: isSelected
                      ? categoryConfig.color
                      : theme.palette.grey[300],
                    opacity: 0.9,
                  },
                  cursor: "pointer",
                  fontWeight: isSelected ? 600 : 400,
                  transition: "all 0.2s ease-in-out",
                }}
              />
            );
          })}
        </Stack>
      </Box>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={defaultZoom}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy", // Permite zoom com scroll sem precisar de Ctrl
        }}
      >
        {/* Marcador da propriedade */}
        {property.coordinates && (
          <Marker
            position={property.coordinates}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                 <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24c0-8.837-7.163-16-16-16z" fill="${theme.palette.primary.main}"/>
                   <circle cx="16" cy="16" r="8" fill="white"/>
                   <text x="16" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${theme.palette.primary.main}">P</text>
                 </svg>
               `)}`,
              scaledSize: new google.maps.Size(32, 40),
              anchor: new google.maps.Point(16, 40),
            }}
          />
        )}

        {/* Marcadores de POIs */}
        {Array.from(pois.entries()).map(([category, categoryPois]) => {
          const categoryConfig = POI_CATEGORIES[category];
          return categoryPois.map((poi) => (
            <Marker
              key={poi.placeId}
              position={poi.location}
              title={poi.name}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 12 12 18 12 18s12-6 12-18c0-6.627-5.373-12-12-12z" fill="${categoryConfig.color}"/>
                    <circle cx="12" cy="12" r="6" fill="white"/>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(24, 30),
                anchor: new google.maps.Point(12, 30),
              }}
            />
          ));
        })}
      </GoogleMap>
    </Box>
  );
}

export default PropertyLocalization;
