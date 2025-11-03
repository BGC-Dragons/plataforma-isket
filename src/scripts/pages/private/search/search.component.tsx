import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Box,
  Typography,
  Container,
  useTheme,
  Button,
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
  Modal,
  useMediaQuery,
} from "@mui/material";
import {
  MoreVert,
  OpenInNew,
  Bed,
  DirectionsCar,
  SquareFoot,
  HelpOutline,
  ViewModule,
  ViewList,
  Map,
  Close,
} from "@mui/icons-material";
import { Popper } from "@mui/material";
import { PropertiesCard } from "../../../modules/search/properties-card";
import { FilterBar } from "../../../modules/search/filter/filter-bar";
import { PropertyDetails } from "../../../modules/search/property-details/property-details";
import { MapComponent } from "../../../modules/search/map/map";
import { filterPropertiesByOverlay } from "../../../modules/search/map/map-utils";
import { CustomPagination } from "../../../library/components/custom-pagination";
import {
  useGetPurchases,
  type IGetPurchasesResponseSuccess,
} from "../../../../services/get-purchases.service";

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
  // Adicionando mais propriedades para testar paginação
  {
    id: "7",
    title: "Casa com Piscina",
    price: 750000,
    pricePerSquareMeter: 4500.0,
    address: "Rua das Orquídeas, 789, Santa Felicidade",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 5,
    bathrooms: 4,
    area: 200,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    ],
    isFavorite: false,
  },
  {
    id: "8",
    title: "Sala Executiva",
    price: 220000,
    pricePerSquareMeter: 8000.0,
    address: "Rua Comercial, 456, Centro",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 0,
    bathrooms: 1,
    area: 28,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    ],
    isFavorite: true,
  },
  {
    id: "9",
    title: "Apartamento Compacto",
    price: 180000,
    pricePerSquareMeter: 6000.0,
    address: "Rua das Margaridas, 321, Mercês",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 2,
    bathrooms: 1,
    area: 45,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    ],
    isFavorite: false,
  },
  {
    id: "10",
    title: "Terreno Residencial",
    price: 120000,
    pricePerSquareMeter: 800.0,
    address: "Rua das Violetas, 654, Portão",
    city: "CURITIBA",
    state: "PR",
    propertyType: "TERRENO",
    bedrooms: 0,
    bathrooms: 0,
    area: 300,
    images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400"],
    isFavorite: false,
  },
  {
    id: "11",
    title: "Loja de Rua",
    price: 350000,
    pricePerSquareMeter: 5000.0,
    address: "Rua do Comércio, 987, Batel",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 0,
    bathrooms: 1,
    area: 70,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400",
    ],
    isFavorite: true,
  },
  {
    id: "12",
    title: "Casa Geminada",
    price: 380000,
    pricePerSquareMeter: 2800.0,
    address: "Rua das Azaleias, 147, Cristo Rei",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    ],
    isFavorite: false,
  },
  {
    id: "13",
    title: "Escritório Moderno",
    price: 195000,
    pricePerSquareMeter: 6500.0,
    address: "Rua Empresarial, 258, Centro",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 0,
    bathrooms: 1,
    area: 30,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    ],
    isFavorite: false,
  },
  {
    id: "14",
    title: "Apartamento Alto Padrão",
    price: 520000,
    pricePerSquareMeter: 9500.0,
    address: "Rua das Magnólias, 369, Batel",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 3,
    bathrooms: 3,
    area: 110,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    ],
    isFavorite: true,
  },
  {
    id: "15",
    title: "Terreno Industrial",
    price: 280000,
    pricePerSquareMeter: 400.0,
    address: "Rua Industrial, 741, Campo Comprido",
    city: "CURITIBA",
    state: "PR",
    propertyType: "TERRENO",
    bedrooms: 0,
    bathrooms: 0,
    area: 700,
    images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400"],
    isFavorite: false,
  },
  {
    id: "16",
    title: "Casa Colonial",
    price: 420000,
    pricePerSquareMeter: 3000.0,
    address: "Rua Histórica, 852, Alto da XV",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 4,
    bathrooms: 3,
    area: 180,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    ],
    isFavorite: false,
  },
  {
    id: "17",
    title: "Galpão Comercial",
    price: 450000,
    pricePerSquareMeter: 1500.0,
    address: "Rua Logística, 963, Campo Comprido",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 0,
    bathrooms: 2,
    area: 300,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400",
    ],
    isFavorite: true,
  },
  {
    id: "18",
    title: "Apartamento Studio",
    price: 150000,
    pricePerSquareMeter: 7500.0,
    address: "Rua das Begônias, 159, Mercês",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 1,
    bathrooms: 1,
    area: 20,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    ],
    isFavorite: false,
  },
  {
    id: "19",
    title: "Casa de Campo",
    price: 680000,
    pricePerSquareMeter: 2000.0,
    address: "Rua Rural, 753, Santa Felicidade",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 5,
    bathrooms: 4,
    area: 400,
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
      "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400",
    ],
    isFavorite: true,
  },
  {
    id: "20",
    title: "Sala de Reuniões",
    price: 165000,
    pricePerSquareMeter: 5500.0,
    address: "Rua Corporativa, 357, Centro",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 0,
    bathrooms: 1,
    area: 30,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;
  const [helpPopupAnchor, setHelpPopupAnchor] = useState<HTMLElement | null>(
    null
  );
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [bottomSheetPosition, setBottomSheetPosition] = useState(0); // posição Y do bottom sheet
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPosition, setDragStartPosition] = useState(0);

  // Detectar quando a tela está entre 600px e 900px (inclusivo)
  const isMediumScreen = useMediaQuery(
    "(min-width: 600px) and (max-width: 900px)",
    {
      noSsr: true,
    }
  );

  // Detectar quando é mobile (menor que 600px)
  const isMobile = useMediaQuery("(max-width: 599px)", {
    noSsr: true,
  });

  // Obter compras para extrair cidades disponíveis
  const { data: purchasesData } = useGetPurchases();

  // Função para converter cityStateCode (ex: "flores_da_cunha_rs") para formato de exibição (ex: "FLORES DA CUNHA")
  const formatCityNameFromCode = useCallback(
    (cityStateCode: string): string => {
      const cityParts = cityStateCode.split("_");
      const cityName = cityParts
        .slice(0, -1)
        .join(" ")
        .toUpperCase();
      return cityName;
    },
    []
  );

  // Extrair cidades disponíveis das compras e criar mapeamento cidade -> cityStateCode
  const { availableCities, cityToCodeMap } = useMemo(() => {
    if (!purchasesData || purchasesData.length === 0) {
      return {
        availableCities: ["CURITIBA"],
        cityToCodeMap: {} as Record<string, string>,
      };
    }

    const citiesSet = new Set<string>();
    const cityToCode: Record<string, string> = {};

    purchasesData.forEach((purchase: IGetPurchasesResponseSuccess) => {
      // Adicionar cidade padrão
      if (purchase.defaultCityStateCode) {
        const cityName = formatCityNameFromCode(purchase.defaultCityStateCode);
        citiesSet.add(cityName);
        cityToCode[cityName] = purchase.defaultCityStateCode;
      }

      // Adicionar cidades escolhidas
      if (purchase.chosenCityCodes && purchase.chosenCityCodes.length > 0) {
        purchase.chosenCityCodes.forEach((cityCode) => {
          const cityName = formatCityNameFromCode(cityCode);
          citiesSet.add(cityName);
          cityToCode[cityName] = cityCode;
        });
      }
    });

    // Converter para array e ordenar
    const citiesArray = Array.from(citiesSet).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    return {
      availableCities: citiesArray,
      cityToCodeMap: cityToCode,
    };
  }, [purchasesData, formatCityNameFromCode]);

  // Cidade padrão (primeira cidade disponível ou fallback)
  const defaultCity = useMemo(() => {
    return availableCities.length > 0 ? availableCities[0] : "CURITIBA";
  }, [availableCities]);

  // Detectar quando há um propertyId na URL
  useEffect(() => {
    if (propertyId) {
      setPropertyDetailsOpen(true);
    } else {
      setPropertyDetailsOpen(false);
    }
  }, [propertyId]);

  // Remover scroll do body apenas nesta página
  useEffect(() => {
    // Salvar o estado original do overflow
    const originalOverflow = document.body.style.overflow;

    // Remover scroll do body
    document.body.style.overflow = "hidden";

    // Cleanup: restaurar o scroll quando sair da página
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);


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
      setCurrentPage(1); // Reset para primeira página ao aplicar filtros

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

  // Calcular propriedades paginadas
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

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

  // Funções para o modal de ajuda
  const handleHelpHover = (event: React.MouseEvent<HTMLElement>) => {
    setHelpPopupAnchor(event.currentTarget);
  };

  const handleHelpLeave = () => {
    setHelpPopupAnchor(null);
  };

  // Funções para o desenho no mapa
  const handleDrawingComplete = (
    overlay: google.maps.drawing.OverlayCompleteEvent
  ) => {
    // Filtrar propriedades baseado na área desenhada
    const filteredByOverlay = filterPropertiesByOverlay(
      filteredProperties,
      overlay
    );
    setFilteredProperties(filteredByOverlay);
    setCurrentPage(1); // Reset para primeira página
  };

  // Função para limpar filtros (chamada pela lixeira)
  const handleClearFilters = () => {
    console.log("Resetando filtros para mostrar todas as propriedades");
    setFilteredProperties(properties); // Volta para todas as propriedades originais
    setCurrentPage(1); // Reset para primeira página
  };

  // Handlers para o bottom sheet deslizante (mobile)
  const handleBottomSheetTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setDragStartPosition(bottomSheetPosition);
  };

  const handleBottomSheetTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;
    const windowHeight = window.innerHeight;
    const minPosition = windowHeight * 0.3; // 30% da tela visível no mínimo
    const maxPosition = windowHeight * 0.95; // 95% da tela no máximo

    const newPosition = Math.max(
      minPosition,
      Math.min(maxPosition, dragStartPosition + deltaY)
    );
    setBottomSheetPosition(newPosition);
  };

  const handleBottomSheetTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const windowHeight = window.innerHeight;
    const threshold = windowHeight * 0.5; // 50% da tela como ponto de decisão

    // Snap para cima ou para baixo baseado na posição
    if (bottomSheetPosition < threshold) {
      setBottomSheetPosition(windowHeight * 0.3);
    } else {
      setBottomSheetPosition(windowHeight * 0.95);
    }
  };

  // Handler para mouse (desktop também pode arrastar)
  const handleBottomSheetMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartPosition(bottomSheetPosition);
  };

  // Efeito para atualizar posição inicial do bottom sheet
  useEffect(() => {
    if (isMobile) {
      const windowHeight = window.innerHeight;
      setBottomSheetPosition(windowHeight * 0.3); // Começar com 30% visível
    }
  }, [isMobile]);

  // Adicionar listeners globais para mouse quando está arrastando
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY;
      const windowHeight = window.innerHeight;
      const minPosition = windowHeight * 0.3;
      const maxPosition = windowHeight * 0.95;

      const newPosition = Math.max(
        minPosition,
        Math.min(maxPosition, dragStartPosition + deltaY)
      );
      setBottomSheetPosition(newPosition);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      const windowHeight = window.innerHeight;
      const threshold = windowHeight * 0.5;

      if (bottomSheetPosition < threshold) {
        setBottomSheetPosition(windowHeight * 0.3);
      } else {
        setBottomSheetPosition(windowHeight * 0.95);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStartY, dragStartPosition, bottomSheetPosition]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        py: { xs: 0, sm: 3 },
        px: { xs: 0, sm: 2 },
        position: "relative",
        overflow: { xs: "hidden", sm: "visible" },
      }}
    >
      {isMobile ? (
        // Layout Mobile com Bottom Sheet
        <Box
          sx={{
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Barra de Pesquisa no topo (mobile) */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1100,
              p: 2,
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[2],
            }}
          >
            <FilterBar
              onFiltersChange={applyFilters}
              defaultCity={defaultCity}
              availableCities={availableCities}
              cityToCodeMap={cityToCodeMap}
            />
          </Box>

          {/* Mapa */}
          <Box
            sx={{
              flex: 1,
              position: "relative",
              minHeight: 0,
            }}
          >
            <MapComponent
              properties={filteredProperties}
              onPropertyClick={handlePropertyClick}
              height="100%"
              onDrawingComplete={handleDrawingComplete}
              onClearFilters={handleClearFilters}
            />
          </Box>

          {/* Bottom Sheet com Lista de Propriedades */}
          <Paper
            elevation={16}
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `calc(100vh - ${bottomSheetPosition}px)`,
              maxHeight: "95vh",
              minHeight: "30vh",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 1200,
              transition: isDragging ? "none" : "height 0.3s ease-out",
              boxShadow: theme.shadows[24],
            }}
            onTouchStart={handleBottomSheetTouchStart}
            onTouchMove={handleBottomSheetTouchMove}
            onTouchEnd={handleBottomSheetTouchEnd}
          >
            {/* Barrinha cinza de arrasto */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 1.5,
                cursor: "grab",
                userSelect: "none",
                "&:active": {
                  cursor: "grabbing",
                },
              }}
              onMouseDown={handleBottomSheetMouseDown}
            >
              <Box
                sx={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.palette.grey[400],
                }}
              />
            </Box>

            {/* Conteúdo do Bottom Sheet */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                px: 2,
                pb: 2,
              }}
            >
              {/* Contador e Controles */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  flexWrap: "wrap",
                  gap: 2,
                  pt: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: "1.1rem",
                  }}
                >
                  {filteredProperties.length} Imóveis
                </Typography>

                <FormControl size="small">
                  <InputLabel>Ordenar</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) =>
                      handleSortChange(e.target.value as SortOption)
                    }
                    label="Ordenar"
                  >
                    <MenuItem value="relevance">Relevância</MenuItem>
                    <MenuItem value="price-per-m2-asc">Menor preço/m²</MenuItem>
                    <MenuItem value="price-per-m2-desc">
                      Maior preço/m²
                    </MenuItem>
                    <MenuItem value="price-asc">Menor preço</MenuItem>
                    <MenuItem value="price-desc">Maior preço</MenuItem>
                    <MenuItem value="area-asc">Menor área</MenuItem>
                    <MenuItem value="area-desc">Maior área</MenuItem>
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

              {/* Lista de Propriedades */}
              {!loading && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {paginatedProperties.length > 0 ? (
                    paginatedProperties.map((property) => (
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
                        textAlign: "center",
                        py: 4,
                        px: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          mb: 1,
                        }}
                      >
                        Nenhuma propriedade encontrada
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                        }}
                      >
                        Tente ajustar os filtros de busca
                      </Typography>
                    </Box>
                  )}

                  {/* Paginação */}
                  {!loading &&
                    filteredProperties.length > 0 &&
                    totalPages > 1 && (
                      <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        maxVisiblePages={5}
                      />
                    )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      ) : (
        // Layout Desktop/Tablet
        <Container maxWidth={false} sx={{ px: 0 }}>
          {/* Layout Principal: Cards + Mapa */}
          <Box
            sx={{
              display: "flex",
              gap: 3,
              height: "calc(100vh - 130px)", // Altura ajustável baseada na tela
              minHeight: 600,
            }}
          >
            {/* Coluna Esquerda: Cards de Propriedades */}
            <Box
              sx={{
                flex: 1.5, // 60% do espaço
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Barra de Filtros - Apenas na coluna esquerda */}
              <Box sx={{ mb: 3 }}>
                <FilterBar
                  onFiltersChange={applyFilters}
                  defaultCity={defaultCity}
                  availableCities={availableCities}
                  cityToCodeMap={cityToCodeMap}
                />
              </Box>

              {/* Contador de Resultados e Controles - Apenas na coluna esquerda */}
              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  backgroundColor: theme.palette.grey[50],
                  borderRadius: 2,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {/* Contador de Resultados */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: "1.1rem",
                    }}
                  >
                    {filteredProperties.length}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 400,
                      color: theme.palette.text.secondary,
                      fontSize: "1rem",
                    }}
                  >
                    Imóveis
                  </Typography>
                  <Box
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      p: 0.5,
                      borderRadius: 1,
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={handleHelpHover}
                    onMouseLeave={handleHelpLeave}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "1rem",
                        "&:hover": {
                          backgroundColor: "transparent",
                          color: theme.palette.text.primary,
                        },
                      }}
                    >
                      <HelpOutline fontSize="small" />
                    </IconButton>

                    {/* Popup de Ajuda */}
                    <Popper
                      open={Boolean(helpPopupAnchor)}
                      anchorEl={helpPopupAnchor}
                      placement="bottom"
                      sx={{ zIndex: 9999 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          minWidth: 200,
                          borderRadius: 2,
                          boxShadow: theme.shadows[8],
                          border: `1px solid ${theme.palette.divider}20`,
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            lineHeight: 1.4,
                          }}
                        >
                          Somente anúncios com coordenadas
                          <br />
                          são apresentados no mapa
                        </Typography>
                      </Paper>
                    </Popper>
                  </Box>
                </Box>

                {/* Controles de Ordenação e Visualização */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Seletor de Ordenação */}
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: 150,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                      },
                    }}
                  >
                    <InputLabel>Ordenar por</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) =>
                        handleSortChange(e.target.value as SortOption)
                      }
                      label="Ordenar por"
                    >
                      <MenuItem value="relevance">Relevância</MenuItem>
                      <MenuItem value="price-per-m2-asc">
                        Menor preço/m²
                      </MenuItem>
                      <MenuItem value="price-per-m2-desc">
                        Maior preço/m²
                      </MenuItem>
                      <MenuItem value="price-asc">Menor preço</MenuItem>
                      <MenuItem value="price-desc">Maior preço</MenuItem>
                      <MenuItem value="area-asc">Menor área útil</MenuItem>
                      <MenuItem value="area-desc">Maior área útil</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Botões de Visualização */}
                  <Box
                    sx={{
                      display: "flex",
                      borderRadius: 2,
                      overflow: "hidden",
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <IconButton
                      onClick={() => setViewMode("cards")}
                      sx={{
                        borderRadius: 0,
                        backgroundColor:
                          viewMode === "cards"
                            ? theme.palette.primary.main
                            : "transparent",
                        color:
                          viewMode === "cards"
                            ? theme.palette.primary.contrastText
                            : theme.palette.text.secondary,
                        "&:hover": {
                          backgroundColor:
                            viewMode === "cards"
                              ? theme.palette.primary.dark
                              : theme.palette.action.hover,
                        },
                      }}
                    >
                      <ViewModule fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => setViewMode("list")}
                      sx={{
                        borderRadius: 0,
                        backgroundColor:
                          viewMode === "list"
                            ? theme.palette.primary.main
                            : "transparent",
                        color:
                          viewMode === "list"
                            ? theme.palette.primary.contrastText
                            : theme.palette.text.secondary,
                        "&:hover": {
                          backgroundColor:
                            viewMode === "list"
                              ? theme.palette.primary.dark
                              : theme.palette.action.hover,
                        },
                      }}
                    >
                      <ViewList fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
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

              {/* Cards de Propriedades */}
              {!loading && (
                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    pr: 1, // Padding para scrollbar
                  }}
                >
                  {filteredProperties.length > 0 ? (
                    viewMode === "cards" ? (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                            md: "repeat(2, 1fr)", // 2 colunas para telas menores que 1250px
                            lg: "repeat(3, 1fr)", // 3 colunas para telas maiores que 1250px
                          },
                          gap: 2,
                        }}
                      >
                        {paginatedProperties.map((property) => (
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
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {paginatedProperties.map((property, index) => (
                          <Paper
                            key={property.id}
                            sx={{
                              p: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              backgroundColor:
                                index % 2 === 0 ? "grey.50" : "white",
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
                                  <Typography variant="caption">
                                    Sem foto
                                  </Typography>
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
                                      getPropertyTypeColor(
                                        property.propertyType
                                      )
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
                                {property.address}, {property.city} -{" "}
                                {property.state}
                              </Typography>
                            </Box>

                            {/* Detalhes específicos */}
                            <Box
                              sx={{
                                display: { xs: "none", sm: "flex" },
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
                                      color: getIconColor(
                                        property.propertyType
                                      ),
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {property.area} m²
                                  </Typography>
                                </Box>
                              ) : (
                                /* Para outros tipos, mostrar quartos, banheiros e área */
                                <>
                                  {property.bedrooms &&
                                    property.bedrooms > 0 && (
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
                                              property.propertyType
                                            ),
                                          }}
                                        />
                                        <Typography variant="body2">
                                          {property.bedrooms}
                                        </Typography>
                                      </Box>
                                    )}
                                  {property.bathrooms &&
                                    property.bathrooms > 0 && (
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
                                              property.propertyType
                                            ),
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
                                        color: getIconColor(
                                          property.propertyType
                                        ),
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

                  {/* Paginação - Dentro da área scrollável */}
                  {!loading &&
                    filteredProperties.length > 0 &&
                    totalPages > 1 && (
                      <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        maxVisiblePages={5}
                      />
                    )}
                </Box>
              )}
            </Box>

            {/* Coluna Direita: Mapa */}
            <Box
              sx={{
                flex: 1, // 40% do espaço
                minWidth: 0,
                display: { xs: "none", md: "block" }, // Esconde em telas pequenas
              }}
            >
              <MapComponent
                properties={filteredProperties}
                onPropertyClick={handlePropertyClick}
                height="100%"
                center={{
                  lat: -25.4284, // Curitiba
                  lng: -49.2733,
                }}
                zoom={12}
                onDrawingComplete={handleDrawingComplete}
                onClearFilters={handleClearFilters}
              />
            </Box>
          </Box>
        </Container>
      )}

      {/* Componentes Compartilhados */}
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

      {/* Botão flutuante para abrir mapa (apenas entre 600px e 900px) */}
      {isMediumScreen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1300,
          }}
        >
          <Button
            variant="contained"
            startIcon={mapModalOpen ? <Close /> : <Map />}
            onClick={() => setMapModalOpen(!mapModalOpen)}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: theme.shadows[8],
              "&:hover": {
                boxShadow: theme.shadows[12],
              },
            }}
          >
            {mapModalOpen ? "Fechar mapa" : "Abrir mapa"}
          </Button>
        </Box>
      )}

      {/* Modal do Mapa (apenas entre 600px e 900px) */}
      {isMediumScreen && (
        <Modal
          open={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "95vw",
              height: "90vh",
              maxWidth: 900,
              maxHeight: 800,
              backgroundColor: theme.palette.background.paper,
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: theme.shadows[24],
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Cabeçalho do Modal */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: "1.25rem",
                }}
              >
                Mapa de Propriedades
              </Typography>
              <IconButton
                onClick={() => setMapModalOpen(false)}
                sx={{
                  color: theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Mapa */}
            <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <MapComponent
                properties={filteredProperties}
                onPropertyClick={handlePropertyClick}
                height="100%"
                onDrawingComplete={handleDrawingComplete}
                onClearFilters={handleClearFilters}
              />
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
