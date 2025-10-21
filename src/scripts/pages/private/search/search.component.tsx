import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  useTheme,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { FilterBar } from "../../../modules/search/filter-bar";
import { PropertiesCard } from "../../../modules/search/properties-card";

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
}

// Interface para o estado dos filtros
interface FilterState {
  search: string;
  cities: string[];
  neighborhoods: string[];
  business: string[];
  purpose: string[];
  propertyTypes: {
    apartments: string[];
    commercial: string[];
    houses: string[];
    lands: string[];
    others: string[];
  };
  rooms: {
    bedrooms: number | null;
    bathrooms: number | null;
    suites: number | null;
    garage: number | null;
  };
  area: { min: number; max: number };
  price: { min: number; max: number };
  advertiserType: string[];
}

// Dados mockados das propriedades
const mockProperties: PropertyData[] = [
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
  },
];

// Dados mockados de bairros por cidade
const mockNeighborhoods: Record<string, string[]> = {
  CURITIBA: [
    "Centro",
    "Batel",
    "Bigorrilho",
    "Mercês",
    "Alto da XV",
    "Cristo Rei",
    "Bom Retiro",
    "Santa Felicidade",
    "Portão",
    "Campo Comprido",
  ],
  "SÃO PAULO": [
    "Vila Madalena",
    "Pinheiros",
    "Itaim Bibi",
    "Jardins",
    "Vila Olímpia",
    "Moema",
    "Brooklin",
    "Vila Nova Conceição",
  ],
  "RIO DE JANEIRO": [
    "Copacabana",
    "Ipanema",
    "Leblon",
    "Botafogo",
    "Flamengo",
    "Laranjeiras",
    "Catete",
    "Glória",
  ],
};

type SortOption =
  | "relevance"
  | "price-per-m2-asc"
  | "price-per-m2-desc"
  | "price-asc"
  | "price-desc"
  | "area-asc"
  | "area-desc";

