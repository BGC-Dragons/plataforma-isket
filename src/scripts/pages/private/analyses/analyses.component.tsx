import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import {
  Box,
  Container,
  useTheme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { FilterBar } from "../../../modules/search/filter/filter-bar";
import { MapComponent } from "../../../modules/search/map/map";
import { RankingDemandAccordion } from "../../../modules/analyses/ranking-demand-accordion";
import { SupplyByTypeAccordion } from "../../../modules/analyses/supply-by-type-accordion";
// import { AgencyRankingAccordion } from "../../../modules/analyses/agency-ranking-accordion";
import { postAnalyticsSearchDemandNeighborhoodRanking } from "../../../../services/post-analytics-search-demand-neighborhood-ranking.service";
import { postAnalyticsSupplyByPropertyType } from "../../../../services/post-analytics-supply-by-property-type.service";
import { postAnalyticsSearchDemandHeatMap } from "../../../../services/post-analytics-search-demand-heatmap.service";
import { postAnalyticsSupplyHeatMap } from "../../../../services/post-analytics-supply-heatmap.service";
// import { postAnalyticsAgencyRanking } from "../../../../services/post-analytics-agency-ranking.service";
import { mapFiltersToApi } from "../../../../services/helpers/map-filters-to-api.helper";
import type { ILocalFilterState } from "../../../../services/helpers/map-filters-to-api.helper";
import { useAuth } from "../../../modules/access-manager/auth.hook";
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

export function AnalysesComponent() {
  const theme = useTheme();
  const location = useLocation();
  const auth = useAuth();

  const [currentFilters, setCurrentFilters] = useState<ILocalFilterState | undefined>(undefined);
  const [neighborhoodRanking, setNeighborhoodRanking] = useState<
    Array<{ neighborhood: string; count: number }>
  >([]);
  const [supplyByType, setSupplyByType] = useState<
    Array<{ propertyType: string; count: number }>
  >([]);
  const [agencyRanking, setAgencyRanking] = useState<
    Array<{
      agencyId: string;
      agencyName: string;
      neighborhoods: Array<{
        neighborhood: string;
        venda: number;
        aluguel: number;
        total: number;
      }>;
      totalVenda: number;
      totalAluguel: number;
      totalGeral: number;
      totalStockValue?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingNeighborhoodRanking, setLoadingNeighborhoodRanking] = useState(false);
  const [loadingSupplyByType, setLoadingSupplyByType] = useState(false);
  const [loadingAgencyRanking, setLoadingAgencyRanking] = useState(false);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);

  // Estados dos accordions
  const [rankingExpanded, setRankingExpanded] = useState(true);
  const [supplyExpanded, setSupplyExpanded] = useState(false);
  const [agencyExpanded, setAgencyExpanded] = useState(false);

  // Estados do mapa
  const [neighborhoodsData, setNeighborhoodsData] = useState<INeighborhoodFull[]>([]);
  const [allNeighborhoodsForBounds, setAllNeighborhoodsForBounds] = useState<INeighborhoodFull[]>([]);
  const [citiesData, setCitiesData] = useState<ICityFull[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);

  const isMobile = useMediaQuery("(max-width: 599px)", { noSsr: true });

  // Obter compras para extrair cidades disponíveis
  const { data: purchasesData } = useGetPurchases();

  // Função para converter cityStateCode para formato de exibição
  const formatCityNameFromCode = useCallback((cityStateCode: string): string => {
    const cityParts = cityStateCode.split("_");
    const cityName = cityParts.slice(0, -1).join(" ").toUpperCase();
    return cityName;
  }, []);

  // Extrair cidades disponíveis das compras
  const { availableCities, cityToCodeMap, defaultCityStateCode } = useMemo(() => {
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
      (purchase: IGetPurchasesResponseSuccess) => purchase.defaultCityStateCode
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
    async (filters: ILocalFilterState) => {
      if (!auth.store.token) return;

      const period = getLastThreeMonthsPeriod();
      const apiFilters = mapFiltersToApi(filters, cityToCodeMap, 1, 1, "price", "asc");

      try {
        // Buscar ranking de demanda
        setLoadingNeighborhoodRanking(true);
        const demandResponse = await postAnalyticsSearchDemandNeighborhoodRanking(
          {
            ...apiFilters,
            startDate: period.startDate,
            endDate: period.endDate,
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
          {
            ...apiFilters,
            startDate: period.startDate,
            endDate: period.endDate,
          },
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
            ...apiFilters,
            startDate: period.startDate,
            endDate: period.endDate,
            refAuthType: "PUBLIC",
          },
          auth.store.token
        );
        setHeatmapData(heatmapResponse.data.data || []);
      } catch (error) {
        console.error("Erro ao buscar heatmap de demanda:", error);
        setHeatmapData([]);
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
      // }
    },
    [auth.store.token, cityToCodeMap]
  );

  // Aplicar filtros
  const applyFilters = useCallback(
    async (filters: ILocalFilterState) => {
      setCurrentFilters(filters);
      await loadAnalyticsData(filters);

      // Buscar dados geoespaciais
      if (!filters.addressCoordinates) {
        await fetchCitiesData(filters);
        await fetchNeighborhoodsData(filters);
      }
    },
    [loadAnalyticsData]
  );

  // Buscar dados de cidades
  // Quando apenas cidades são selecionadas (sem bairros), usa o endpoint individual que retorna geo completo
  const fetchCitiesData = useCallback(
    async (filters: ILocalFilterState) => {
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

  // Buscar dados de bairros
  // Quando apenas cidade é selecionada (sem bairros específicos), busca todos os bairros para mostrar delimitação
  const fetchNeighborhoodsData = useCallback(
    async (filters: ILocalFilterState) => {
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

  // Ref para rastrear bairros anteriores e evitar buscas duplicadas
  const previousNeighborhoodsRef = useRef<string>("");

  // Efeito para buscar dados dos bairros imediatamente quando os bairros mudarem
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
      fetchNeighborhoodsData(currentFilters);
    }
  }, [currentFilters, fetchNeighborhoodsData]);

  // Efeito para centralizar o mapa quando há busca por endereço (prioridade máxima)
  useEffect(() => {
    if (currentFilters?.addressCoordinates && currentFilters?.addressZoom) {
      setMapCenter(currentFilters.addressCoordinates);
      setMapZoom(currentFilters.addressZoom);
      return;
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

  // Calcular centro e zoom do mapa (mesma lógica do SearchComponent)
  const calculateMapBounds = useCallback(
    (
      neighborhoods: INeighborhoodFull[],
      cities: ICityFull[]
    ): { center?: { lat: number; lng: number }; zoom?: number } => {
      const allCoordinates: Array<{ lat: number; lng: number }> = [];

      neighborhoods.forEach((neighborhood) => {
        if (!neighborhood.geo?.geometry) return;
        const geometry = neighborhood.geo.geometry;
        if (geometry.type === "Polygon") {
          const coords = geometry.coordinates as number[][][];
          coords[0]?.forEach((coord) => {
            allCoordinates.push({ lat: coord[1], lng: coord[0] });
          });
        } else if (geometry.type === "MultiPolygon") {
          const coords = geometry.coordinates as number[][][][];
          coords[0]?.[0]?.forEach((coord) => {
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
          const coords = geometry.coordinates as number[][][][];
          coords[0]?.[0]?.forEach((coord) => {
            allCoordinates.push({ lat: coord[1], lng: coord[0] });
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
        if (maxDiff > 0.4) zoom = 10;
        else if (maxDiff > 0.25) zoom = 11;
        else if (maxDiff > 0.15) zoom = 12;
        else if (maxDiff > 0.08) zoom = 12;
        else if (maxDiff > 0.04) zoom = 12;
        else zoom = 13;
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

  // Carregar dados iniciais
  useEffect(() => {
    if (location.state?.neighborhoodFilter && !currentFilters) {
      // Se veio de redirecionamento com filtro de bairro
      const initialFilters: ILocalFilterState = {
        search: "",
        cities: defaultCity ? [defaultCity] : [],
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
      applyFilters(initialFilters);
    } else if (!currentFilters && defaultCity) {
      // Carregar com cidade padrão
      const initialFilters: ILocalFilterState = {
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
      applyFilters(initialFilters);
    }
  }, [defaultCity, location.state, currentFilters, applyFilters]);

  // Handlers do mapa
  const handleDrawingComplete = useCallback(
    (overlay: google.maps.drawing.OverlayCompleteEvent) => {
      if (!currentFilters) return;

      const newGeometries = currentFilters.drawingGeometries || [];

      if (overlay.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = overlay.overlay as google.maps.Polygon;
        const geoJson = convertOverlayToGeoJSONPolygon(polygon);
        newGeometries.push(geoJson);
      } else if (overlay.type === google.maps.drawing.OverlayType.CIRCLE) {
        const circle = overlay.overlay as google.maps.Circle;
        const geoJson = convertOverlayToGeoJSONCircle(circle);
        newGeometries.push(geoJson);
      }

      applyFilters({
        ...currentFilters,
        drawingGeometries: newGeometries,
      });
    },
    [currentFilters, applyFilters]
  );

  const handleClearFilters = useCallback(() => {
    if (!defaultCity) return;
    const clearedFilters: ILocalFilterState = {
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
      drawingGeometries: [],
    };
    applyFilters(clearedFilters);
  }, [defaultCity, applyFilters]);

  const handleNeighborhoodClick = useCallback(
    (neighborhood: INeighborhoodFull) => {
      if (!currentFilters) return;

      const isSelected = currentFilters.neighborhoods.includes(neighborhood.name);
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
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Container maxWidth={false} sx={{ px: 0 }}>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            height: "calc(100vh - 130px)",
            minHeight: 600,
          }}
        >
          {/* Coluna Esquerda: Accordions */}
          <Box
            sx={{
              flex: 1.5,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
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

            {/* Accordions */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <RankingDemandAccordion
                data={neighborhoodRanking}
                loading={loadingNeighborhoodRanking}
                expanded={rankingExpanded}
                onChange={setRankingExpanded}
              />
              <SupplyByTypeAccordion
                data={supplyByType}
                loading={loadingSupplyByType}
                expanded={supplyExpanded}
                onChange={setSupplyExpanded}
              />
              {/* <AgencyRankingAccordion
                data={agencyRanking}
                neighborhoods={currentFilters?.neighborhoods || []}
                loading={loadingAgencyRanking}
                expanded={agencyExpanded}
                onChange={setAgencyExpanded}
              /> */}
            </Box>
          </Box>

          {/* Coluna Direita: Mapa */}
          {!isMobile && (
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "block",
              }}
            >
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
                useMapSearch={true}
                onNeighborhoodClick={handleNeighborhoodClick}
                heatmapData={heatmapData}
              />
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

