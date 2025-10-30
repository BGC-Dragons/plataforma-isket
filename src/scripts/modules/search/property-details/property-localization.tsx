import { useCallback } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Box, Typography, useTheme } from "@mui/material";
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

export function PropertyLocalization({
  property,
  height = 300,
}: PropertyLocalizationProps) {
  const theme = useTheme();

  // Carrega o script do Google Maps com ID único para evitar conflitos
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_CONFIG.MAPS_API_KEY,
    libraries: ["places"],
    id: "google-maps-script-property-localization-v2",
  });

  // Callback quando o mapa é carregado
  const onMapLoad = useCallback(() => {
    // Mapa carregado com sucesso
  }, []);

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
      </GoogleMap>
    </Box>
  );
}

export default PropertyLocalization;