export function SearchComponent() {
  const theme = useTheme();
  const [properties] = useState<PropertyData[]>(mockProperties);
  const [filteredProperties, setFilteredProperties] =
    useState<PropertyData[]>(mockProperties);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  // Função para carregar bairros (mockada)
  const loadNeighborhoods = useCallback(
    async (city: string): Promise<string[]> => {
      // Simula delay de API
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockNeighborhoods[city] || [];
    },
    []
  );

  // Função para ordenar propriedades
  const sortProperties = useCallback(
    (properties: PropertyData[], sortBy: SortOption) => {
      const sorted = [...properties];

      switch (sortBy) {
        case "price-per-m2-asc":
          return sorted.sort(
            (a, b) => a.pricePerSquareMeter - b.pricePerSquareMeter
          );
        case "price-per-m2-desc":
          return sorted.sort(
            (a, b) => b.pricePerSquareMeter - a.pricePerSquareMeter
          );
        case "price-asc":
          return sorted.sort((a, b) => a.price - b.price);
        case "price-desc":
          return sorted.sort((a, b) => b.price - a.price);
        case "area-asc":
          return sorted.sort((a, b) => a.area - b.area);
        case "area-desc":
          return sorted.sort((a, b) => b.area - a.area);
        default:
          return sorted;
      }
    },
    []
  );

  // Função para aplicar filtros
  const applyFilters = useCallback(
    (filters: FilterState) => {
      setLoading(true);

      // Simula delay de processamento
      setTimeout(() => {
        let filtered = [...properties];

        // Filtro por busca
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (property) =>
              property.title?.toLowerCase().includes(searchLower) ||
              property.address.toLowerCase().includes(searchLower) ||
              property.city.toLowerCase().includes(searchLower)
          );
        }

        // Filtro por cidade
        if (filters.cities.length > 0) {
          filtered = filtered.filter((property) =>
            filters.cities.includes(property.city)
          );
        }

        // Filtro por negócio
        if (filters.business.length > 0) {
          // Para demonstração, assumimos que todas as propriedades são para venda
          // Em uma implementação real, isso viria dos dados
          if (filters.business.includes("venda")) {
            // Mantém todas as propriedades (todas são para venda)
          }
          if (filters.business.includes("aluguel")) {
            // Remove todas (nenhuma é para aluguel neste mock)
            filtered = [];
          }
        }

        // Filtro por finalidade
        if (filters.purpose.length > 0) {
          filtered = filtered.filter((property) =>
            filters.purpose.includes(property.propertyType.toLowerCase())
          );
        }

        // Filtro por área
        if (filters.area.min > 0 || filters.area.max < 1000000) {
          filtered = filtered.filter(
            (property) =>
              property.area >= filters.area.min &&
              property.area <= filters.area.max
          );
        }

        // Filtro por preço
        if (filters.price.min > 0 || filters.price.max < 100000000) {
          filtered = filtered.filter(
            (property) =>
              property.price >= filters.price.min &&
              property.price <= filters.price.max
          );
        }

        // Filtro por quartos
        if (filters.rooms.bedrooms !== null) {
          filtered = filtered.filter(
            (property) => (property.bedrooms || 0) >= filters.rooms.bedrooms!
          );
        }

        // Filtro por banheiros
        if (filters.rooms.bathrooms !== null) {
          filtered = filtered.filter(
            (property) => (property.bathrooms || 0) >= filters.rooms.bathrooms!
          );
        }

        // Aplicar ordenação
        const sorted = sortProperties(filtered, sortBy);

        setFilteredProperties(sorted);
        setLoading(false);
      }, 500);
    },
    [properties, sortBy, sortProperties]
  );

  // Função para lidar com mudança de ordenação
  const handleSortChange = (newSortBy: SortOption) => {
    setSortBy(newSortBy);
    const sorted = sortProperties(filteredProperties, newSortBy);
    setFilteredProperties(sorted);
  };

  // Função para alternar favorito
  const handleFavoriteToggle = (propertyId: string) => {
    setFilteredProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? { ...property, isFavorite: !property.isFavorite }
          : property
      )
    );
  };

  // Função para compartilhar
  const handleShare = (propertyId: string) => {
    console.log("Compartilhando propriedade:", propertyId);
    // Implementar lógica de compartilhamento
  };

  // Função para visualizar detalhes
  const handlePropertyClick = (propertyId: string) => {
    console.log("Visualizando propriedade:", propertyId);
    // Implementar navegação para detalhes
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
      <Container maxWidth={false} sx={{ px: 0 }}>
        {/* Barra de Filtros */}
        <Box sx={{ mb: 4 }}>
          <FilterBar
            onFiltersChange={applyFilters}
            defaultCity="CURITIBA"
            availableCities={["CURITIBA", "SÃO PAULO", "RIO DE JANEIRO"]}
            onNeighborhoodsLoad={loadNeighborhoods}
          />
        </Box>

        {/* Contador de Resultados e Ordenação */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              {filteredProperties.length} imóveis encontrados
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              {filteredProperties.length > 0
                ? "Encontramos propriedades que correspondem aos seus critérios de busca."
                : "Nenhuma propriedade encontrada com os filtros aplicados."}
            </Typography>
          </Box>

          {/* Seletor de Ordenação */}
          <FormControl
            size="small"
            sx={{
              minWidth: 200,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          >
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              label="Ordenar por"
            >
              <MenuItem value="relevance">Relevância</MenuItem>
              <MenuItem value="price-per-m2-asc">Menor preço/m²</MenuItem>
              <MenuItem value="price-per-m2-desc">Maior preço/m²</MenuItem>
              <MenuItem value="price-asc">Menor preço</MenuItem>
              <MenuItem value="price-desc">Maior preço</MenuItem>
              <MenuItem value="area-asc">Menor área útil</MenuItem>
              <MenuItem value="area-desc">Maior área útil</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress size={48} />
          </Box>
        )}

        {/* Grid de Propriedades */}
        {!loading && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => (
                <PropertiesCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  pricePerSquareMeter={property.pricePerSquareMeter}
                  address={property.address}
                  city={property.city}
                  state={property.state}
                  propertyType={property.propertyType}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  area={property.area}
                  images={property.images}
                  isFavorite={property.isFavorite}
                  onFavoriteToggle={handleFavoriteToggle}
                  onShare={handleShare}
                  onClick={handlePropertyClick}
                />
              ))
            ) : (
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  py: 8,
                  px: 3,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                  }}
                >
                  Nenhuma propriedade encontrada
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 3,
                    maxWidth: 400,
                    mx: "auto",
                  }}
                >
                  Tente ajustar os filtros de busca para encontrar mais
                  propriedades que correspondam aos seus critérios.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() =>
                    applyFilters({
                      search: "",
                      cities: ["CURITIBA"],
                      neighborhoods: [],
                      business: [],
                      purpose: [],
                      propertyTypes: {
                        apartments: [],
                        commercial: [],
                        houses: [],
                        lands: [],
                        others: [],
                      },
                      rooms: {
                        bedrooms: null,
                        bathrooms: null,
                        suites: null,
                        garage: null,
                      },
                      area: { min: 0, max: 1000000 },
                      price: { min: 0, max: 100000000 },
                      advertiserType: [],
                    })
                  }
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    borderColor: theme.palette.divider,
                    "&:hover": {
                      borderColor: theme.palette.text.primary,
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  Limpar Filtros
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Paginação (futura implementação) */}
        {!loading && filteredProperties.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 6,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                disabled
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                }}
              >
                Anterior
              </Button>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  px: 2,
                }}
              >
                Página 1 de 1
              </Typography>
              <Button
                variant="outlined"
                disabled
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                }}
              >
                Próxima
              </Button>
            </Stack>
          </Box>
        )}
      </Container>
    </Box>
  );
}
