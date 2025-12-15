import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Container,
  useTheme,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import { ViewModule, ViewList, SquareFoot, Bed, DirectionsCar, Bathroom } from "@mui/icons-material";
import { FilterBar } from "../../../modules/search/filter/filter-bar";
import { MapComponent } from "../../../modules/search/map/map";
import { EvaluationPropertyCard } from "../../../modules/evaluation/evaluation-property-card";
import { EvaluationActionBar } from "../../../modules/evaluation/evaluation-action-bar";
import { GenerateReportModal } from "../../../modules/evaluation/generate-report-modal";
import { AnalysisSummaryDrawer } from "../../../modules/evaluation/analysis-summary-drawer";
import { CustomPagination } from "../../../library/components/custom-pagination";
import { useAuth } from "../../../modules/access-manager/auth.hook";
import {
  postPropertyAdSearch,
  type SortBy,
  type SortOrder,
  type IPropertyAd,
} from "../../../../services/post-property-ad-search.service";
import { mapFiltersToApi } from "../../../../services/helpers/map-filters-to-api.helper";
import { mapApiToPropertyDataArray } from "../../../../services/helpers/map-api-to-property-data.helper";
import { useGetPurchases, type IGetPurchasesResponseSuccess } from "../../../../services/get-purchases.service";
import { getNeighborhoods } from "../../../../services/get-locations-neighborhoods.service";
import type { INeighborhoodFull } from "../../../../services/get-locations-neighborhoods.service";
import { getCityByCode } from "../../../../services/get-locations-city-by-code.service";
import type { ICityFull } from "../../../../services/get-locations-cities.service";
import { postCitiesFindMany } from "../../../../services/post-locations-cities-find-many.service";
import {
  convertOverlayToGeoJSONPolygon,
  convertOverlayToGeoJSONCircle,
} from "../../../modules/search/map/map-utils";
import {
  getTotalPrice,
  getAreaValue,
  getPricePerSquareMeter,
  translatePropertyType,
  mapCalculationCriterionToAreaType,
} from "../../../modules/evaluation/evaluation-helpers";
import { downloadXLSX } from "../../../modules/evaluation/excel-export";

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
}

// Interface para o estado dos filtros (mesma do search)
interface FilterState {
  search: string;
  cities: string[];
  neighborhoods: string[];
  addressCoordinates?: { lat: number; lng: number };
  addressZoom?: number;
  drawingGeometries?: Array<
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "circle"; coordinates: [[number, number]]; radius: string }
  >;
  venda: boolean;
  aluguel: boolean;
  residencial: boolean;
  comercial: boolean;
  industrial: boolean;
  agricultura: boolean;
  apartamento_padrao: boolean;
  apartamento_flat: boolean;
  apartamento_loft: boolean;
  apartamento_studio: boolean;
  apartamento_duplex: boolean;
  apartamento_triplex: boolean;
  apartamento_cobertura: boolean;
  comercial_sala: boolean;
  comercial_casa: boolean;
  comercial_ponto: boolean;
  comercial_galpao: boolean;
  comercial_loja: boolean;
  comercial_predio: boolean;
  comercial_clinica: boolean;
  comercial_coworking: boolean;
  comercial_sobreloja: boolean;
  casa_casa: boolean;
  casa_sobrado: boolean;
  casa_sitio: boolean;
  casa_chale: boolean;
  casa_chacara: boolean;
  casa_edicula: boolean;
  terreno_terreno: boolean;
  terreno_fazenda: boolean;
  outros_garagem: boolean;
  outros_quarto: boolean;
  outros_resort: boolean;
  outros_republica: boolean;
  outros_box: boolean;
  outros_tombado: boolean;
  outros_granja: boolean;
  outros_haras: boolean;
  outros_outros: boolean;
  quartos: number | null;
  banheiros: number | null;
  suites: number | null;
  garagem: number | null;
  area_min: number;
  area_max: number;
  preco_min: number;
  preco_max: number;
  proprietario_direto: boolean;
  imobiliaria: boolean;
  portal: boolean;
  lancamento: boolean;
  palavras_chave: string;
}

