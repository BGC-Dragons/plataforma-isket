import { Box, Typography, Container, useTheme } from "@mui/material";
import MapComponent from "../../../modules/search/map/map";

// Interface para os dados das propriedades
interface PropertyData {
  id: string;
  title?: string;
  price: number;
  pricePerSquareMeter: number;
  address: string;
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  images: string[];
  isFavorite?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Dados mockados das propriedades com coordenadas específicas
const mockPropertiesWithCoordinates: PropertyData[] = [
  {
    id: "1",
    title: "Sala Comercial Centro",
    price: 145000,
    pricePerSquareMeter: 5370.37,
    address: "Rua Marechal Deodoro, 235, Centro",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 1,
    bathrooms: 1,
    area: 24,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400",
    ],
    isFavorite: false,
    coordinates: {
      lat: -25.4284,
      lng: -49.2733,
    },
  },
  {
    id: "2",
    title: "Apartamento Residencial",
    price: 320000,
    pricePerSquareMeter: 8500.0,
    address: "Rua das Flores, 123, Batel",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 3,
    bathrooms: 2,
    area: 85,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    ],
    isFavorite: true,
    coordinates: {
      lat: -25.435,
      lng: -49.27,
    },
  },
  {
    id: "3",
    title: "Casa Residencial",
    price: 450000,
    pricePerSquareMeter: 3200.0,
    address: "Rua das Palmeiras, 456, Bigorrilho",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 4,
    bathrooms: 3,
    area: 140,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400",
    ],
    isFavorite: false,
    coordinates: {
      lat: -25.42,
      lng: -49.28,
    },
  },
  {
    id: "4",
    title: "Terreno Comercial",
    price: 180000,
    pricePerSquareMeter: 1200.0,
    address: "Rua Comercial, 789, Centro",
    city: "CURITIBA",
    state: "PR",
    propertyType: "TERRENO",
    bedrooms: 0,
    bathrooms: 0,
    area: 150,
    images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400"],
    isFavorite: false,
    coordinates: {
      lat: -25.44,
      lng: -49.26,
    },
  },
  {
    id: "5",
    title: "Loja Comercial",
    price: 280000,
    pricePerSquareMeter: 7000.0,
    address: "Rua do Comércio, 321, Batel",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 0,
    bathrooms: 1,
    area: 40,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400",
    ],
    isFavorite: true,
    coordinates: {
      lat: -25.43,
      lng: -49.275,
    },
  },
  {
    id: "6",
    title: "Apartamento Luxo",
    price: 650000,
    pricePerSquareMeter: 12000.0,
    address: "Rua das Acácias, 654, Batel",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 3,
    bathrooms: 3,
    area: 120,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    ],
    isFavorite: false,
    coordinates: {
      lat: -25.425,
      lng: -49.265,
    },
  },
];

export function MapExamplePage() {
  const theme = useTheme();

  const handlePropertyClick = (propertyId: string) => {
    console.log("Propriedade clicada:", propertyId);
    // Aqui você pode navegar para a página de detalhes da propriedade
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        py: 3,
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 2,
            textAlign: "center",
          }}
        >
          Mapa de Propriedades
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 4,
            textAlign: "center",
            maxWidth: 600,
            mx: "auto",
          }}
        >
          Explore as propriedades disponíveis no mapa interativo. Clique nos
          marcadores para ver mais detalhes de cada imóvel.
        </Typography>

        <Box
          sx={{
            height: 600,
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: theme.shadows[4],
          }}
        >
          <MapComponent
            properties={mockPropertiesWithCoordinates}
            onPropertyClick={handlePropertyClick}
            height="100%"
            center={{
              lat: -25.4284, // Curitiba
              lng: -49.2733,
            }}
            zoom={13}
          />
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            Legenda dos Marcadores
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 3,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.main,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                Residencial
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: theme.palette.error.main,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                Comercial
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: theme.palette.success.main,
                }}
              />
              <Typography variant="body2" fontWeight={600}>
                Terreno
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default MapExamplePage;
