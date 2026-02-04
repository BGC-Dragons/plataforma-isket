import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import {
  Box,
  Container,
  useTheme,
  Typography,
  useMediaQuery,
  Button,
  Modal,
  IconButton,
} from "@mui/material";
import { Map, Close } from "@mui/icons-material";
import { FilterBar } from "../../../modules/search/filter/filter-bar";
import { MapComponent } from "../../../modules/search/map/map";
import { RankingDemandAccordion } from "../../../modules/analyses/ranking-demand-accordion";
import { SupplyByTypeAccordion } from "../../../modules/analyses/supply-by-type-accordion";
import { RankingSupplyAccordion } from "../../../modules/analyses/ranking-supply-accordion";
import {
  AnalyticsTabs,
  type AnalyticsTabType,
} from "../../../modules/analyses/analytics-tabs";
import {
  HeatmapToggle,
  type HeatmapMode,
} from "../../../modules/analyses/heatmap-toggle";
import { HeatmapLegend } from "../../../modules/analyses/heatmap-legend";
import { OpportunityInsightsAccordion } from "../../../modules/analyses/opportunity-insights-accordion";
import { postAnalyticsSearchDemandNeighborhoodRanking } from "../../../../services/post-analytics-search-demand-neighborhood-ranking.service";
import { postAnalyticsSupplyByPropertyType } from "../../../../services/post-analytics-supply-by-property-type.service";
import { postAnalyticsSearchDemandHeatMap } from "../../../../services/post-analytics-search-demand-heatmap.service";
import { postAnalyticsSupplyHeatMap } from "../../../../services/post-analytics-supply-heatmap.service";
import { postAnalyticsSupplyNeighborhoodRanking } from "../../../../services/post-analytics-supply-neighborhood-ranking.service";
// import { postAnalyticsAgencyRanking } from "../../../../services/post-analytics-agency-ranking.service";
import { mapFiltersToApi } from "../../../../services/helpers/map-filters-to-api.helper";
import { useAuth } from "../../../modules/access-manager/auth.hook";
import { useCitySelection } from "../../../modules/city-selection/city-selection.hook";
import { getNeighborhoods } from "../../../../services/get-locations-neighborhoods.service";
import type { INeighborhoodFull } from "../../../../services/get-locations-neighborhoods.service";
import { getCityByCode } from "../../../../services/get-locations-city-by-code.service";
import type { ICityFull } from "../../../../services/get-locations-cities.service";
import { postCitiesFindMany } from "../../../../services/post-locations-cities-find-many.service";
import {
  useGetPurchases,
  type IGetPurchasesResponseSuccess,
} from "../../../../services/get-purchases.service";
import {
  convertOverlayToGeoJSONPolygon,
  convertOverlayToGeoJSONCircle,
} from "../../../modules/search/map/map-utils";
import type { FilterState } from "../../../modules/search/filter/filter.types";
import { useFilterSelection } from "../../../modules/filter-selection/filter-selection.hook";

// Calcular período dos últimos 3 meses
const getLastThreeMonthsPeriod = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

// Calcular cityBounds a partir dos dados das cidades
const calculateCityBoundsFromCities = (
  cities: ICityFull[]
):
  | { value: { north: number; east: number; south: number; west: number } }
  | undefined => {
  if (cities.length === 0) {
    return undefined;
  }

  const allCoordinates: Array<{ lat: number; lng: number }> = [];

  cities.forEach((city) => {
    if (!city.geo?.geometry) return;
    const geometry = city.geo.geometry;
    if (geometry.type === "Polygon") {
      const coords = geometry.coordinates as number[][][];
      coords[0]?.forEach((coord) => {
        allCoordinates.push({ lat: coord[1], lng: coord[0] });
      });
    } else if (geometry.type === "MultiPolygon") {
      const coords = geometry.coordinates as number[][][][];
      coords.forEach((polygon) => {
        polygon[0]?.forEach((coord) => {
          allCoordinates.push({ lat: coord[1], lng: coord[0] });
        });
      });
    }
  });

  if (allCoordinates.length === 0) {
    return undefined;
  }

  const lats = allCoordinates.map((c) => c.lat);
  const lngs = allCoordinates.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    value: {
      north: maxLat,
      east: maxLng,
      south: minLat,
      west: minLng,
    },
  };
};