type SortOption =
  | "relevance"
  | "price-per-m2-asc"
  | "price-per-m2-desc"
  | "price-asc"
  | "price-desc"
  | "area-asc"
  | "area-desc";

// Função utilitária simples para formatar moeda (espelhando comportamento do search)
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const formatPricePerSquareMeter = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const getPropertyTypeColor = (propertyType: PropertyData["propertyType"]) => {
  switch (propertyType) {
    case "RESIDENCIAL":
      return "#1976d2";
    case "COMERCIAL":
      return "#9c27b0";
    case "TERRENO":
      return "#2e7d32";
    default:
      return "#616161";
  }
};

const getIconColor = getPropertyTypeColor;

export function EvaluationComponent() {
  const theme = useTheme();
  const auth = useAuth();

  const { data: purchasesData } = useGetPurchases();

  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(
    new Set()
  );
  // Cache global de todos os imóveis buscados (para manter dados completos da API)
  const propertiesCache = useRef<Map<string, IPropertyAd>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [currentFilters, setCurrentFilters] = useState<FilterState | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [calculationCriterion, setCalculationCriterion] =
    useState("area-total");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  
  // Estados para métricas calculadas
  const [totalValueAverage, setTotalValueAverage] = useState(0);
  const [pricePerAreaAverage, setPricePerAreaAverage] = useState(0);
  const [usableAreaAverage, setUsableAreaAverage] = useState(0);
  const [totalAreaAverage, setTotalAreaAverage] = useState(0);
  const [bestDeal, setBestDeal] = useState(0);
  const [bestDealPerM2, setBestDealPerM2] = useState(0);
  const [appraisalValue, setAppraisalValue] = useState(0);
  const [averageTotalAreaRange, setAverageTotalAreaRange] = useState({
    min: 0,
    max: 0,
  });
  const itemsPerPage = 18;
  const [neighborhoodsData, setNeighborhoodsData] = useState<
    INeighborhoodFull[]
  >([]);
  const [allNeighborhoodsForBounds, setAllNeighborhoodsForBounds] = useState<
    INeighborhoodFull[]
  >([]);
  const [citiesData, setCitiesData] = useState<ICityFull[]>([]);
  const [mapCenter, setMapCenter] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);

  // Extrair cidades disponíveis das compras e criar mapeamento cidade -> cityStateCode
  const formatCityNameFromCode = useCallback((cityStateCode: string): string => {
    const cityParts = cityStateCode.split("_");
    const cityName = cityParts.slice(0, -1).join(" ").toUpperCase();
    return cityName;
  }, []);

  const { availableCities, cityToCodeMap, defaultCityStateCode } = useMemo(() => {
    if (!purchasesData || purchasesData.length === 0) {
      return {
        availableCities: ["CURITIBA"],
        cityToCodeMap: {} as Record<string, string>,
        defaultCityStateCode: undefined as string | undefined,
      };
    }

    const citiesSet = new Set<string>();
    const cityToCode: Record<string, string> = {};
    let defaultCityCode: string | undefined;

    const purchaseWithDefaultCity = purchasesData.find(
      (purchase: IGetPurchasesResponseSuccess) => purchase.defaultCityStateCode
    );

    if (purchaseWithDefaultCity?.defaultCityStateCode) {
      defaultCityCode = purchaseWithDefaultCity.defaultCityStateCode;
      const cityName = formatCityNameFromCode(defaultCityCode);
      citiesSet.add(cityName);
      cityToCode[cityName] = defaultCityCode;
    }

    purchasesData.forEach((purchase: IGetPurchasesResponseSuccess) => {
      if (purchase.defaultCityStateCode) {
        const cityName = formatCityNameFromCode(purchase.defaultCityStateCode);
        citiesSet.add(cityName);
        cityToCode[cityName] = purchase.defaultCityStateCode;
      }

      if (purchase.chosenCityCodes && purchase.chosenCityCodes.length > 0) {
        purchase.chosenCityCodes.forEach((cityCode) => {
          const cityName = formatCityNameFromCode(cityCode);
          citiesSet.add(cityName);
          cityToCode[cityName] = cityCode;
        });
      }
    });

    const citiesArray = Array.from(citiesSet).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    return {
      availableCities: citiesArray,
      cityToCodeMap: cityToCode,
      defaultCityStateCode: defaultCityCode,
    };
  }, [purchasesData, formatCityNameFromCode]);

  const defaultCity = useMemo(() => {
    if (defaultCityStateCode) {
      return formatCityNameFromCode(defaultCityStateCode);
    }
    return availableCities.length > 0 ? availableCities[0] : "CURITIBA";
  }, [availableCities, defaultCityStateCode, formatCityNameFromCode]);

  // Função para calcular centro e zoom do desenho (igual à tela de busca)
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

        const centerLat = circleCenter.lat();
        const centerLng = circleCenter.lng();

        const latDiff = radius / 111000;
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

      if (!center) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        center = {
          lat: (ne.lat() + sw.lat()) / 2,
          lng: (ne.lng() + sw.lng()) / 2,
        };
      }

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = ne.lat() - sw.lat();
      const lngDiff = ne.lng() - sw.lng();
      const maxDiff = Math.max(latDiff, lngDiff);

      let zoom = 12;

      if (maxDiff > 30) zoom = 5;
      else if (maxDiff > 10) zoom = 6;
      else if (maxDiff > 5) zoom = 7;
      else if (maxDiff > 2) zoom = 8;
      else if (maxDiff > 1) zoom = 9;
      else if (maxDiff > 0.5) zoom = 10;
      else if (maxDiff > 0.25) zoom = 11;
      else if (maxDiff > 0.12) zoom = 12;
      else if (maxDiff > 0.06) zoom = 13;
      else zoom = 14;

      return { center, zoom };
    },
    []
  );

  // Função para calcular o centro e bounds de bairros e cidades (igual à tela de busca)
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
        if (!city || !city.geo || !city.geo.geometry) return;

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
          coords[0]?.[0]?.forEach((coord) => {
            allCoordinates.push({
              lat: coord[1], // latitude
              lng: coord[0], // longitude
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
        // Usar zoom mais conservador para evitar zoom máximo
        if (maxDiff > 0.4) {
          zoom = 10; // cidade muito grande (ex: São Paulo, Rio de Janeiro)
        } else if (maxDiff > 0.25) {
          zoom = 11; // cidade grande
        } else if (maxDiff > 0.15) {
          zoom = 12; // cidade média-grande
        } else if (maxDiff > 0.08) {
          zoom = 12; // cidade média (reduzido de 13 para 12)
        } else if (maxDiff > 0.04) {
          zoom = 12; // cidade pequena (reduzido de 14 para 12)
        } else {
          zoom = 13; // cidade muito pequena (reduzido de 15 para 13, limitado por MAX_ZOOM)
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

  // Função para buscar dados geoespaciais das cidades (igual à tela de busca)
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

  // Função para buscar dados geoespaciais dos bairros (igual à tela de busca)
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
  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && "response" in err) {
      const axiosError = err as {
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
    if (err instanceof Error) {
      if (
        err.message.includes("Network Error") ||
        err.message.includes("Failed to fetch")
      ) {
        return "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      return err.message;
    }
    return "Erro inesperado ao buscar propriedades. Tente novamente.";
  };

  // Função para aplicar filtros e buscar da API
  const applyFilters = useCallback(
    async (filters: FilterState) => {
      setCurrentFilters(filters);
      setLoading(true);
      setCurrentPage(1);
      setError(null);

      try {
        const sortConfig = mapSortOptionToApi(sortBy);

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
        
        // Adiciona requireAreaInfo para obter dados de área
        apiRequest.requireAreaInfo = true;

        const response = await postPropertyAdSearch(
          apiRequest,
          auth.store.token as string | undefined
        );

        // Armazenar dados originais da API no cache global
        response.data.data.forEach((ad: IPropertyAd) => {
          propertiesCache.current.set(ad.id, ad);
        });

        const propertyData = mapApiToPropertyDataArray(response.data.data);
        setProperties(propertyData);
        setTotalPages(response.data.meta.lastPage);
        setError(null);

        if (!filters.addressCoordinates) {
          await fetchCitiesData(filtersForApi);
          await fetchNeighborhoodsData(filtersForApi);
        }
      } catch (err) {
        console.error("Erro ao buscar propriedades:", err);
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setProperties([]);
        setTotalPages(1);
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
    ]
  );

  // Funções para o desenho no mapa (iguais à tela de busca)
  const handleDrawingComplete = useCallback(
    async (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      const drawingBounds = calculateDrawingBounds(overlay);
      if (drawingBounds) {
        setMapCenter(drawingBounds.center);
        setMapZoom(drawingBounds.zoom);
      }

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
        return;
      }

      const existingGeometries = currentFilters?.drawingGeometries || [];
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
        drawingGeometries: [...existingGeometries, geometry],
      };

      await applyFilters(newFilters);
    },
    [currentFilters, applyFilters, calculateDrawingBounds]
  );

  const handleClearFilters = useCallback(() => {
    if (currentFilters) {
      const filtersWithoutDrawing: FilterState = {
        ...currentFilters,
        drawingGeometries: undefined,
        addressCoordinates: undefined,
        addressZoom: undefined,
        search: currentFilters.addressCoordinates ? "" : currentFilters.search,
      };
      applyFilters(filtersWithoutDrawing);
      setCurrentPage(1);
    }
  }, [currentFilters, applyFilters]);

  // Função para buscar propriedades quando a página muda
  const fetchProperties = useCallback(
    async (filters: FilterState, page: number) => {
      if (!filters) return;

      setLoading(true);
      setError(null);
      try {
        const sortConfig = mapSortOptionToApi(sortBy);

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
        
        // Adiciona requireAreaInfo para obter dados de área
        apiRequest.requireAreaInfo = true;

        const response = await postPropertyAdSearch(
          apiRequest,
          auth.store.token as string | undefined
        );

        // Armazenar dados originais da API no cache global
        response.data.data.forEach((ad: IPropertyAd) => {
          propertiesCache.current.set(ad.id, ad);
        });

        const propertyData = mapApiToPropertyDataArray(response.data.data);
        setProperties(propertyData);
        setTotalPages(response.data.meta.lastPage);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar propriedades:", err);
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, cityToCodeMap, itemsPerPage, auth.store.token, defaultCity, selectedProperties]
  );

  // Buscar propriedades iniciais quando houver cidades disponíveis
  useEffect(() => {
    const fetchInitial = async () => {
      if (
        availableCities.length > 0 &&
        Object.keys(cityToCodeMap).length > 0 &&
        !currentFilters
      ) {
        const initialFilters: FilterState = {
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

        await applyFilters(initialFilters);
      }
    };

    fetchInitial();
  }, [
    availableCities.length,
    cityToCodeMap,
    currentFilters,
    applyFilters,
  ]);

  // Paginação
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return properties.slice(startIndex, endIndex);
  }, [properties, currentPage]);

  useEffect(() => {
    const total = Math.ceil(properties.length / itemsPerPage);
    setTotalPages(total);
  }, [properties.length]);

  // Handlers
  const handleFilterChange = useCallback(
    (filters: FilterState) => {
      applyFilters(filters);
    },
    [applyFilters]
  );

  const handlePropertySelect = useCallback((id: string, selected: boolean) => {
    setSelectedProperties((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
        // Se o imóvel não está no cache, tentar buscar da lista atual
        if (!propertiesCache.current.has(id)) {
          // Tenta encontrar o imóvel na lista atual e adicionar ao cache
          // Isso pode não funcionar se o imóvel não estiver na página atual
          // Mas pelo menos tenta
        }
      } else {
        newSet.delete(id);
        // Não removemos do cache global, apenas do Set de selecionados
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = new Set(properties.map((p) => p.id));
        setSelectedProperties(allIds);
        // Os dados já devem estar no cache da busca anterior
      } else {
        setSelectedProperties(new Set());
      }
    },
    [properties]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedProperties(new Set());
    // Não limpa o cache global, apenas a seleção
  }, []);

  // Função para calcular médias e métricas
  const calculateAverages = useCallback(() => {
    // Pega os imóveis selecionados do cache
    const selectedAds = Array.from(selectedProperties);
    const properties = selectedAds
      .map((id) => propertiesCache.current.get(id))
      .filter((ad): ad is IPropertyAd => ad !== undefined);

    if (properties.length === 0) {
      // Zera tudo se não houver imóveis
      setTotalValueAverage(0);
      setPricePerAreaAverage(0);
      setUsableAreaAverage(0);
      setTotalAreaAverage(0);
      setBestDeal(0);
      setBestDealPerM2(0);
      setAppraisalValue(0);
      setAverageTotalAreaRange({ min: 0, max: 0 });
      return;
    }

    // Debug: verifica se os dados estão no cache
    if (properties.length > 0) {
      console.log("Calculando médias para", properties.length, "imóveis");
      console.log("Cache tem", propertiesCache.current.size, "imóveis");
      properties.forEach((ad) => {
        const price = getTotalPrice(ad);
        const totalArea = getAreaValue(ad, "TOTAL");
        const usableArea = getAreaValue(ad, "USABLE");
        console.log("Imóvel", ad.id, {
          price,
          totalArea,
          usableArea,
          areas: ad.area?.map((a) => `${a.areaType}: ${a.value}`) || [],
          areaDetails: ad.area || [],
          prices: ad.prices?.map((p) => `${p.businessModel}: ${p.total?.value || 0}`) || [],
        });
      });
    }

    // Mapeia o critério de cálculo para o tipo de área
    const areaType = mapCalculationCriterionToAreaType(calculationCriterion);

    // Arrays para coletar valores válidos
    const totalAreas: number[] = [];
    const usableAreas: number[] = [];
    const totalValues: number[] = [];
    const pricePerAreas: number[] = [];

    // Itera sobre cada imóvel e coleta dados
    properties.forEach((ad) => {
      // Busca área total
      const totalArea = getAreaValue(ad, "TOTAL");
      if (totalArea > 0) {
        totalAreas.push(totalArea);
      }

      // Busca área útil
      const usableArea = getAreaValue(ad, "USABLE");
      if (usableArea > 0) {
        usableAreas.push(usableArea);
      }

      // Busca preço
      const totalPrice = getTotalPrice(ad);
      if (totalPrice > 0) {
        totalValues.push(totalPrice);
      }

      // Calcula preço por m² usando a área selecionada
      const areaValue = getAreaValue(ad, areaType);
      if (totalPrice > 0 && areaValue > 0) {
        const pricePerM2 = totalPrice / areaValue;
        pricePerAreas.push(pricePerM2);
      }
    });

    // Calcula as médias
    const avgTotalValue =
      totalValues.length > 0
        ? Math.round(
            totalValues.reduce((a, b) => a + b, 0) / totalValues.length
          )
        : 0;

    const avgPricePerArea =
      pricePerAreas.length > 0
        ? Math.round(
            pricePerAreas.reduce((a, b) => a + b, 0) / pricePerAreas.length
          )
        : 0;

    const avgUsableArea =
      usableAreas.length > 0
        ? Math.round(
            usableAreas.reduce((a, b) => a + b, 0) / usableAreas.length
          )
        : 0;

    const avgTotalArea =
      totalAreas.length > 0
        ? Math.round(totalAreas.reduce((a, b) => a + b, 0) / totalAreas.length)
        : 0;

    // Encontra o melhor negócio (menor preço/m²)
    const bestDealPricePerM2 =
      pricePerAreas.length > 0 ? Math.min(...pricePerAreas) : 0;
    const bestDealIndex = pricePerAreas.indexOf(bestDealPricePerM2);
    const bestDealProperty =
      bestDealIndex >= 0 ? properties[bestDealIndex] : null;
    const bestDealValue = bestDealProperty
      ? getTotalPrice(bestDealProperty)
      : 0;

    // Calcula faixa de área total
    const areaRange =
      totalAreas.length > 0
        ? {
            min: Math.min(...totalAreas),
            max: Math.max(...totalAreas),
          }
        : { min: 0, max: 0 };

    // Valor de avaliação (média de preços)
    setTotalValueAverage(avgTotalValue);
    setPricePerAreaAverage(avgPricePerArea);
    setUsableAreaAverage(avgUsableArea);
    setTotalAreaAverage(avgTotalArea);
    setBestDeal(bestDealValue);
    setBestDealPerM2(bestDealPricePerM2);
    setAppraisalValue(avgTotalValue);
    setAverageTotalAreaRange(areaRange);
  }, [selectedProperties, calculationCriterion]);

  // Computed properties para gráficos
  const priceDistributionData = useMemo(() => {
    const selectedAds = Array.from(selectedProperties);
    const properties = selectedAds
      .map((id) => propertiesCache.current.get(id))
      .filter((ad): ad is IPropertyAd => ad !== undefined);

    if (properties.length === 0) return [];

    // Pega todos os preços
    const prices = properties
      .map((ad) => getTotalPrice(ad))
      .filter((p) => p > 0);

    if (prices.length === 0) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;

    // Se todos os preços são iguais
    if (range === 0) {
      return [
        {
          label: formatCurrency(Math.round(min)),
          value: prices.length,
        },
      ];
    }

    // Divide em 5 faixas
    const bucketSize = range / 5;
    const buckets = Array.from({ length: 5 }, (_, i) => ({
      label: `${formatCurrency(
        Math.round(min + i * bucketSize)
      )} - ${formatCurrency(Math.round(min + (i + 1) * bucketSize))}`,
      value: 0,
    }));

    // Distribui os preços nas faixas
    prices.forEach((price) => {
      // Calcula o índice da faixa
      let bucketIndex = Math.floor((price - min) / bucketSize);
      
      // Se o preço for exatamente o máximo, coloca na última faixa
      if (price >= max) {
        bucketIndex = 4;
      } else {
        // Garante que o índice está dentro dos limites
        bucketIndex = Math.max(0, Math.min(bucketIndex, 4));
      }
      
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].value++;
      }
    });

    // Retorna todas as faixas (mesmo as vazias) para melhor visualização
    return buckets;
  }, [selectedProperties]);

  const pricePerM2Data = useMemo(() => {
    const selectedAds = Array.from(selectedProperties);
    const properties = selectedAds
      .map((id) => propertiesCache.current.get(id))
      .filter((ad): ad is IPropertyAd => ad !== undefined);

    if (properties.length === 0) return [];

    // Usa selectedAreaType para determinar qual área usar
    const areaType = mapCalculationCriterionToAreaType(calculationCriterion);

    return properties
      .filter((ad) => {
        const areaValue = getAreaValue(ad, areaType);
        const price = getTotalPrice(ad);
        return areaValue > 0 && price > 0;
      })
      .map((ad, index) => {
        const address = ad.formattedAddress || ad.address?.street || "";
        const neighborhood = ad.address?.neighborhood || "";
        const shortAddress = `${address}, ${neighborhood}`.substring(0, 30);
        const pricePerM2 = getPricePerSquareMeter(ad, areaType);
        return {
          label: shortAddress + (address.length > 30 ? "..." : ""),
          value: Math.round(pricePerM2),
        };
      })
      .filter((item) => item.value > 0) // Remove valores 0
      .sort((a, b) => a.value - b.value);
  }, [selectedProperties, calculationCriterion]);

  const propertyTypeDistribution = useMemo(() => {
    const selectedAds = Array.from(selectedProperties);
    const properties = selectedAds
      .map((id) => propertiesCache.current.get(id))
      .filter((ad): ad is IPropertyAd => ad !== undefined);

    if (properties.length === 0) return [];

    const typeCount = properties.reduce(
      (acc, ad) => {
        const type = translatePropertyType(ad.propertyType) || "Outros";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const colors = [
      "#2196F3",
      "#4CAF50",
      "#FFC107",
      "#9C27B0",
      "#F44336",
    ];

    return Object.entries(typeCount).map(([name, count], index) => ({
      type: name,
      count,
      percentage: Math.round((count / properties.length) * 100),
      color: colors[index % colors.length],
    }));
  }, [selectedProperties]);

  // Recalcula médias quando seleção ou critério mudar
  useEffect(() => {
    calculateAverages();
  }, [calculateAverages]);

  const handleAnalysisSummary = useCallback(() => {
    calculateAverages();
    setIsAnalysisDrawerOpen(true);
  }, [calculateAverages]);

  const handleGenerateReport = useCallback(() => {
    setIsReportModalOpen(true);
  }, []);

  const handleExportExcel = useCallback(() => {
    // Pega os imóveis selecionados do cache
    const selectedAds = Array.from(selectedProperties);
    const properties = selectedAds
      .map((id) => propertiesCache.current.get(id))
      .filter((ad): ad is IPropertyAd => ad !== undefined);

    if (properties.length === 0) {
      console.warn("Nenhum imóvel selecionado para exportação");
      return;
    }

    downloadXLSX(properties, calculationCriterion);
  }, [selectedProperties, calculationCriterion]);

  const isAllSelected = useMemo(() => {
    return (
      properties.length > 0 && selectedProperties.size === properties.length
    );
  }, [properties.length, selectedProperties.size]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        px: { xs: 0, sm: 2 },
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        pb: selectedProperties.size > 0 ? 12 : 0, // Espaço para o action bar flutuante
      }}
    >
      <Container maxWidth={false} sx={{ px: 0 }}>
        {/* Layout Principal: Cards + Mapa */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            height: "calc(100vh - 130px)",
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
            {/* Título */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: theme.palette.text.primary,
              }}
            >
              Selecione os imóveis que deseja incluir na avaliação
            </Typography>

            {/* Barra de Filtros */}
            <Box sx={{ mb: 3 }}>
              <FilterBar
                onFiltersChange={handleFilterChange}
                defaultCity={defaultCity}
                availableCities={availableCities}
                cityToCodeMap={cityToCodeMap}
                externalFilters={currentFilters}
              />
            </Box>

            {/* Contador de Resultados, Selecionar Todos e Visualização */}
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
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {properties.length} imóveis encontrados
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={
                        selectedProperties.size > 0 && !isAllSelected
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  }
                  label="Selecionar todos"
                />

                {/* Botões de visualização */}
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

            {/* Lista/Cards de Propriedades */}
            {loading ? (
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
            ) : error ? (
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
                    color: theme.palette.error.main,
                    mb: 2,
                  }}
                >
                  Erro ao buscar imóveis
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
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  pr: 1,
                  "&::-webkit-scrollbar": {
                    width: 6,
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
                {paginatedProperties.length > 0 ? (
                  viewMode === "cards" ? (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          md: "repeat(2, 1fr)",
                          lg: "repeat(3, 1fr)",
                        },
                        gap: 2,
                      }}
                    >
                      {paginatedProperties.map((property) => (
                        <EvaluationPropertyCard
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
                          area={property.area}
                          images={property.images}
                          isSelected={selectedProperties.has(property.id)}
                          onSelectChange={handlePropertySelect}
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
                          }}
                        >
                          {/* Checkbox de seleção */}
                          <Checkbox
                            checked={selectedProperties.has(property.id)}
                            onChange={(e) =>
                              handlePropertySelect(property.id, e.target.checked)
                            }
                          />

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

                            {/* Preço e Preço por m² */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                mb: 0.5,
                                flexWrap: "wrap",
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
                              alignItems: "center",
                              gap: 2,
                              color: "text.secondary",
                            }}
                          >
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
                                        color: getIconColor(
                                          property.propertyType
                                        ),
                                      }}
                                    />
                                    <Typography variant="body2">
                                      {property.bedrooms}{" "}
                                      {property.bedrooms === 1
                                        ? "quarto"
                                        : "quartos"}
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
                                      <Bathroom
                                        sx={{
                                          fontSize: 16,
                                          color: getIconColor(
                                            property.propertyType
                                          ),
                                        }}
                                      />
                                      <Typography variant="body2">
                                        {property.bathrooms}{" "}
                                        {property.bathrooms === 1
                                          ? "banheiro"
                                          : "banheiros"}
                                      </Typography>
                                    </Box>
                                  )}
                                {property.area > 0 && (
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
                                )}
                              </>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    Nenhum imóvel encontrado para os filtros selecionados.
                  </Typography>
                )}
                {/* Paginação */}
                {!loading && properties.length > 0 && totalPages > 1 && (
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
              display: { xs: "none", md: "block" },
            }}
          >
            <MapComponent
              properties={properties}
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
              height="100%"
              filters={currentFilters}
              cityToCodeMap={cityToCodeMap}
              token={
                auth.store.token ||
                localStorage.getItem("auth_token") ||
                undefined
              }
              useMapSearch={true}
            />
          </Box>
        </Box>
      </Container>

      {/* Menu Flutuante de Ações */}
      <EvaluationActionBar
        selectedCount={selectedProperties.size}
        calculationCriterion={calculationCriterion}
        onCalculationCriterionChange={setCalculationCriterion}
        onClearSelection={handleClearSelection}
        onAnalysisSummary={handleAnalysisSummary}
        onGenerateReport={handleGenerateReport}
        onExportExcel={handleExportExcel}
      />

      {/* Modal de Geração de Relatório */}
      <GenerateReportModal
        open={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedCount={selectedProperties.size}
        selectedProperties={Array.from(selectedProperties)
          .map((id) => propertiesCache.current.get(id))
          .filter((ad): ad is IPropertyAd => ad !== undefined)}
        calculationCriterion={calculationCriterion}
      />

      {/* Drawer de Resumo da Análise */}
      <AnalysisSummaryDrawer
        open={isAnalysisDrawerOpen}
        onClose={() => setIsAnalysisDrawerOpen(false)}
        selectedCount={selectedProperties.size}
        appraisalValue={appraisalValue}
        averagePricePerM2={pricePerAreaAverage}
        averageTotalArea={totalAreaAverage}
        averageTotalAreaRange={averageTotalAreaRange}
        bestDeal={bestDeal}
        bestDealPerM2={bestDealPerM2}
        priceDistributionData={priceDistributionData}
        propertyTypesData={propertyTypeDistribution}
        pricePerM2Data={pricePerM2Data}
        areaType={mapCalculationCriterionToAreaType(calculationCriterion)}
      />
    </Box>
  );
}
