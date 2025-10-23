import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
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
  Paper,
  Chip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  MoreVert,
  OpenInNew,
  Bed,
  DirectionsCar,
  SquareFoot,
} from "@mui/icons-material";
import { PropertiesCard } from "../../../modules/search/properties-card";
import { FilterBar } from "../../../modules/search/filter/filter-bar";
import { PropertyDetails } from "../../../modules/search/property-details/property-details";

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
  // Negócio
  venda: boolean;
  aluguel: boolean;
  // Finalidade
  residencial: boolean;
  comercial: boolean;
  industrial: boolean;
  agricultura: boolean;
  // Apartamentos
  apartamento_padrao: boolean;
  apartamento_flat: boolean;
  apartamento_loft: boolean;
  apartamento_studio: boolean;
  apartamento_duplex: boolean;
  apartamento_triplex: boolean;
  apartamento_cobertura: boolean;
  // Comerciais
  comercial_sala: boolean;
  comercial_casa: boolean;
  comercial_ponto: boolean;
  comercial_galpao: boolean;
  comercial_loja: boolean;
  comercial_predio: boolean;
  comercial_clinica: boolean;
  comercial_coworking: boolean;
  comercial_sobreloja: boolean;
  // Casas e Sítios
  casa_casa: boolean;
  casa_sobrado: boolean;
  casa_sitio: boolean;
  casa_chale: boolean;
  casa_chacara: boolean;
  casa_edicula: boolean;
  // Terrenos
  terreno_terreno: boolean;
  terreno_fazenda: boolean;
  // Outros
  outros_garagem: boolean;
  outros_quarto: boolean;
  outros_resort: boolean;
  outros_republica: boolean;
  outros_box: boolean;
  outros_tombado: boolean;
  outros_granja: boolean;
  outros_haras: boolean;
  outros_outros: boolean;
  // Cômodos
  quartos: number | null;
  banheiros: number | null;
  suites: number | null;
  garagem: number | null;
  // Sliders
  area_min: number;
  area_max: number;
  preco_min: number;
  preco_max: number;
  // Tipo de Anunciante
  proprietario_direto: boolean;
  imobiliaria: boolean;
  portal: boolean;
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
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId?: string }>();
  const [properties] = useState<PropertyData[]>(mockProperties);
  const [filteredProperties, setFilteredProperties] =
    useState<PropertyData[]>(mockProperties);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [propertyDetailsOpen, setPropertyDetailsOpen] = useState(false);

  // Detectar quando há um propertyId na URL
  useEffect(() => {
    if (propertyId) {
      setPropertyDetailsOpen(true);
    } else {
      setPropertyDetailsOpen(false);
    }
  }, [propertyId]);

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
        if (filters.venda || filters.aluguel) {
          // Para demonstração, assumimos que todas as propriedades são para venda
          // Em uma implementação real, isso viria dos dados
          if (filters.venda) {
            // Mantém todas as propriedades (todas são para venda)
          }
          if (filters.aluguel) {
            // Remove todas (nenhuma é para aluguel neste mock)
            filtered = [];
          }
        }

        // Filtro por finalidade
        if (
          filters.residencial ||
          filters.comercial ||
          filters.industrial ||
          filters.agricultura
        ) {
          filtered = filtered.filter((property) => {
            const type = property.propertyType.toLowerCase();
            return (
              (filters.residencial && type === "residencial") ||
              (filters.comercial && type === "comercial") ||
              (filters.industrial && type === "industrial") ||
              (filters.agricultura && type === "agricultura")
            );
          });
        }

        // Filtro por área
        if (filters.area_min > 0 || filters.area_max < 1000000) {
          filtered = filtered.filter(
            (property) =>
              property.area >= filters.area_min &&
              property.area <= filters.area_max
          );
        }

        // Filtro por preço
        if (filters.preco_min > 0 || filters.preco_max < 100000000) {
          filtered = filtered.filter(
            (property) =>
              property.price >= filters.preco_min &&
              property.price <= filters.preco_max
          );
        }

        // Filtro por quartos
        if (filters.quartos !== null) {
          filtered = filtered.filter(
            (property) => (property.bedrooms || 0) >= filters.quartos!
          );
        }

        // Filtro por banheiros
        if (filters.banheiros !== null) {
          filtered = filtered.filter(
            (property) => (property.bathrooms || 0) >= filters.banheiros!
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
    navigate(`/pesquisar-anuncios/${propertyId}`);
  };

  // Função para abrir menu de ações
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    propertyId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedProperty(propertyId);
  };

  // Função para fechar menu de ações
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProperty(null);
  };

  // Função para abrir em nova guia
  const handleOpenInNewTab = () => {
    if (selectedProperty) {
      console.log("Abrindo propriedade em nova guia:", selectedProperty);
      // Implementar abertura em nova guia
    }
    handleMenuClose();
  };

  // Função para alternar modo de visualização
  const handleViewModeChange = () => {
    setViewMode(viewMode === "cards" ? "list" : "cards");
  };

  // Função para fechar modal de detalhes
  const handleClosePropertyDetails = () => {
    navigate("/pesquisar-anuncios");
    setPropertyDetailsOpen(false);
  };

  // Função para obter a cor do tipo de propriedade (mesma lógica do PropertiesCard)
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
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
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
          <Box>
            {filteredProperties.length > 0 ? (
              viewMode === "cards" ? (
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
                  {filteredProperties.map((property) => (
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
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {filteredProperties.map((property, index) => (
                    <Paper
                      key={property.id}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        backgroundColor: index % 2 === 0 ? "grey.50" : "white",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                        cursor: "pointer",
                      }}
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      {/* Foto miniatura */}
                      <Box
                        sx={{
                          width: 80,
                          height: 60,
                          borderRadius: 1,
                          overflow: "hidden",
                          backgroundColor: theme.palette.grey[200],
                          flexShrink: 0,
                        }}
                      >
                        {property.images && property.images.length > 0 ? (
                          <Box
                            component="img"
                            src={property.images[0]}
                            alt={property.title}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: theme.palette.grey[200],
                              color: theme.palette.grey[500],
                            }}
                          >
                            <Typography variant="caption">Sem foto</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Informações da propriedade */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {property.title}
                          </Typography>

                          {/* Chip do tipo de propriedade */}
                          <Chip
                            label={property.propertyType}
                            size="small"
                            sx={{
                              backgroundColor: getPropertyTypeColor(
                                property.propertyType
                              ),
                              color: theme.palette.getContrastText(
                                getPropertyTypeColor(property.propertyType)
                              ),
                              fontWeight: 600,
                              textTransform: "uppercase",
                              fontSize: "0.6rem",
                              height: 20,
                              flexShrink: 0,
                              "& .MuiChip-label": {
                                px: 0.5,
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {property.address}, {property.city} - {property.state}
                        </Typography>
                      </Box>

                      {/* Detalhes específicos */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          color: "text.secondary",
                        }}
                      >
                        {/* Para terrenos, mostrar apenas a área */}
                        {property.propertyType === "TERRENO" ? (
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
                                color: getIconColor(property.propertyType),
                              }}
                            />
                            <Typography variant="body2">
                              {property.area} m²
                            </Typography>
                          </Box>
                        ) : (
                          /* Para outros tipos, mostrar quartos, banheiros e área */
                          <>
                            {property.bedrooms && property.bedrooms > 0 && (
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
                                    color: getIconColor(property.propertyType),
                                  }}
                                />
                                <Typography variant="body2">
                                  {property.bedrooms}
                                </Typography>
                              </Box>
                            )}
                            {property.bathrooms && property.bathrooms > 0 && (
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
                                    color: getIconColor(property.propertyType),
                                  }}
                                />
                                <Typography variant="body2">
                                  {property.bathrooms}
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
                                  color: getIconColor(property.propertyType),
                                }}
                              />
                              <Typography variant="body2">
                                {property.area} m²
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>

                      {/* Menu de ações */}
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, property.id);
                        }}
                        sx={{ ml: 1 }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              )
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
                      // Negócio
                      venda: false,
                      aluguel: false,
                      // Finalidade
                      residencial: false,
                      comercial: false,
                      industrial: false,
                      agricultura: false,
                      // Apartamentos
                      apartamento_padrao: false,
                      apartamento_flat: false,
                      apartamento_loft: false,
                      apartamento_studio: false,
                      apartamento_duplex: false,
                      apartamento_triplex: false,
                      apartamento_cobertura: false,
                      // Comerciais
                      comercial_sala: false,
                      comercial_casa: false,
                      comercial_ponto: false,
                      comercial_galpao: false,
                      comercial_loja: false,
                      comercial_predio: false,
                      comercial_clinica: false,
                      comercial_coworking: false,
                      comercial_sobreloja: false,
                      // Casas e Sítios
                      casa_casa: false,
                      casa_sobrado: false,
                      casa_sitio: false,
                      casa_chale: false,
                      casa_chacara: false,
                      casa_edicula: false,
                      // Terrenos
                      terreno_terreno: false,
                      terreno_fazenda: false,
                      // Outros
                      outros_garagem: false,
                      outros_quarto: false,
                      outros_resort: false,
                      outros_republica: false,
                      outros_box: false,
                      outros_tombado: false,
                      outros_granja: false,
                      outros_haras: false,
                      outros_outros: false,
                      // Cômodos
                      quartos: null,
                      banheiros: null,
                      suites: null,
                      garagem: null,
                      // Sliders
                      area_min: 0,
                      area_max: 1000000,
                      preco_min: 0,
                      preco_max: 100000000,
                      // Tipo de Anunciante
                      proprietario_direto: false,
                      imobiliaria: false,
                      portal: false,
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

        {/* Menu de ações */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleOpenInNewTab}>
            <ListItemIcon>
              <OpenInNew fontSize="small" />
            </ListItemIcon>
            <ListItemText>Abrir em nova guia</ListItemText>
          </MenuItem>
        </Menu>

        {/* Modal de Detalhes da Propriedade */}
        <PropertyDetails
          open={propertyDetailsOpen}
          onClose={handleClosePropertyDetails}
          propertyId={propertyId}
        />
      </Container>
    </Box>
  );
}
