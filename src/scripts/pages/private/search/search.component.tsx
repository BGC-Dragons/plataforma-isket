import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  Bathtub,
  DirectionsCar,
  SquareFoot,
  HelpOutline,
  ViewModule,
  ViewList,
  Map,
  Close,
  ErrorOutline,
  Refresh,
} from "@mui/icons-material";
import { Popper } from "@mui/material";
import { PropertiesCard } from "../../../modules/search/properties-card";
import { FilterBar } from "../../../modules/search/filter/filter-bar";
import { PropertyDetails } from "../../../modules/search/property-details/property-details";
import { MapComponent } from "../../../modules/search/map/map";
import {
  convertOverlayToGeoJSONPolygon,
  convertOverlayToGeoJSONCircle,
} from "../../../modules/search/map/map-utils";
import { CustomPagination } from "../../../library/components/custom-pagination";
import {
  useGetPurchases,
  type IGetPurchasesResponseSuccess,
} from "../../../../services/get-purchases.service";
import { useCitySelection } from "../../../modules/city-selection/city-selection.hook";
import {
  postPropertyAdSearch,
  type SortBy,
  type SortOrder,
} from "../../../../services/post-property-ad-search.service";
import { mapFiltersToApi } from "../../../../services/helpers/map-filters-to-api.helper";
import { mapApiToPropertyDataArray } from "../../../../services/helpers/map-api-to-property-data.helper";
import { useAuth } from "../../../modules/access-manager/auth.hook";
import { getNeighborhoods } from "../../../../services/get-locations-neighborhoods.service";
import type { INeighborhoodFull } from "../../../../services/get-locations-neighborhoods.service";
import { getCityByCode } from "../../../../services/get-locations-city-by-code.service";
import type { ICityFull } from "../../../../services/get-locations-cities.service";
import { postCitiesFindMany } from "../../../../services/post-locations-cities-find-many.service";
import type { FilterState } from "../../../modules/search/filter/filter.types";
import { useFilterSelection } from "../../../modules/filter-selection/filter-selection.hook";

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
}

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
  const auth = useAuth();
  const { cities: contextCities, setCities: setContextCities } =
    useCitySelection();
  const {
    filters: persistedFilters,
    setFilters: setPersistedFilters,
  } = useFilterSelection();

  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [currentFilters, setCurrentFilters] = useState<FilterState | undefined>(
    undefined
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [propertyDetailsOpen, setPropertyDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const itemsPerPage = 18;
  const [helpPopupAnchor, setHelpPopupAnchor] = useState<HTMLElement | null>(
    null
  );
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [bottomSheetPosition, setBottomSheetPosition] = useState(0); // posição Y do bottom sheet
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPosition, setDragStartPosition] = useState(0);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const previousPropertyIdRef = useRef<string | undefined>(propertyId);
  const [neighborhoodsData, setNeighborhoodsData] = useState<
    INeighborhoodFull[]
  >([]);
  const [allNeighborhoodsForBounds, setAllNeighborhoodsForBounds] = useState<
    INeighborhoodFull[]
  >([]); // Todos os bairros para cálculo de bounds quando não há seleção específica
  const [citiesData, setCitiesData] = useState<ICityFull[]>([]);
  const [mapCenter, setMapCenter] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);

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
      const cityName = cityParts.slice(0, -1).join(" ").toUpperCase();
      return cityName;
    },
    []
  );

  // Extrair cidades disponíveis das compras e criar mapeamento cidade -> cityStateCode
  const { availableCities, cityToCodeMap, defaultCityStateCode } =
    useMemo(() => {
      // Se purchasesData ainda não carregou ou não há compras, retornar vazio
      // para evitar usar fallback incorreto (ex: Curitiba)
      if (!purchasesData || purchasesData.length === 0) {
        return {
          availableCities: [],
          cityToCodeMap: {} as Record<string, string>,
          defaultCityStateCode: undefined,
        };
      }

      const citiesSet = new Set<string>();
      const cityToCode: Record<string, string> = {};
      let defaultCityCode: string | undefined;

      // Encontrar a primeira purchase com defaultCityStateCode (cidade padrão do plano)
      const purchaseWithDefaultCity = purchasesData.find(
        (purchase: IGetPurchasesResponseSuccess) =>
          purchase.defaultCityStateCode
      );

      if (purchaseWithDefaultCity?.defaultCityStateCode) {
        defaultCityCode = purchaseWithDefaultCity.defaultCityStateCode;
        const cityName = formatCityNameFromCode(defaultCityCode);
        citiesSet.add(cityName);
        cityToCode[cityName] = defaultCityCode;
      }

      purchasesData.forEach((purchase: IGetPurchasesResponseSuccess) => {
        // Adicionar cidade padrão
        if (purchase.defaultCityStateCode) {
          const cityName = formatCityNameFromCode(
            purchase.defaultCityStateCode
          );
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
        defaultCityStateCode: defaultCityCode,
      };
    }, [purchasesData, formatCityNameFromCode]);

  // Cidade padrão (cidade padrão do plano ou primeira cidade disponível)
  // Não usar fallback para evitar buscar cidade incorreta
  const defaultCity = useMemo(() => {
    if (defaultCityStateCode) {
      return formatCityNameFromCode(defaultCityStateCode);
    }
    return availableCities.length > 0 ? availableCities[0] : undefined;
  }, [availableCities, defaultCityStateCode, formatCityNameFromCode]);

  // Detectar quando há um propertyId na URL
  useEffect(() => {
    if (propertyId) {
      setPropertyDetailsOpen(true);
    } else {
      setPropertyDetailsOpen(false);
    }
  }, [propertyId]);

  useEffect(() => {
    const hadPropertyDetails = Boolean(previousPropertyIdRef.current);
    const hasPropertyDetails = Boolean(propertyId);
    if (hadPropertyDetails && !hasPropertyDetails) {
      setMapRefreshKey((prev) => prev + 1);
    }
    previousPropertyIdRef.current = propertyId;
  }, [propertyId]);

  // Função para mapear SortOption local para SortBy/SortOrder da API
  const mapSortOptionToApi = (
    sortOption: SortOption
  ): { sortBy?: SortBy; sortOrder?: SortOrder } => {
    switch (sortOption) {
      case "price-per-m2-asc":
        return { sortBy: "pricePerSquareMeter", sortOrder: "asc" };
      case "price-per-m2-desc":
        return { sortBy: "pricePerSquareMeter", sortOrder: "desc" };
      case "price-asc":
        return { sortBy: "price", sortOrder: "asc" };
      case "price-desc":
        return { sortBy: "price", sortOrder: "desc" };
      case "area-asc":
        return { sortBy: "area", sortOrder: "asc" };
      case "area-desc":
        return { sortBy: "area", sortOrder: "desc" };
      default:
        return {};
    }
  };

  // Função para extrair mensagem de erro
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (
        axiosError.response?.status === 503 ||
        axiosError.response?.status === 500
      ) {
        return "Serviço temporariamente indisponível. Tente novamente em alguns instantes.";
      }
      if (axiosError.response?.status === 404) {
        return "Serviço não encontrado. Verifique sua conexão.";
      }
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      return "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.";
    }
    if (error instanceof Error) {
      if (
        error.message.includes("Network Error") ||
        error.message.includes("Failed to fetch")
      ) {
        return "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      return error.message;
    }
    return "Erro inesperado ao buscar propriedades. Tente novamente.";
  };

  // Função para calcular o centro e bounds de bairros e cidades
  const calculateMapBounds = useCallback(
    (neighborhoods: INeighborhoodFull[], cities: ICityFull[] = []) => {
      if (neighborhoods.length === 0 && cities.length === 0) {
        return { center: undefined, zoom: undefined };
      }

      // Coletar todas as coordenadas dos bairros e cidades
      const allCoordinates: { lat: number; lng: number }[] = [];

      // Adicionar coordenadas dos bairros
      neighborhoods.forEach((neighborhood) => {
        const coords = neighborhood.geo?.coordinates?.[0];
        if (coords && coords.length > 0) {
          coords.forEach((coord) => {
            allCoordinates.push({
              lat: coord[1], // latitude
              lng: coord[0], // longitude
            });
          });
        }
      });

      // Adicionar coordenadas das cidades
      // Suporta tanto Polygon quanto MultiPolygon
      cities.forEach((city) => {
        if (!city.geo?.geometry) return;

        const geometry = city.geo.geometry;
        if (geometry.type === "Polygon") {
          const coords = geometry.coordinates as number[][][];
          coords[0]?.forEach((coord) => {
            allCoordinates.push({
              lat: coord[1], // latitude
              lng: coord[0], // longitude
            });
          });
        } else if (geometry.type === "MultiPolygon") {
          const coords = geometry.coordinates as number[][][][];
          // Iterar sobre todos os polígonos no MultiPolygon, não apenas o primeiro
          coords.forEach((polygon) => {
            polygon[0]?.forEach((coord) => {
              allCoordinates.push({
                lat: coord[1], // latitude
                lng: coord[0], // longitude
              });
            });
          });
        }
      });

      if (allCoordinates.length === 0) {
        return { center: undefined, zoom: undefined };
      }

      // Calcular bounds (min/max lat e lng)
      const lats = allCoordinates.map((c) => c.lat);
      const lngs = allCoordinates.map((c) => c.lng);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      // Calcular centro
      const center = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      };

      // Calcular zoom baseado na área coberta
      // Fórmula aproximada para calcular zoom baseado na diferença de latitude/longitude
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);

      // Detectar se é busca apenas por cidade (sem bairros específicos)
      const isCityOnlySearch = neighborhoods.length === 0 && cities.length > 0;

      let zoom = 12; // zoom padrão
      const MAX_ZOOM = 13; // Limite máximo de zoom para evitar zoom excessivo

      if (isCityOnlySearch) {
        // Quando apenas cidades são selecionadas, fazer zoom moderado para focar na cidade
        // Usar zoom mais conservador para evitar zoom máximo e mostrar visualização mais ampla
        if (maxDiff > 0.4) {
          zoom = 10; // cidade muito grande (ex: São Paulo, Rio de Janeiro)
        } else if (maxDiff > 0.25) {
          zoom = 11; // cidade grande
        } else if (maxDiff > 0.15) {
          zoom = 11; // cidade média-grande (reduzido de 12 para 11 para visualização mais ampla)
        } else if (maxDiff > 0.08) {
          zoom = 11; // cidade média (reduzido de 12 para 11 para visualização mais ampla)
        } else if (maxDiff > 0.04) {
          zoom = 11; // cidade pequena (reduzido de 12 para 11 para visualização mais ampla)
        } else {
          zoom = 12; // cidade muito pequena (reduzido de 13 para 12 para visualização mais ampla)
        }

        // Garantir que o zoom não ultrapasse o limite máximo
        zoom = Math.min(zoom, MAX_ZOOM);
      } else if (neighborhoods.length > 50) {
        // Se há muitos bairros (mais de 50), é uma cidade inteira - zoom mais próximo
        if (maxDiff > 0.3) {
          zoom = 11; // cidade muito grande
        } else if (maxDiff > 0.15) {
          zoom = 12; // cidade grande
        } else if (maxDiff > 0.08) {
          zoom = 13; // cidade média
        } else {
          zoom = 13; // cidade pequena (limitado a 13)
        }
      } else {
        // Seleção específica de bairros
        // Se há apenas um bairro, fazer zoom mais próximo para centralizar melhor
        if (neighborhoods.length === 1) {
          if (maxDiff > 0.1) {
            zoom = 12; // bairro grande
          } else if (maxDiff > 0.05) {
            zoom = 13; // bairro médio
          } else if (maxDiff > 0.02) {
            zoom = 13; // bairro pequeno (limitado a 13)
          } else {
            zoom = 13; // bairro muito pequeno (limitado a 13, não mais 15)
          }
        } else {
          // Múltiplos bairros
          if (maxDiff > 0.5) {
            zoom = 9; // área muito grande (estado)
          } else if (maxDiff > 0.2) {
            zoom = 10; // área grande (região)
          } else if (maxDiff > 0.1) {
            zoom = 11; // área média (cidade)
          } else if (maxDiff > 0.05) {
            zoom = 12; // área pequena (bairros)
          } else if (maxDiff > 0.02) {
            zoom = 13; // área muito pequena (bairro específico)
          } else {
            zoom = 13; // área mínima (limitado a 13)
          }
        }
      }

      // Garantir que o zoom nunca ultrapasse o limite máximo em todos os casos
      zoom = Math.min(zoom, MAX_ZOOM);

      return { center, zoom };
    },
    []
  );

  // Função para buscar dados geoespaciais das cidades
  // Quando apenas cidades são selecionadas (sem bairros), usa o endpoint individual que retorna geo completo
  const fetchCitiesData = useCallback(
    async (filters: FilterState) => {
      if (filters.cities.length === 0) {
        setCitiesData([]);
        return;
      }

      try {
        // Obter códigos das cidades selecionadas
        const cityStateCodes = filters.cities
          .map((city) => cityToCodeMap[city])
          .filter((code): code is string => Boolean(code));

        if (cityStateCodes.length === 0) {
          setCitiesData([]);
          return;
        }

        // Se não há bairros selecionados, buscar cada cidade individualmente pelo endpoint que retorna geo completo
        // Isso garante que temos os dados geoespaciais da cidade
        if (filters.neighborhoods.length === 0) {
          const cityPromises = cityStateCodes.map((code) =>
            getCityByCode(code, auth.store.token as string | undefined)
          );
          const cityResponses = await Promise.all(cityPromises);
          const cities = cityResponses.map((response) => response.data);
          setCitiesData(cities);
        } else {
          // Se há bairros selecionados, usar findMany (mais eficiente)
          const response = await postCitiesFindMany(
            { cityStateCodes },
            auth.store.token as string | undefined
          );
          setCitiesData(response.data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados das cidades:", error);
        setCitiesData([]);
      }
    },
    [cityToCodeMap, auth.store.token]
  );

  // Função para buscar dados geoespaciais dos bairros
  // Quando apenas cidade é selecionada (sem bairros específicos), busca todos os bairros para mostrar delimitação
  const fetchNeighborhoodsData = useCallback(
    async (filters: FilterState) => {
      if (filters.cities.length === 0) {
        setNeighborhoodsData([]);
        setAllNeighborhoodsForBounds([]);
        return;
      }

      try {
        // Obter códigos das cidades selecionadas
        const cityStateCodes = filters.cities
          .map((city) => cityToCodeMap[city])
          .filter((code): code is string => Boolean(code));

        if (cityStateCodes.length === 0) {
          setNeighborhoodsData([]);
          setAllNeighborhoodsForBounds([]);
          return;
        }

        // Buscar todos os bairros das cidades selecionadas
        const response = await getNeighborhoods(
          cityStateCodes,
          auth.store.token as string | undefined
        );

        // SEMPRE armazenar TODOS os bairros para mostrar delimitação completa
        setAllNeighborhoodsForBounds(response.data);

        // Se há bairros específicos selecionados, também armazenar esses para destacar
        if (filters.neighborhoods.length > 0) {
          const selectedNeighborhoods = response.data.filter((neighborhood) =>
            filters.neighborhoods.includes(neighborhood.name)
          );
          // Armazenar os bairros selecionados (para destacar visualmente)
          setNeighborhoodsData(selectedNeighborhoods);
        } else {
          // Se não há bairros específicos selecionados, limpar neighborhoodsData
          setNeighborhoodsData([]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados dos bairros:", error);
        setNeighborhoodsData([]);
        setAllNeighborhoodsForBounds([]);
      }
    },
    [cityToCodeMap, auth.store.token]
  );

  // Ref para rastrear cidades anteriores e evitar buscas duplicadas
  const previousCitiesRef = useRef<string>("");

  // Efeito para buscar dados das cidades imediatamente quando as cidades mudarem
  // Isso permite centralizar o mapa sem precisar fazer a busca completa de propriedades
  useEffect(() => {
    // Não buscar dados de cidades quando há busca por endereço (para não sobrescrever centralização)
    if (!currentFilters || currentFilters.addressCoordinates) {
      previousCitiesRef.current = "";
      return;
    }

    if (currentFilters.cities.length === 0) {
      previousCitiesRef.current = "";
      return;
    }

    // Criar uma chave única baseada nas cidades selecionadas
    const citiesKey = [...currentFilters.cities].sort().join(",");

    // Só buscar se as cidades realmente mudaram
    if (previousCitiesRef.current !== citiesKey) {
      previousCitiesRef.current = citiesKey;
      // Buscar dados das cidades imediatamente quando mudarem
      // Não fazer busca de propriedades aqui, apenas buscar dados geoespaciais
      fetchCitiesData(currentFilters);
    }
  }, [currentFilters, fetchCitiesData]);

  // Ref para rastrear bairros anteriores e evitar buscas duplicadas
  const previousNeighborhoodsRef = useRef<string>("");

  // Efeito para buscar dados dos bairros imediatamente quando os bairros mudarem
  // Isso permite centralizar o mapa sem precisar fazer a busca completa de propriedades
  useEffect(() => {
    // Não buscar dados de bairros quando há busca por endereço (para não sobrescrever centralização)
    if (!currentFilters || currentFilters.addressCoordinates) {
      previousNeighborhoodsRef.current = "";
      return;
    }

    // Criar uma chave única baseada nos bairros selecionados (mesmo se vazio)
    const neighborhoodsKey =
      currentFilters.neighborhoods.length > 0
        ? [...currentFilters.neighborhoods].sort().join(",")
        : "";

    // Só buscar se os bairros realmente mudaram
    if (previousNeighborhoodsRef.current !== neighborhoodsKey) {
      previousNeighborhoodsRef.current = neighborhoodsKey;
      // Buscar dados dos bairros imediatamente quando mudarem
      // Não fazer busca de propriedades aqui, apenas buscar dados geoespaciais
      // fetchNeighborhoodsData já trata o caso de array vazio
      fetchNeighborhoodsData(currentFilters);
    }
  }, [currentFilters, fetchNeighborhoodsData]);

  // Efeito para centralizar o mapa quando há busca por endereço (prioridade máxima)
  useEffect(() => {
    if (currentFilters?.addressCoordinates && currentFilters?.addressZoom) {
      // Quando há busca por endereço, centralizar no endereço
      setMapCenter(currentFilters.addressCoordinates);
      setMapZoom(currentFilters.addressZoom);
      return; // Não calcular bounds de cidades/bairros quando há endereço
    }
  }, [currentFilters?.addressCoordinates, currentFilters?.addressZoom]);

  // Calcular se é busca apenas por cidade (sem bairros específicos)
  const isCityOnlySearch = useMemo(() => {
    return (
      citiesData.length > 0 &&
      neighborhoodsData.length === 0 &&
      (!currentFilters || (currentFilters.neighborhoods?.length || 0) === 0)
    );
  }, [citiesData.length, neighborhoodsData.length, currentFilters]);

  // Efeito para calcular bounds quando cidades ou bairros mudarem
  // Só executa se NÃO houver busca por endereço ou desenho no mapa
  useEffect(() => {
    // Se há busca por endereço, não calcular bounds de cidades/bairros
    if (currentFilters?.addressCoordinates) {
      return;
    }

    // Se há desenho no mapa, não calcular bounds de cidades/bairros (prioridade do desenho)
    if (
      currentFilters?.drawingGeometries &&
      currentFilters.drawingGeometries.length > 0
    ) {
      return;
    }

    // Se não há dados, limpar
    if (
      citiesData.length === 0 &&
      neighborhoodsData.length === 0 &&
      allNeighborhoodsForBounds.length === 0
    ) {
      setMapCenter(undefined);
      setMapZoom(undefined);
      return;
    }

    // Calcular bounds usando cidades e bairros
    // Quando apenas cidades são selecionadas (sem bairros específicos), usar APENAS as coordenadas da cidade
    // NÃO usar allNeighborhoodsForBounds porque isso resulta em zoom muito alto
    // Quando há bairros selecionados, usamos os dados dos bairros selecionados
    // Prioridade: neighborhoodsData > citiesData (sem usar allNeighborhoodsForBounds para zoom)
    const neighborhoodsToUse =
      neighborhoodsData.length > 0 ? neighborhoodsData : [];

    // Quando é busca apenas por cidade, usar apenas citiesData (não usar allNeighborhoodsForBounds)
    // Isso evita zoom excessivo calculado a partir de todos os bairros
    const citiesToUse = isCityOnlySearch ? citiesData : [];

    const bounds = calculateMapBounds(
      neighborhoodsToUse,
      citiesToUse.length > 0 ? citiesToUse : citiesData
    );

    if (bounds.center) {
      setMapCenter(bounds.center);
      setMapZoom(bounds.zoom);
    }
  }, [
    citiesData,
    neighborhoodsData,
    allNeighborhoodsForBounds,
    calculateMapBounds,
    isCityOnlySearch, // Usar o valor memoizado
    currentFilters?.addressCoordinates, // Adicionar dependência para reagir quando endereço é removido
    currentFilters?.drawingGeometries, // Adicionar dependência para reagir quando desenho é adicionado/removido
  ]);

  // Função para aplicar filtros e buscar da API
  const applyFilters = useCallback(
    async (filters: FilterState, sortOption?: SortOption) => {
      setCurrentFilters(filters);
      setPersistedFilters(filters);
      // Sincronizar cidades com contexto quando filtros mudarem
      if (filters.cities.length > 0) {
        setContextCities(filters.cities);
      } else {
        setContextCities([]);
      }
      setLoading(true);
      setCurrentPage(1);
      setError(null); // Limpar erro anterior

      try {
        const sortConfig = mapSortOptionToApi(sortOption ?? sortBy);

        // Se não há cidades selecionadas e não há busca por endereço/desenho,
        // usar a cidade padrão internamente na busca
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

        const apiRequest = mapFiltersToApi(
          filtersForApi,
          cityToCodeMap,
          1,
          itemsPerPage,
          sortConfig.sortBy,
          sortConfig.sortOrder
        );

        const response = await postPropertyAdSearch(
          apiRequest,
          auth.store.token as string | undefined
        );

        const propertyData = mapApiToPropertyDataArray(response.data.data);
        setFilteredProperties(propertyData);
        setTotalPages(response.data.meta.lastPage);
        setTotalProperties(response.data.meta.total);
        setError(null); // Garantir que não há erro após sucesso

        // Buscar dados geoespaciais das cidades e bairros selecionados
        // NÃO buscar quando há busca por endereço (para não sobrescrever a centralização)
        if (!filters.addressCoordinates) {
          await fetchCitiesData(filtersForApi);
          await fetchNeighborhoodsData(filtersForApi);
        }
      } catch (error) {
        console.error("Erro ao buscar propriedades:", error);
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        setFilteredProperties([]);
        setTotalPages(1);
        setTotalProperties(0);
      } finally {
        setLoading(false);
      }
    },
    [
      sortBy,
      cityToCodeMap,
      itemsPerPage,
      auth.store.token,
      fetchNeighborhoodsData,
      fetchCitiesData,
      defaultCity,
      setPersistedFilters,
    ]
  );

  // Função para buscar propriedades quando a página muda
  const fetchProperties = useCallback(
    async (filters: FilterState, page: number) => {
      if (!filters) return;

      setLoading(true);
      setError(null); // Limpar erro anterior
      try {
        const sortConfig = mapSortOptionToApi(sortBy);

        // Se não há cidades selecionadas e não há busca por endereço/desenho,
        // usar a cidade padrão internamente na busca
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

        const apiRequest = mapFiltersToApi(
          filtersForApi,
          cityToCodeMap,
          page,
          itemsPerPage,
          sortConfig.sortBy,
          sortConfig.sortOrder
        );

        const response = await postPropertyAdSearch(
          apiRequest,
          auth.store.token as string | undefined
        );

        const propertyData = mapApiToPropertyDataArray(response.data.data);
        setFilteredProperties(propertyData);
        setTotalPages(response.data.meta.lastPage);
        setTotalProperties(response.data.meta.total);
        setError(null); // Garantir que não há erro após sucesso
      } catch (error) {
        console.error("Erro ao buscar propriedades:", error);
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, cityToCodeMap, itemsPerPage, auth.store.token, defaultCity]
  );

  // Flag para evitar busca dupla na página 1 durante o mount inicial
  const isInitialMount = useRef(true);
  const previousPage = useRef(1);
  const isFetchingInitial = useRef(false); // Flag para indicar que está fazendo busca inicial

  // Buscar propriedades quando a página muda
  useEffect(() => {
    // Não fazer nada se está fazendo busca inicial (para evitar interferência)
    if (isFetchingInitial.current) {
      return;
    }

    // Pular a busca na página 1 apenas durante o mount inicial (já é tratado pelo useEffect de busca inicial)
    // Mas permitir busca se voltou para página 1 de outra página
    if (isInitialMount.current && currentPage === 1 && !currentFilters) {
      isInitialMount.current = false;
      previousPage.current = currentPage;
      return;
    }

    // Marcar que o mount inicial já passou
    isInitialMount.current = false;

    // Se a página mudou, fazer a busca
    if (previousPage.current !== currentPage) {
      if (currentFilters) {
        // Se há filtros, buscar com os filtros aplicados
        fetchProperties(currentFilters, currentPage);
      } else {
        // Se não há filtros, buscar busca inicial com a página correta
        const fetchInitialPage = async () => {
          setLoading(true);
          setError(null);

          try {
            const apiRequest = {
              page: currentPage,
              size: itemsPerPage,
              requireAreaInfo: false,
            };

            const response = await postPropertyAdSearch(
              apiRequest,
              auth.store.token as string | undefined
            );

            const propertyData = mapApiToPropertyDataArray(response.data.data);
            setFilteredProperties(propertyData);
            setTotalPages(response.data.meta.lastPage);
            setTotalProperties(response.data.meta.total);
            setError(null);
          } catch (error) {
            console.error("Erro ao buscar propriedades:", error);
            const errorMessage = getErrorMessage(error);
            setError(errorMessage);
            setFilteredProperties([]);
            setTotalPages(1);
            setTotalProperties(0);
          } finally {
            setLoading(false);
          }
        };

        fetchInitialPage();
      }
    }

    // Atualizar página anterior
    previousPage.current = currentPage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Função para buscar propriedades iniciais (com cidade padrão do plano)
  const fetchInitialProperties = useCallback(async () => {
    // Marcar que está fazendo busca inicial para evitar interferência do useEffect
    isFetchingInitial.current = true;

    // Usar cidades do contexto se disponíveis e válidas, senão usar array vazio
    // (a cidade padrão será usada internamente pelo applyFilters quando cities estiver vazio)
    const initialCities =
      contextCities.length > 0
        ? contextCities.filter((city) => availableCities.includes(city))
        : [];

    // Criar filtros - usar cidades do contexto se disponíveis
    // Se não houver cidades no contexto, deixar vazio para que applyFilters use a cidade padrão
    const initialFilters: FilterState = {
      search: "",
      cities: initialCities,
      neighborhoods: [],
      venda: false,
      aluguel: false,
      residencial: false,
      comercial: false,
      industrial: false,
      agricultura: false,
      apartamento_padrao: false,
      apartamento_flat: false,
      apartamento_loft: false,
      apartamento_studio: false,
      apartamento_duplex: false,
      apartamento_triplex: false,
      apartamento_cobertura: false,
      apartamento_garden: false,
      comercial_sala: false,
      comercial_casa: false,
      comercial_ponto: false,
      comercial_galpao: false,
      comercial_loja: false,
      comercial_predio: false,
      comercial_clinica: false,
      comercial_coworking: false,
      comercial_sobreloja: false,
      casa_casa: false,
      casa_sobrado: false,
      casa_sitio: false,
      casa_chale: false,
      casa_chacara: false,
      casa_edicula: false,
      terreno_terreno: false,
      terreno_fazenda: false,
      outros_garagem: false,
      outros_quarto: false,
      outros_resort: false,
      outros_republica: false,
      outros_box: false,
      outros_tombado: false,
      outros_granja: false,
      outros_haras: false,
      outros_outros: false,
      quartos: null,
      banheiros: null,
      suites: null,
      garagem: null,
      area_min: 0,
      area_max: 1000000,
      preco_min: 0,
      preco_max: 100000000,
      proprietario_direto: false,
      imobiliaria: false,
      portal: false,
      lancamento: false,
      palavras_chave: "",
    };

    // Definir filtros ANTES de fazer a busca
    setCurrentFilters(initialFilters);
    setCurrentPage(1);
    setError(null);
    setLoading(true);

    // Pequeno delay para garantir que os estados foram atualizados
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      // Usar applyFilters que já usa a cidade padrão internamente quando não há cidades selecionadas
      await applyFilters(initialFilters);
    } catch (error) {
      console.error("Erro ao buscar propriedades iniciais:", error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      setFilteredProperties([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      // Liberar a flag após um pequeno delay para garantir que o useEffect não interfira
      setTimeout(() => {
        isFetchingInitial.current = false;
      }, 100);
    }
  }, [applyFilters, contextCities, availableCities]);

  useEffect(() => {
    if (!currentFilters && persistedFilters) {
      applyFilters(persistedFilters);
    }
  }, [currentFilters, persistedFilters, applyFilters]);

  // Buscar propriedades iniciais quando o componente monta (sem filtros)
  useEffect(() => {
    if (persistedFilters) {
      return;
    }
    // Só executar quando purchasesData estiver carregado e houver cidade padrão disponível
    if (
      purchasesData && // Garantir que purchasesData não é undefined
      availableCities.length > 0 &&
      Object.keys(cityToCodeMap).length > 0 &&
      defaultCityStateCode && // Garantir que há uma cidade padrão do plano
      !currentFilters
    ) {
      fetchInitialProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasesData, availableCities.length, Object.keys(cityToCodeMap).length, defaultCityStateCode]);

  // Função para lidar com mudança de ordenação
  const handleSortChange = (newSortBy: SortOption) => {
    setSortBy(newSortBy);
    if (currentFilters) {
      applyFilters(currentFilters, newSortBy);
    }
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

  // Propriedades já vêm paginadas da API
  const paginatedProperties = filteredProperties;

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

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para formatar preço por m²
  const formatPricePerSquareMeter = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Funções para o modal de ajuda
  const handleHelpHover = (event: React.MouseEvent<HTMLElement>) => {
    setHelpPopupAnchor(event.currentTarget);
  };

  const handleHelpLeave = () => {
    setHelpPopupAnchor(null);
  };

  // Função para calcular centro e zoom do desenho
  const calculateDrawingBounds = useCallback(
    (
      overlay: google.maps.drawing.OverlayCompleteEvent
    ): {
      center: { lat: number; lng: number };
      zoom: number;
    } | null => {
      if (!overlay.overlay) {
        return null;
      }

      let bounds: google.maps.LatLngBounds | null = null;
      let center: { lat: number; lng: number } | null = null;

      if (overlay.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = overlay.overlay as google.maps.Polygon;
        const paths = polygon.getPath();
        if (!paths || paths.getLength() === 0) {
          return null;
        }

        // Criar bounds a partir dos pontos do polígono
        bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < paths.getLength(); i++) {
          const latLng = paths.getAt(i);
          bounds.extend(latLng);
        }
      } else if (overlay.type === google.maps.drawing.OverlayType.CIRCLE) {
        const circle = overlay.overlay as google.maps.Circle;
        const circleCenter = circle.getCenter();
        const radius = circle.getRadius();

        if (!circleCenter || !radius) {
          return null;
        }

        // Para círculo, calcular bounds baseado no raio
        const centerLat = circleCenter.lat();
        const centerLng = circleCenter.lng();

        // Calcular a distância em graus (aproximação)
        // 1 grau de latitude ≈ 111 km
        // 1 grau de longitude ≈ 111 km * cos(latitude)
        const latDiff = radius / 111000; // metros para graus
        const lngDiff =
          radius / (111000 * Math.cos((centerLat * Math.PI) / 180));

        bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(centerLat - latDiff, centerLng - lngDiff),
          new google.maps.LatLng(centerLat + latDiff, centerLng + lngDiff)
        );

        center = {
          lat: centerLat,
          lng: centerLng,
        };
      } else {
        return null;
      }

      if (!bounds) {
        return null;
      }

      // Calcular centro se ainda não foi calculado
      if (!center) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        center = {
          lat: (ne.lat() + sw.lat()) / 2,
          lng: (ne.lng() + sw.lng()) / 2,
        };
      }

      // Calcular zoom baseado no tamanho dos bounds
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = ne.lat() - sw.lat();
      const lngDiff = ne.lng() - sw.lng();
      const maxDiff = Math.max(latDiff, lngDiff);

      // Calcular zoom baseado na diferença de coordenadas
      let zoom = 12; // zoom padrão

      if (maxDiff > 0.5) {
        zoom = 9; // área muito grande
      } else if (maxDiff > 0.2) {
        zoom = 10; // área grande
      } else if (maxDiff > 0.1) {
        zoom = 11; // área média-grande
      } else if (maxDiff > 0.05) {
        zoom = 12; // área média
      } else if (maxDiff > 0.02) {
        zoom = 13; // área pequena
      } else if (maxDiff > 0.01) {
        zoom = 14; // área muito pequena
      } else {
        zoom = 15; // área mínima - zoom bem próximo
      }

      return { center, zoom };
    },
    []
  );

  // Funções para o desenho no mapa
  const handleDrawingComplete = useCallback(
    async (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      // Calcular centro e zoom do desenho
      const drawingBounds = calculateDrawingBounds(overlay);
      if (drawingBounds) {
        setMapCenter(drawingBounds.center);
        setMapZoom(drawingBounds.zoom);
      }

      // Converter overlay para GeoJSON (Polygon ou Circle)
      let geometry:
        | { type: "Polygon"; coordinates: number[][][] }
        | { type: "circle"; coordinates: [[number, number]]; radius: string }
        | null = null;

      if (overlay.type === google.maps.drawing.OverlayType.POLYGON) {
        geometry = convertOverlayToGeoJSONPolygon(overlay);
      } else if (overlay.type === google.maps.drawing.OverlayType.CIRCLE) {
        geometry = convertOverlayToGeoJSONCircle(overlay);
      }

      if (!geometry) {
        // Se não for um Polygon ou Circle, não fazer nada
        return;
      }

      // Atualizar a geometria existente quando o desenho é movido/editado
      const existingGeometries = currentFilters?.drawingGeometries || [];
      const overlayIndex = (overlay.overlay as unknown as {
        __drawingIndex?: number;
      })?.__drawingIndex;
      const nextGeometries = [...existingGeometries];
      if (typeof overlayIndex === "number" && overlayIndex >= 0) {
        nextGeometries[overlayIndex] = geometry;
      } else {
        const newIndex = nextGeometries.length;
        (overlay.overlay as unknown as { __drawingIndex?: number }).__drawingIndex =
          newIndex;
        nextGeometries.push(geometry);
      }

      const newFilters: FilterState = {
        ...(currentFilters || {
          search: "",
          cities: [],
          neighborhoods: [],
          venda: false,
          aluguel: false,
          residencial: false,
          comercial: false,
          industrial: false,
          agricultura: false,
          apartamento_padrao: false,
          apartamento_flat: false,
          apartamento_loft: false,
          apartamento_studio: false,
          apartamento_duplex: false,
          apartamento_triplex: false,
          apartamento_cobertura: false,
          apartamento_garden: false,
          comercial_sala: false,
          comercial_casa: false,
          comercial_ponto: false,
          comercial_galpao: false,
          comercial_loja: false,
          comercial_predio: false,
          comercial_clinica: false,
          comercial_coworking: false,
          comercial_sobreloja: false,
          casa_casa: false,
          casa_sobrado: false,
          casa_sitio: false,
          casa_chale: false,
          casa_chacara: false,
          casa_edicula: false,
          terreno_terreno: false,
          terreno_fazenda: false,
          outros_garagem: false,
          outros_quarto: false,
          outros_resort: false,
          outros_republica: false,
          outros_box: false,
          outros_tombado: false,
          outros_granja: false,
          outros_haras: false,
          outros_outros: false,
          quartos: null,
          banheiros: null,
          suites: null,
          garagem: null,
          area_min: 0,
          area_max: 1000000,
          preco_min: 0,
          preco_max: 100000000,
          proprietario_direto: false,
          imobiliaria: false,
          portal: false,
          lancamento: false,
          palavras_chave: "",
        }),
        drawingGeometries: nextGeometries,
      };

      // Aplicar filtros com a geometria (isso vai buscar na API)
      // O componente do mapa fará a busca automaticamente quando os filtros mudarem
      await applyFilters(newFilters);
    },
    [currentFilters, applyFilters, calculateDrawingBounds]
  );

  // Função para limpar filtros (chamada pela lixeira)
  const handleClearFilters = useCallback(() => {
    if (currentFilters) {
      // Remover a geometria do desenho e as coordenadas do endereço dos filtros
      const filtersWithoutDrawing: FilterState = {
        ...currentFilters,
        drawingGeometries: undefined,
        addressCoordinates: undefined,
        addressZoom: undefined,
        search: currentFilters.addressCoordinates ? "" : currentFilters.search, // Limpar busca se havia endereço
      };
      // Aplicar filtros sem o desenho do mapa e sem busca por endereço
      applyFilters(filtersWithoutDrawing);
      setCurrentPage(1);
    }
  }, [currentFilters, applyFilters]);

  // Função para limpar TODOS os filtros (campo de busca, cidades, bairros e filtros do modal)
  const handleClearAllFilters = useCallback(() => {
    setMapCenter(undefined);
    setMapZoom(undefined);
    setNeighborhoodsData([]);
    setAllNeighborhoodsForBounds([]);
    setCitiesData([]);

    const clearedFilters: FilterState = {
      search: "",
      cities: [],
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
      apartamento_garden: false,
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
      // Opcionais
      lancamento: false,
      palavras_chave: "",
      // Geometrias dos desenhos
      drawingGeometries: undefined,
    };
    applyFilters(clearedFilters);
  }, [applyFilters]);

  // Handler para quando um bairro é clicado no mapa (selecionar ou desselecionar)
  const handleNeighborhoodClick = useCallback(
    (neighborhood: INeighborhoodFull) => {
      if (!currentFilters) return;

      const isSelected = currentFilters.neighborhoods?.includes(
        neighborhood.name
      );
      const currentNeighborhoods = currentFilters.neighborhoods || [];
      const newNeighborhoods = isSelected
        ? currentNeighborhoods.filter((n) => n !== neighborhood.name)
        : [...currentNeighborhoods, neighborhood.name];

      applyFilters({
        ...currentFilters,
        neighborhoods: newNeighborhoods,
      });
    },
    [currentFilters, applyFilters]
  );

  // Handlers para o bottom sheet deslizante (mobile)
  const handleBottomSheetTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setDragStartPosition(bottomSheetPosition);
  };

  const handleBottomSheetTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;
    const windowHeight = window.visualViewport?.height ?? window.innerHeight;
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
    const windowHeight = window.visualViewport?.height ?? window.innerHeight;
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
      const windowHeight = window.visualViewport?.height ?? window.innerHeight;
      setBottomSheetPosition(windowHeight * 0.3); // Começar com 30% visível
    }
  }, [isMobile]);

  // Adicionar listeners globais para mouse quando está arrastando
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY;
      const windowHeight = window.visualViewport?.height ?? window.innerHeight;
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
      const windowHeight = window.visualViewport?.height ?? window.innerHeight;
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
        height: "100%",
        minHeight: "100%",
        backgroundColor: theme.palette.background.default,
        py: { xs: 0, sm: 1 },
        px: { xs: 0, sm: 2 },
        position: "relative",
        overflow: { xs: "hidden", sm: "visible" },
      }}
    >
      {isMobile ? (
        // Layout Mobile com Bottom Sheet
        <Box
          sx={{
            height: "100%",
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
              externalFilters={currentFilters}
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
              center={mapCenter}
              zoom={mapZoom}
              onDrawingComplete={handleDrawingComplete}
              onClearFilters={handleClearFilters}
              neighborhoods={neighborhoodsData}
              selectedNeighborhoodNames={currentFilters?.neighborhoods || []}
              cities={citiesData}
              selectedCityCodes={
                currentFilters?.cities
                  .map((city) => cityToCodeMap[city])
                  .filter((code): code is string => Boolean(code)) || []
              }
              allNeighborhoodsForCityBounds={allNeighborhoodsForBounds}
              filters={currentFilters}
              cityToCodeMap={cityToCodeMap}
              defaultCity={defaultCity}
              refreshKey={mapRefreshKey}
              token={
                auth.store.token ||
                localStorage.getItem("auth_token") ||
                undefined
              }
              useMapSearch={true}
              onNeighborhoodClick={handleNeighborhoodClick}
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
              height: `calc(var(--app-height, 100vh) - ${bottomSheetPosition}px)`,
              maxHeight: "calc(var(--app-height, 100vh) * 0.95)",
              minHeight: "calc(var(--app-height, 100vh) * 0.3)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              overscrollBehavior: "contain",
              zIndex: 1200,
              transition: isDragging ? "none" : "height 0.3s ease-out",
              boxShadow: theme.shadows[24],
            }}
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
                touchAction: "none",
                "&:active": {
                  cursor: "grabbing",
                },
              }}
              onMouseDown={handleBottomSheetMouseDown}
              onTouchStart={handleBottomSheetTouchStart}
              onTouchMove={handleBottomSheetTouchMove}
              onTouchEnd={handleBottomSheetTouchEnd}
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
                paddingBottom: `calc(${theme.spacing(
                  13
                )} + env(safe-area-inset-bottom))`,
                overscrollBehaviorY: "contain",
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
                  {error ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 6,
                        px: 2,
                      }}
                    >
                      <ErrorOutline
                        sx={{
                          fontSize: 64,
                          color: theme.palette.error.main,
                          mb: 2,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.error.main,
                          mb: 1,
                        }}
                      >
                        Erro ao buscar propriedades
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 3,
                          maxWidth: 400,
                          mx: "auto",
                        }}
                      >
                        {error}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={fetchInitialProperties}
                        sx={{
                          borderRadius: 2,
                          px: 4,
                          py: 1.5,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Tentar Novamente
                      </Button>
                    </Box>
                  ) : paginatedProperties.length > 0 ? (
                    paginatedProperties.map((property) => (
                      <PropertiesCard
                        key={property.id}
                        id={property.id}
                        title={property.title}
                        price={property.price}
                        pricePerSquareMeter={property.pricePerSquareMeter}
                        address={property.address}
                        neighborhood={property.neighborhood}
                        city={property.city}
                        state={property.state}
                        propertyType={property.propertyType}
                        bedrooms={property.bedrooms}
                        bathrooms={property.bathrooms}
                        parking={property.parking}
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
                    paginatedProperties.length > 0 &&
                    totalPages > 1 && (
                      <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        maxVisiblePages={4}
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
              height: "calc(var(--app-height, 100vh) - 130px)", // Altura ajustável baseada na tela
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
                  externalFilters={currentFilters}
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
                    {totalProperties}
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
                    paddingBottom: isMediumScreen
                      ? `calc(${theme.spacing(
                          12
                        )} + env(safe-area-inset-bottom))`
                      : "env(safe-area-inset-bottom)", // Espaço para o botão flutuante
                  }}
                >
                  {error ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 8,
                        px: 3,
                      }}
                    >
                      <ErrorOutline
                        sx={{
                          fontSize: 64,
                          color: theme.palette.error.main,
                          mb: 2,
                        }}
                      />
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.error.main,
                          mb: 2,
                        }}
                      >
                        Erro ao buscar propriedades
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
                        {error}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={fetchInitialProperties}
                        sx={{
                          borderRadius: 2,
                          px: 4,
                          py: 1.5,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        Tentar Novamente
                      </Button>
                    </Box>
                  ) : filteredProperties.length > 0 ? (
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
                            neighborhood={property.neighborhood}
                            city={property.city}
                            state={property.state}
                            propertyType={property.propertyType}
                            bedrooms={property.bedrooms}
                            bathrooms={property.bathrooms}
                            parking={property.parking}
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
                                {property.address}
                                <br />
                                {property.neighborhood && property.city
                                  ? `${property.neighborhood}, ${property.city}`
                                  : property.city || property.neighborhood}
                              </Typography>
                            </Box>

                            {/* Detalhes específicos */}
                            <Box
                              sx={{
                                display: { xs: "none", sm: "flex" },
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 1,
                                color: "text.secondary",
                              }}
                            >
                              {/* Preço e Preço por m² */}
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", lg: "row" },
                                    alignItems: "flex-end",
                                    gap: { xs: 0.5, lg: 1.5 },
                                    "@media (min-width: 1400px)": {
                                      flexDirection: "row",
                                    },
                                    "@media (max-width: 1399px)": {
                                      flexDirection: "column",
                                    },
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
                                    {formatCurrency(property.price)}
                                  </Typography>
                                  {property.pricePerSquareMeter > 0 && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                      }}
                                    >
                                      <SquareFoot
                                        sx={{
                                          fontSize: "0.875rem",
                                          color: getIconColor(
                                            property.propertyType
                                          ),
                                        }}
                                      />
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: theme.palette.text.secondary,
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        {formatPricePerSquareMeter(
                                          property.pricePerSquareMeter
                                        )}
                                        /m²
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>

                              {/* Ícones de quartos, banheiros, garagem e área */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
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
                                  /* Para outros tipos, mostrar quartos, banheiros, garagem e área */
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
                                          <Bathtub
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
                                    {property.parking &&
                                      property.parking > 0 && (
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
                                            {property.parking}
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
                        onClick={handleClearAllFilters}
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
                        maxVisiblePages={4}
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
                center={mapCenter}
                zoom={mapZoom}
                onDrawingComplete={handleDrawingComplete}
                onClearFilters={handleClearFilters}
                neighborhoods={neighborhoodsData}
                selectedNeighborhoodNames={currentFilters?.neighborhoods || []}
                cities={citiesData}
                selectedCityCodes={
                  currentFilters?.cities
                    .map((city) => cityToCodeMap[city])
                    .filter((code): code is string => Boolean(code)) || []
                }
                allNeighborhoodsForCityBounds={allNeighborhoodsForBounds}
                filters={currentFilters}
                cityToCodeMap={cityToCodeMap}
                defaultCity={defaultCity}
                refreshKey={mapRefreshKey}
                token={
                  auth.store.token ||
                  localStorage.getItem("auth_token") ||
                  undefined
                }
                useMapSearch={true}
                onNeighborhoodClick={handleNeighborhoodClick}
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
                center={mapCenter}
                zoom={mapZoom}
                onDrawingComplete={handleDrawingComplete}
                onClearFilters={handleClearFilters}
                neighborhoods={neighborhoodsData}
                selectedNeighborhoodNames={currentFilters?.neighborhoods || []}
                cities={citiesData}
                selectedCityCodes={
                  currentFilters?.cities
                    .map((city) => cityToCodeMap[city])
                    .filter((code): code is string => Boolean(code)) || []
                }
                allNeighborhoodsForCityBounds={allNeighborhoodsForBounds}
                filters={currentFilters}
                cityToCodeMap={cityToCodeMap}
                defaultCity={defaultCity}
                refreshKey={mapRefreshKey}
                token={
                  auth.store.token ||
                  localStorage.getItem("auth_token") ||
                  undefined
                }
                useMapSearch={true}
                onNeighborhoodClick={handleNeighborhoodClick}
              />
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