// Calcular bounds a partir dos dados dos bairros
const calculateBoundsFromNeighborhoods = (
  neighborhoods: INeighborhoodFull[]
):
  | { value: { north: number; east: number; south: number; west: number } }
  | undefined => {
  if (neighborhoods.length === 0) {
    return undefined;
  }

  const allCoordinates: Array<{ lat: number; lng: number }> = [];

  neighborhoods.forEach((neighborhood) => {
    if (!neighborhood.geo) return;
    const geometry = neighborhood.geo;
    // INeighborhoodGeo sempre é Polygon, não MultiPolygon
    if (geometry.type === "Polygon") {
      const coords = geometry.coordinates;
      coords[0]?.forEach((coord) => {
        allCoordinates.push({ lat: coord[1], lng: coord[0] });
      });
    }
  });

  if (allCoordinates.length === 0) {
    return undefined;
  }

  const lats = allCoordinates.map((c) => c.lat);
  const lngs = allCoordinates.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    value: {
      north: maxLat,
      east: maxLng,
      south: minLat,
      west: minLng,
    },
  };
};

export function AnalysesComponent() {
  const theme = useTheme();
  const location = useLocation();
  const auth = useAuth();
  const { cities: contextCities, setCities: setContextCities } =
    useCitySelection();
  const { filters: persistedFilters, setFilters: setPersistedFilters } =
    useFilterSelection();

  const [currentFilters, setCurrentFilters] = useState<FilterState | undefined>(
    undefined
  );
  const [neighborhoodRanking, setNeighborhoodRanking] = useState<
    Array<{ neighborhood: string; count: number }>
  >([]);
  const [supplyByType, setSupplyByType] = useState<
    Array<{ propertyType: string; count: number }>
  >([]);
  // const [agencyRanking, setAgencyRanking] = useState<
  //   Array<{
  //     agencyId: string;
  //     agencyName: string;
  //     neighborhoods: Array<{
  //       neighborhood: string;
  //       venda: number;
  //       aluguel: number;
  //       total: number;
  //     }>;
  //     totalVenda: number;
  //     totalAluguel: number;
  //     totalGeral: number;
  //     totalStockValue?: number;
  //   }>
  // >([]);
  // const [loading, setLoading] = useState(false);
  const [loadingNeighborhoodRanking, setLoadingNeighborhoodRanking] =
    useState(false);
  const [loadingSupplyByType, setLoadingSupplyByType] = useState(false);
  // const [loadingAgencyRanking, setLoadingAgencyRanking] = useState(false);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [supplyHeatmapData, setSupplyHeatmapData] = useState<number[][]>([]);
  const [supplyNeighborhoodRanking, setSupplyNeighborhoodRanking] = useState<
    Array<{ neighborhood: string; count: number }>
  >([]);
  const [
    loadingSupplyNeighborhoodRanking,
    setLoadingSupplyNeighborhoodRanking,
  ] = useState(false);

  // Estados das tabs e heatmap mode
  const [activeTab, setActiveTab] = useState<AnalyticsTabType>("demanda");
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("demand");

  // Estados dos accordions
  const [rankingExpanded, setRankingExpanded] = useState(true);
  const [supplyExpanded, setSupplyExpanded] = useState(true);
  const [supplyRankingExpanded, setSupplyRankingExpanded] = useState(true);
  const [opportunityExpanded, setOpportunityExpanded] = useState(true);
  // const [agencyExpanded, setAgencyExpanded] = useState(false);

  // Estados do mapa
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

  // Detectar quando a tela é menor que 900px (para mostrar botão flutuante do mapa)
  const isSmallScreen = useMediaQuery("(max-width: 899px)", {
    noSsr: true,
  });

  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Obter compras para extrair cidades disponíveis
  const { data: purchasesData } = useGetPurchases();

  // Função para converter cityStateCode para formato de exibição
  const formatCityNameFromCode = useCallback(
    (cityStateCode: string): string => {
      const cityParts = cityStateCode.split("_");
      const cityName = cityParts.slice(0, -1).join(" ").toUpperCase();
      return cityName;
    },
    []
  );

  // Extrair cidades disponíveis das compras
  const { availableCities, cityToCodeMap, defaultCityStateCode } =
    useMemo(() => {
      if (!purchasesData || purchasesData.length === 0) {
        return {
          availableCities: ["CURITIBA"],
          cityToCodeMap: {} as Record<string, string>,
          defaultCityStateCode: undefined,
        };
      }

      const citiesSet = new Set<string>();
      const cityToCode: Record<string, string> = {};
      let defaultCityCode: string | undefined;

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

  // Cidade padrão (cidade padrão do plano ou primeira cidade disponível ou fallback)
  const defaultCity = useMemo(() => {
    if (defaultCityStateCode) {
      return formatCityNameFromCode(defaultCityStateCode);
    }
    return availableCities.length > 0 ? availableCities[0] : "CURITIBA";
  }, [availableCities, defaultCityStateCode, formatCityNameFromCode]);

  // Buscar dados de análises
  const loadAnalyticsData = useCallback(
    async (
      filters: FilterState,
      citiesForBounds?: ICityFull[],
      neighborhoodsForBounds?: INeighborhoodFull[]
    ) => {
      if (!auth.store.token) return;

      // Usar cidade padrão se não houver cidade selecionada
      const shouldUseDefaultCity =
        filters.cities.length === 0 &&
        !filters.addressCoordinates &&
        (!filters.drawingGeometries ||
          filters.drawingGeometries.length === 0) &&
        defaultCity;
      const effectiveFilters = shouldUseDefaultCity
        ? { ...filters, cities: [defaultCity] }
        : filters;

      const period = getLastThreeMonthsPeriod();
      const apiFilters = mapFiltersToApi(
        effectiveFilters,
        cityToCodeMap,
        1,
        1,
        "price",
        "asc"
      );

      // Calcular bounds: priorizar bairros selecionados, depois cidades (para heatmap/mapa)
      const neighborhoodsToUse = neighborhoodsForBounds || neighborhoodsData;
      const citiesToUse = citiesForBounds || citiesData;

      let cityBounds;
      if (neighborhoodsToUse.length > 0) {
        // Se há bairros selecionados, usar bounds dos bairros
        cityBounds = calculateBoundsFromNeighborhoods(neighborhoodsToUse);
      } else if (citiesToUse.length > 0) {
        // Se não há bairros, usar bounds das cidades
        cityBounds = calculateCityBoundsFromCities(citiesToUse);
      }

      // Payload para heatmaps e oferta por tipo (usa bounds da seleção atual)
      const basePayload = {
        ...apiFilters,
        startDate: period.startDate,
        endDate: period.endDate,
        ...(cityBounds && { cityBounds }),
      };

      // Payload para rankings: sempre usar bounds da cidade inteira, para que os dados
      // do ranking estejam sempre disponíveis; o accordion filtra por bairros selecionados no mapa
      const cityOnlyBounds =
        citiesToUse.length > 0
          ? calculateCityBoundsFromCities(citiesToUse)
          : undefined;
      const rankingPayload = {
        ...apiFilters,
        startDate: period.startDate,
        endDate: period.endDate,
        ...(cityOnlyBounds && { cityBounds: cityOnlyBounds }),
      };
      // Alguns endpoints de ranking não suportam filtro de bairros; remover para evitar resposta vazia
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const rankingPayloadNoNeighborhoods = (({ neighborhoods, ...rest }) =>
        rest)(rankingPayload);

      try {
        // Buscar ranking de demanda (sempre com dados da cidade inteira; filtro por bairro é no accordion)
        setLoadingNeighborhoodRanking(true);
        const demandResponse =
          await postAnalyticsSearchDemandNeighborhoodRanking(
            {
              ...rankingPayload,
              refAuthType: "PUBLIC",
            },
            auth.store.token
          );
        setNeighborhoodRanking(demandResponse.data.data || []);
      } catch (error) {
        console.error("Erro ao buscar ranking de demanda:", error);
        setNeighborhoodRanking([]);
      } finally {
        setLoadingNeighborhoodRanking(false);
      }

      try {
        // Buscar oferta por tipo
        setLoadingSupplyByType(true);
        const supplyResponse = await postAnalyticsSupplyByPropertyType(
          basePayload,
          auth.store.token
        );
        setSupplyByType(supplyResponse.data.data || []);
      } catch (error) {
        console.error("Erro ao buscar oferta por tipo:", error);
        setSupplyByType([]);
      } finally {
        setLoadingSupplyByType(false);
      }

      try {
        // Buscar heatmap de demanda
        const heatmapResponse = await postAnalyticsSearchDemandHeatMap(
          {
            ...basePayload,
            refAuthType: "PUBLIC",
          },
          auth.store.token
        );
        setHeatmapData(heatmapResponse.data.data || []);
      } catch (error) {
        console.error("Erro ao buscar heatmap de demanda:", error);
        setHeatmapData([]);
      }

      try {
        // Buscar heatmap de oferta
        const supplyHeatmapResponse = await postAnalyticsSupplyHeatMap(
          basePayload,
          auth.store.token
        );
        setSupplyHeatmapData(supplyHeatmapResponse.data.data || []);
      } catch (error) {
        console.error("Erro ao buscar heatmap de oferta:", error);
        setSupplyHeatmapData([]);
      }

      try {
        // Buscar ranking de oferta por bairro (sempre com dados da cidade inteira; filtro por bairro é no accordion)
        setLoadingSupplyNeighborhoodRanking(true);
        const supplyNeighborhoodResponse =
          await postAnalyticsSupplyNeighborhoodRanking(
            rankingPayloadNoNeighborhoods,
            auth.store.token
          );
        setSupplyNeighborhoodRanking(
          supplyNeighborhoodResponse.data.data || []
        );
      } catch (error) {
        console.error("Erro ao buscar ranking de oferta por bairro:", error);
        setSupplyNeighborhoodRanking([]);
      } finally {
        setLoadingSupplyNeighborhoodRanking(false);
      }

      // try {
      //   // Buscar ranking de imobiliárias
      //   setLoadingAgencyRanking(true);
      //   const agencyResponse = await postAnalyticsAgencyRanking(
      //     {
      //       ...apiFilters,
      //       startDate: period.startDate,
      //       endDate: period.endDate,
      //     },
      //     auth.store.token
      //   );
      //   setAgencyRanking(agencyResponse.data.data || []);
      // } catch (error) {
      //   console.error("Erro ao buscar ranking de imobiliárias:", error);
      //   setAgencyRanking([]);
      // } finally {
      //   setLoadingAgencyRanking(false);
      //       }
    },
    [
      auth.store.token,
      cityToCodeMap,
      neighborhoodsData,
      citiesData,
      defaultCity,
    ]
  );

  // Buscar dados de cidades
  // Quando apenas cidades são selecionadas (sem bairros), usa o endpoint individual que retorna geo completo
  const fetchCitiesData = useCallback(
    async (filters: FilterState): Promise<ICityFull[]> => {
      if (filters.cities.length === 0) {
        setCitiesData([]);
        return [];
      }

      try {
        // Obter códigos das cidades selecionadas
        const cityStateCodes = filters.cities
          .map((city) => cityToCodeMap[city])
          .filter((code): code is string => Boolean(code));

        if (cityStateCodes.length === 0) {
          setCitiesData([]);
          return [];
        }

        let cities: ICityFull[] = [];
        // Se não há bairros selecionados, buscar cada cidade individualmente pelo endpoint que retorna geo completo
        // Isso garante que temos os dados geoespaciais da cidade
        if (filters.neighborhoods.length === 0) {
          const cityPromises = cityStateCodes.map((code) =>
            getCityByCode(code, auth.store.token as string | undefined)
          );
          const cityResponses = await Promise.all(cityPromises);
          cities = cityResponses.map((response) => response.data);
          setCitiesData(cities);
        } else {
          // Se há bairros selecionados, usar findMany (mais eficiente)
          const response = await postCitiesFindMany(
            { cityStateCodes },
            auth.store.token as string | undefined
          );
          cities = response.data;
          setCitiesData(cities);
        }
        return cities;
      } catch (error) {
        console.error("Erro ao buscar dados das cidades:", error);
        setCitiesData([]);
        return [];
      }
    },
    [cityToCodeMap, auth.store.token]
  );

  // Buscar dados de bairros
  // Carrega lista completa apenas quando as cidades mudarem
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
      } catch (error) {
        console.error("Erro ao buscar dados dos bairros:", error);
        setNeighborhoodsData([]);
        setAllNeighborhoodsForBounds([]);
      }
    },
    [cityToCodeMap, auth.store.token]
  );

  // Aplicar filtros (definido após fetchCitiesData e fetchNeighborhoodsData)
  const applyFilters = useCallback(
    async (filters: FilterState) => {
      const shouldUseDefaultCity =
        filters.cities.length === 0 &&
        !filters.addressCoordinates &&
        (!filters.drawingGeometries ||
          filters.drawingGeometries.length === 0) &&
        defaultCity;
      const effectiveFilters = shouldUseDefaultCity
        ? { ...filters, cities: [defaultCity] }
        : filters;

      setCurrentFilters(filters);
      setPersistedFilters(filters);
      // Sincronizar cidades com contexto quando filtros mudarem
      if (filters.cities.length > 0) {
        setContextCities(filters.cities);
      } else {
        setContextCities([]);
      }

      // Buscar dados geoespaciais primeiro (para ter dados disponíveis para calcular bounds)
      let fetchedCities: ICityFull[] = [];
      let fetchedNeighborhoods: INeighborhoodFull[] = [];

      if (!effectiveFilters.addressCoordinates) {
        fetchedCities = await fetchCitiesData(effectiveFilters);
        await fetchNeighborhoodsData(effectiveFilters);

        // Se há bairros selecionados, buscar os dados dos bairros selecionados
        if (effectiveFilters.neighborhoods.length > 0) {
          // Buscar todos os bairros das cidades
          const cityStateCodes = effectiveFilters.cities
            .map((city) => cityToCodeMap[city])
            .filter((code): code is string => Boolean(code));

          if (cityStateCodes.length > 0) {
            try {
              const response = await getNeighborhoods(
                cityStateCodes,
                auth.store.token as string | undefined
              );
              // Filtrar apenas os bairros selecionados
              fetchedNeighborhoods = response.data.filter((neighborhood) =>
                effectiveFilters.neighborhoods.includes(neighborhood.name)
              );
            } catch (error) {
              console.error("Erro ao buscar bairros selecionados:", error);
            }
          }
        }
      }

      // Sinalizar que applyFilters já está tratando a chamada de loadAnalyticsData
      // para evitar que o useEffect de neighborhoodsData/citiesData dispare duplicado
      skipNextAnalyticsReloadRef.current = true;
      const fetchedNeighborhoodsKey = fetchedNeighborhoods
        .map((n) => n.name || "")
        .sort()
        .join(",");
      const fetchedCitiesKey = fetchedCities
        .map((c) => c.cityStateCode || "")
        .sort()
        .join(",");
      suppressNextAnalyticsReloadRef.current = {
        neighborhoodsKey: fetchedNeighborhoodsKey,
        citiesKey: fetchedCitiesKey,
      };

      // Buscar dados de análises com bounds corretos
      await loadAnalyticsData(
        effectiveFilters,
        fetchedCities.length > 0 ? fetchedCities : undefined,
        fetchedNeighborhoods.length > 0 ? fetchedNeighborhoods : undefined
      );
    },
    [
      loadAnalyticsData,
      fetchCitiesData,
      fetchNeighborhoodsData,
      cityToCodeMap,
      auth.store.token,
      setContextCities,
      setPersistedFilters,
      defaultCity,
    ]
  );

  // Ref para rastrear cidades anteriores e evitar buscas duplicadas
  const previousCitiesRef = useRef<string>("");

  // Efeito para buscar dados das cidades imediatamente quando as cidades mudarem
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
      fetchCitiesData(currentFilters);
    }
  }, [currentFilters, fetchCitiesData]);

  // Ref para rastrear cidades anteriores e evitar buscas duplicadas de bairros
  const previousNeighborhoodCitiesRef = useRef<string>("");

  // Efeito para buscar lista completa de bairros quando as cidades mudarem
  useEffect(() => {
    // Não buscar dados de bairros quando há busca por endereço (para não sobrescrever centralização)
    if (!currentFilters || currentFilters.addressCoordinates) {
      previousNeighborhoodCitiesRef.current = "";
      return;
    }

    const citiesKey =
      currentFilters.cities.length > 0
        ? [...currentFilters.cities].sort().join(",")
        : "";

    if (previousNeighborhoodCitiesRef.current !== citiesKey) {
      previousNeighborhoodCitiesRef.current = citiesKey;
      fetchNeighborhoodsData(currentFilters);
    }
  }, [currentFilters, fetchNeighborhoodsData]);

  // Efeito para derivar bairros selecionados sem refetch (evita piscar)
  useEffect(() => {
    if (!currentFilters) return;

    if (currentFilters.neighborhoods.length === 0) {
      setNeighborhoodsData([]);
      return;
    }

    const selectedNeighborhoods = allNeighborhoodsForBounds.filter(
      (neighborhood) => currentFilters.neighborhoods.includes(neighborhood.name)
    );
    setNeighborhoodsData(selectedNeighborhoods);
  }, [currentFilters, allNeighborhoodsForBounds]);

  // Ref para evitar que o useEffect abaixo dispare logo após applyFilters já ter chamado loadAnalyticsData
  const skipNextAnalyticsReloadRef = useRef(false);
  const suppressNextAnalyticsReloadRef = useRef<{
    neighborhoodsKey: string;
    citiesKey: string;
  } | null>(null);

  // Efeito para recarregar dados de análises quando neighborhoodsData ou citiesData mudarem
  // Isso garante que cityBounds seja recalculado corretamente quando bairros são selecionados
  // Usar ref para evitar recarregamentos desnecessários
  const lastNeighborhoodsKeyRef = useRef<string>("");
  const lastCitiesKeyRef = useRef<string>("");

  useEffect(() => {
    if (!currentFilters || currentFilters.addressCoordinates) {
      return;
    }

    // Criar chaves para comparar mudanças
    const neighborhoodsKey = neighborhoodsData
      .map((n) => n.name || "")
      .sort()
      .join(",");
    const citiesKey = citiesData
      .map((c) => c.cityStateCode || "")
      .sort()
      .join(",");

    // Só recarregar se realmente mudou
    if (
      lastNeighborhoodsKeyRef.current !== neighborhoodsKey ||
      lastCitiesKeyRef.current !== citiesKey
    ) {
      // Se applyFilters já buscou com estes mesmos bounds, não recarregar de novo
      if (
        suppressNextAnalyticsReloadRef.current &&
        suppressNextAnalyticsReloadRef.current.neighborhoodsKey ===
          neighborhoodsKey &&
        suppressNextAnalyticsReloadRef.current.citiesKey === citiesKey
      ) {
        suppressNextAnalyticsReloadRef.current = null;
        lastNeighborhoodsKeyRef.current = neighborhoodsKey;
        lastCitiesKeyRef.current = citiesKey;
        return;
      }

      lastNeighborhoodsKeyRef.current = neighborhoodsKey;
      lastCitiesKeyRef.current = citiesKey;

      // Pular se applyFilters já chamou loadAnalyticsData
      if (skipNextAnalyticsReloadRef.current) {
        skipNextAnalyticsReloadRef.current = false;
        return;
      }

      // Recarregar dados com bounds atualizados
      loadAnalyticsData(currentFilters, citiesData, neighborhoodsData);
    }
  }, [neighborhoodsData, citiesData, currentFilters, loadAnalyticsData]);

  // Efeito para centralizar o mapa quando há busca por endereço (prioridade máxima)
  useEffect(() => {
    if (currentFilters?.addressCoordinates && currentFilters?.addressZoom) {
      setMapCenter(currentFilters.addressCoordinates);
      setMapZoom(currentFilters.addressZoom);
      return;
    }
  }, [currentFilters?.addressCoordinates, currentFilters?.addressZoom]);

  // Sincronizar tab com heatmap mode
  useEffect(() => {
    if (activeTab === "demanda") {
      setHeatmapMode("demand");
    } else if (activeTab === "oferta") {
      setHeatmapMode("supply");
    }
    // Para "oportunidades", mantém a seleção manual do toggle
  }, [activeTab]);

  // Calcular se é busca apenas por cidade (sem bairros específicos)
  const isCityOnlySearch = useMemo(() => {
    return (
      citiesData.length > 0 &&
      neighborhoodsData.length === 0 &&
      (!currentFilters || (currentFilters.neighborhoods?.length || 0) === 0)
    );
  }, [citiesData.length, neighborhoodsData.length, currentFilters]);

  // Calcular centro e zoom do mapa (mesma lógica do SearchComponent)
  const calculateMapBounds = useCallback(
    (
      neighborhoods: INeighborhoodFull[],
      cities: ICityFull[]
    ): { center?: { lat: number; lng: number }; zoom?: number } => {
      const allCoordinates: Array<{ lat: number; lng: number }> = [];

      neighborhoods.forEach((neighborhood) => {
        if (!neighborhood.geo) return;
        const geometry = neighborhood.geo;
        // INeighborhoodGeo sempre é Polygon, não MultiPolygon
        if (geometry.type === "Polygon") {
          const coords = geometry.coordinates;
          coords[0]?.forEach((coord) => {
            allCoordinates.push({ lat: coord[1], lng: coord[0] });
          });
        }
      });

      cities.forEach((city) => {
        if (!city.geo?.geometry) return;
        const geometry = city.geo.geometry;
        if (geometry.type === "Polygon") {
          const coords = geometry.coordinates as number[][][];
          coords[0]?.forEach((coord) => {
            allCoordinates.push({ lat: coord[1], lng: coord[0] });
          });
        } else if (geometry.type === "MultiPolygon") {
          const coords = geometry.coordinates as unknown as number[][][][];
          // Iterar sobre todos os polígonos no MultiPolygon, não apenas o primeiro
          coords.forEach((polygon) => {
            polygon[0]?.forEach((coord) => {
              allCoordinates.push({ lat: coord[1], lng: coord[0] });
            });
          });
        }
      });

      if (allCoordinates.length === 0) {
        return { center: undefined, zoom: undefined };
      }

      const lats = allCoordinates.map((c) => c.lat);
      const lngs = allCoordinates.map((c) => c.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const center = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      };

      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);

      const isCityOnly = cities.length > 0 && neighborhoods.length === 0;
      let zoom = 12;
      const MAX_ZOOM = 13;

      if (isCityOnly) {
        // Ajustar zoom para mostrar visualização mais ampla das cidades
        if (maxDiff > 0.4) zoom = 10;
        else if (maxDiff > 0.25) zoom = 11;
        else if (maxDiff > 0.15)
          zoom = 11; // reduzido de 12 para 11 para visualização mais ampla
        else if (maxDiff > 0.08)
          zoom = 11; // reduzido de 12 para 11 para visualização mais ampla
        else if (maxDiff > 0.04)
          zoom = 11; // reduzido de 12 para 11 para visualização mais ampla
        else zoom = 12; // reduzido de 13 para 12 para visualização mais ampla
        zoom = Math.min(zoom, MAX_ZOOM);
      } else if (neighborhoods.length > 50) {
        if (maxDiff > 0.3) zoom = 11;
        else if (maxDiff > 0.15) zoom = 12;
        else if (maxDiff > 0.08) zoom = 13;
        else zoom = 13;
      } else {
        if (neighborhoods.length === 1) {
          if (maxDiff > 0.1) zoom = 12;
          else if (maxDiff > 0.05) zoom = 13;
          else if (maxDiff > 0.02) zoom = 13;
          else zoom = 13;
        } else {
          if (maxDiff > 0.5) zoom = 9;
          else if (maxDiff > 0.2) zoom = 10;
          else if (maxDiff > 0.1) zoom = 11;
          else if (maxDiff > 0.05) zoom = 12;
          else if (maxDiff > 0.02) zoom = 13;
          else zoom = 13;
        }
      }

      zoom = Math.min(zoom, MAX_ZOOM);
      return { center, zoom };
    },
    []
  );

  // Efeito para calcular bounds quando cidades ou bairros mudarem
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
    const neighborhoodsToUse =
      neighborhoodsData.length > 0 ? neighborhoodsData : [];

    // Quando é busca apenas por cidade, usar apenas citiesData
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
    isCityOnlySearch,
    currentFilters?.addressCoordinates,
    currentFilters?.drawingGeometries,
  ]);

  useEffect(() => {
    if (!currentFilters && persistedFilters) {
      applyFilters(persistedFilters);
    }
  }, [currentFilters, persistedFilters, applyFilters]);

  // Carregar dados iniciais apenas em caso de redirecionamento com filtro de bairro
  useEffect(() => {
    if (persistedFilters) {
      return;
    }
    if (location.state?.neighborhoodFilter && !currentFilters) {
      // Se veio de redirecionamento com filtro de bairro
      // Usar cidades do contexto se disponíveis, senão usar defaultCity
      const citiesToUse =
        contextCities.length > 0
          ? contextCities.filter((city) => availableCities.includes(city))
          : defaultCity
          ? [defaultCity]
          : [];
      const initialFilters: FilterState = {
        search: "",
        cities: citiesToUse,
        neighborhoods: [location.state.neighborhoodFilter],
        venda: true,
        aluguel: true,
        residencial: true,
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
        propertyFeatures: [],
      };
      applyFilters(initialFilters);
    }
    // Removido: não inicializar filtros automaticamente
    // O usuário deve selecionar a cidade manualmente
    // Quando não houver cidade selecionada, a cidade padrão será usada nas buscas
  }, [
    location.state,
    currentFilters,
    applyFilters,
    contextCities,
    availableCities,
    persistedFilters,
    defaultCity,
  ]);

  // Handlers do mapa
  const handleDrawingComplete = useCallback(
    (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      if (!currentFilters) return;

      const existingGeometries = currentFilters.drawingGeometries || [];

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

      const overlayIndex = (
        overlay.overlay as unknown as {
          __drawingIndex?: number;
        }
      )?.__drawingIndex;
      const nextGeometries = [...existingGeometries];
      if (typeof overlayIndex === "number" && overlayIndex >= 0) {
        nextGeometries[overlayIndex] = geometry;
      } else {
        const newIndex = nextGeometries.length;
        (
          overlay.overlay as unknown as { __drawingIndex?: number }
        ).__drawingIndex = newIndex;
        nextGeometries.push(geometry);
      }

      applyFilters({
        ...currentFilters,
        drawingGeometries: nextGeometries,
      });
    },
    [currentFilters, applyFilters]
  );

  const handleClearFilters = useCallback(() => {
    if (!defaultCity) return;
    const clearedFilters: FilterState = {
      search: "",
      cities: [defaultCity],
      neighborhoods: [],
      venda: true,
      aluguel: true,
      residencial: true,
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
      propertyFeatures: [],
      drawingGeometries: [],
    };
    applyFilters(clearedFilters);
  }, [defaultCity, applyFilters]);

  const handleNeighborhoodClick = useCallback(
    (neighborhood: INeighborhoodFull) => {
      if (!currentFilters) return;

      const isSelected = currentFilters.neighborhoods.includes(
        neighborhood.name
      );
      const newNeighborhoods = isSelected
        ? currentFilters.neighborhoods.filter((n) => n !== neighborhood.name)
        : [...currentFilters.neighborhoods, neighborhood.name];

      applyFilters({
        ...currentFilters,
        neighborhoods: newNeighborhoods,
      });
    },
    [currentFilters, applyFilters]
  );

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        px: { xs: 0, sm: 2 },
        position: "relative",
        overflow: { xs: "auto", sm: "hidden" },
        overflowX: "hidden", // Prevenir scroll horizontal em toda a tela
        display: "flex",
        flexDirection: "column",
        height: {
          xs: "calc(var(--app-height, 100vh) - 130px)",
          sm: "100%",
        },
      }}
    >
      <Container
        maxWidth={false}
        sx={{ px: 0, overflowX: "hidden", maxWidth: "100%" }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 3,
            height: {
              xs: "auto",
              sm: "calc(var(--app-height, 100vh) - 130px)",
            },
            minHeight: { xs: "auto", sm: 600 },
            minWidth: 0,
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          {/* Coluna Esquerda: Accordions */}
          <Box
            sx={{
              flex: 1.5,
              minWidth: 0,
              maxWidth: "100%", // Prevenir overflow horizontal
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: { xs: "visible", sm: "auto" },
              overflowX: "hidden", // Prevenir scroll horizontal
              p: { xs: 2, sm: 0 },
              px: { xs: 2, sm: 2 },
              pb: {
                xs: isSmallScreen
                  ? `calc(${theme.spacing(12)} + env(safe-area-inset-bottom))`
                  : theme.spacing(2),
                sm: theme.spacing(2),
              },
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
              Faça análises de imóveis e imobiliárias
            </Typography>

            {/* Barra de Filtros */}
            <Box sx={{ mb: 3 }}>
              <FilterBar
                onFiltersChange={applyFilters}
                defaultCity={defaultCity}
                availableCities={availableCities}
                cityToCodeMap={cityToCodeMap}
                externalFilters={currentFilters}
              />
            </Box>

            {/* Tabs de navegação */}
            <AnalyticsTabs activeTab={activeTab} onChange={setActiveTab} />

            {/* Conteúdo das tabs */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {activeTab === "demanda" && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Onde os usuários estão buscando imóveis (baseado em
                    visualizações de anúncios)
                  </Typography>
                  <RankingDemandAccordion
                    data={neighborhoodRanking}
                    selectedNeighborhoods={currentFilters?.neighborhoods || []}
                    loading={loadingNeighborhoodRanking}
                    expanded={rankingExpanded}
                    onChange={setRankingExpanded}
                  />
                </>
              )}

              {activeTab === "oferta" && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Quantidade de imóveis disponíveis no mercado
                  </Typography>
                  <RankingSupplyAccordion
                    data={supplyNeighborhoodRanking}
                    selectedNeighborhoods={currentFilters?.neighborhoods || []}
                    loading={loadingSupplyNeighborhoodRanking}
                    expanded={supplyRankingExpanded}
                    onChange={setSupplyRankingExpanded}
                  />
                  <SupplyByTypeAccordion
                    data={supplyByType}
                    loading={loadingSupplyByType}
                    expanded={supplyExpanded}
                    onChange={setSupplyExpanded}
                  />
                </>
              )}

              {activeTab === "oportunidades" && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Regiões com alta demanda e baixa oferta são ótimas
                    oportunidades para captação de imóveis
                  </Typography>
                  <OpportunityInsightsAccordion
                    demandData={neighborhoodRanking}
                    supplyData={supplyNeighborhoodRanking}
                    loading={
                      loadingNeighborhoodRanking ||
                      loadingSupplyNeighborhoodRanking
                    }
                    expanded={opportunityExpanded}
                    onChange={setOpportunityExpanded}
                  />
                </>
              )}
            </Box>
          </Box>

          {/* Coluna Direita: Mapa */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: { xs: "none", md: "flex" }, // Esconde em telas menores que 900px
              flexDirection: "column",
            }}
          >
            {/* Toggle de Heat Map */}
            <HeatmapToggle value={heatmapMode} onChange={setHeatmapMode} />

            {/* Mapa com legenda */}
            <Box sx={{ flex: 1, position: "relative" }}>
              <MapComponent
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
                token={
                  auth.store.token ||
                  localStorage.getItem("auth_token") ||
                  undefined
                }
                useMapSearch={false}
                openInModal={false}
                onNeighborhoodClick={handleNeighborhoodClick}
                heatmapData={
                  heatmapMode === "demand" ? heatmapData : supplyHeatmapData
                }
                heatmapMode={heatmapMode}
              />
              {/* Legenda do Heat Map */}
              <HeatmapLegend mode={heatmapMode} />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Botão flutuante para abrir mapa (telas menores que 900px) */}
      {isSmallScreen && (
        <Box
          sx={{
            position: "fixed",
            bottom: `calc(24px + env(safe-area-inset-bottom))`,
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

      {/* Modal do Mapa (telas menores que 900px) */}
      {isSmallScreen && (
        <Modal
          open={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: theme.zIndex.modal + 2,
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
                Mapa de Análises
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

            {/* Toggle de Heat Map */}
            <Box
              sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <HeatmapToggle value={heatmapMode} onChange={setHeatmapMode} />
            </Box>

            {/* Mapa */}
            <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <MapComponent
                key={`map-modal-${mapModalOpen}-${citiesData.length}-${heatmapData.length}-${heatmapMode}`}
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
                token={
                  auth.store.token ||
                  localStorage.getItem("auth_token") ||
                  undefined
                }
                useMapSearch={false}
                openInModal={true}
                onNeighborhoodClick={handleNeighborhoodClick}
                heatmapData={
                  heatmapMode === "demand" ? heatmapData : supplyHeatmapData
                }
                heatmapMode={heatmapMode}
              />
              {/* Legenda do Heat Map */}
              <HeatmapLegend mode={heatmapMode} />
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
