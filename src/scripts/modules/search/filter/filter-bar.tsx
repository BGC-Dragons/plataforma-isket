import { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  useTheme,
  Paper,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  CircularProgress,
  IconButton,
  Autocomplete,
  Typography,
} from "@mui/material";
import { Search, FilterList, Close } from "@mui/icons-material";
import { FilterModal } from "./filter-modal";
import { useAuth } from "../../access-manager/auth.hook";
import { useCitySelection } from "../../city-selection/city-selection.context";
import {
  postNeighborhoodsFindManyByCities,
  type INeighborhood,
} from "../../../../services/post-locations-neighborhoods-find-many-by-cities.service";

interface FilterState {
  search: string;
  cities: string[];
  neighborhoods: string[];
  // Coordenadas do endereço selecionado (quando há busca por endereço)
  addressCoordinates?: { lat: number; lng: number };
  addressZoom?: number;
  // Geometrias dos desenhos no mapa (quando há desenhos)
  drawingGeometries?: Array<
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "circle"; coordinates: [[number, number]]; radius: string }
  >;
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
  // Opcionais
  lancamento: boolean;
  palavras_chave: string;
}

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
  defaultCity?: string;
  availableCities?: string[];
  cityToCodeMap?: Record<string, string>;
  externalFilters?: FilterState; // Para sincronizar filtros aplicados externamente
}

export function FilterBar({
  onFiltersChange,
  defaultCity = "CURITIBA",
  availableCities = ["CURITIBA", "SÃO PAULO", "RIO DE JANEIRO"],
  cityToCodeMap = {},
  externalFilters,
}: FilterBarProps) {
  const theme = useTheme();
  const { store } = useAuth();
  const { cities: contextCities, setCities: setContextCities } = useCitySelection();

  // Estados dos filtros
  const [tempFilters, setTempFilters] = useState<FilterState>({
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
  });

  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(tempFilters);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<INeighborhood[]>([]);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [neighborhoodsLoaded, setNeighborhoodsLoaded] = useState(false);

  // Estados para controlar abertura dos selects
  const [isCitySelectOpen, setIsCitySelectOpen] = useState(false);
  const [isNeighborhoodSelectOpen, setIsNeighborhoodSelectOpen] =
    useState(false);

  // Estados para busca nos selects
  const [citySearchInput, setCitySearchInput] = useState("");
  const [neighborhoodSearchInput, setNeighborhoodSearchInput] = useState("");

  // Google Places Autocomplete
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [autocompleteOptions, setAutocompleteOptions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [searchInputValue, setSearchInputValue] = useState("");
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);

  // Função helper para normalizar strings (remover acentos, converter para minúsculas)
  const normalizeString = useCallback((str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }, []);

  // Função helper para filtrar opções baseado no texto de busca
  const filterOptions = useCallback(
    (options: string[], searchText: string): string[] => {
      if (!searchText) return options;
      const normalizedSearch = normalizeString(searchText);
      return options.filter((option) =>
        normalizeString(option).includes(normalizedSearch)
      );
    },
    [normalizeString]
  );

  // Função helper para filtrar bairros (objetos) baseado no texto de busca
  const filterNeighborhoodOptions = useCallback(
    (options: INeighborhood[], searchText: string): INeighborhood[] => {
      if (!searchText) return options;
      const normalizedSearch = normalizeString(searchText);
      return options.filter(
        (option) =>
          normalizeString(option.name).includes(normalizedSearch) ||
          normalizeString(option.city.name).includes(normalizedSearch)
      );
    },
    [normalizeString]
  );

  // Função para atualizar filtros
  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setTempFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Resetar bairros quando as cidades mudarem
  const handleCityChange = useCallback(
    (cities: string[]) => {
      // Atualizar contexto global
      setContextCities(cities);

      const updatedFilters = {
        ...tempFilters,
        cities,
        // Limpar bairros quando as cidades mudarem (serão recarregados)
        neighborhoods: [],
        // Preservar drawingGeometries e addressCoordinates
        drawingGeometries:
          tempFilters.drawingGeometries ||
          appliedFilters.drawingGeometries ||
          externalFilters?.drawingGeometries,
        addressCoordinates:
          tempFilters.addressCoordinates ||
          appliedFilters.addressCoordinates ||
          externalFilters?.addressCoordinates,
        addressZoom:
          tempFilters.addressZoom ||
          appliedFilters.addressZoom ||
          externalFilters?.addressZoom,
      };
      setTempFilters(updatedFilters);
      setNeighborhoods([]);
      setNeighborhoodsLoaded(false);

      // Fechar o select após seleção
      setIsCitySelectOpen(false);

      // Notificar mudança imediatamente para centralizar o mapa
      onFiltersChange(updatedFilters);
    },
    [tempFilters, appliedFilters, externalFilters, onFiltersChange, setContextCities]
  );

  // Função para limpar todas as cidades selecionadas
  const handleClearCities = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      // Limpar todas as cidades (deixar vazio para que o select fique disabled)
      handleCityChange([]);
    },
    [handleCityChange]
  );

  // Função para buscar bairros da API
  const loadNeighborhoods = useCallback(async () => {
    if (!store.token || tempFilters.cities.length === 0) {
      return;
    }

    // Obter códigos das cidades selecionadas
    const cityStateCodes = tempFilters.cities
      .map((city) => cityToCodeMap[city])
      .filter((code): code is string => Boolean(code));

    if (cityStateCodes.length === 0) {
      setNeighborhoods([]);
      return;
    }

    setIsLoadingNeighborhoods(true);
    try {
      const response = await postNeighborhoodsFindManyByCities(
        { cityStateCodes },
        store.token
      );

      // Remover duplicatas baseado no nome do bairro e ordenar
      const neighborhoodMap = new Map<string, INeighborhood>();
      response.data.forEach((neighborhood: INeighborhood) => {
        if (!neighborhoodMap.has(neighborhood.name)) {
          neighborhoodMap.set(neighborhood.name, neighborhood);
        }
      });

      const uniqueNeighborhoods = Array.from(neighborhoodMap.values()).sort(
        (a, b) => a.name.localeCompare(b.name, "pt-BR")
      );

      setNeighborhoods(uniqueNeighborhoods);
      setNeighborhoodsLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar bairros:", error);
      setNeighborhoods([]);
    } finally {
      setIsLoadingNeighborhoods(false);
    }
  }, [store.token, tempFilters.cities, cityToCodeMap]);

  // Função para lidar com abertura do select de bairros
  const handleNeighborhoodSelectOpen = useCallback(() => {
    if (!neighborhoodsLoaded && !isLoadingNeighborhoods) {
      loadNeighborhoods();
    }
  }, [neighborhoodsLoaded, isLoadingNeighborhoods, loadNeighborhoods]);

  // Função para aplicar filtros do modal
  const handleApplyFilters = useCallback(
    (filters: FilterState) => {
      // Preservar a cidade atual se não estiver nos filtros aplicados
      const currentCity =
        tempFilters.cities.length > 0
          ? tempFilters.cities
          : appliedFilters.cities.length > 0
          ? appliedFilters.cities
          : [defaultCity];

      // Preservar drawingGeometries e addressCoordinates dos filtros externos ou aplicados
      const preservedDrawingGeometries =
        filters.drawingGeometries ||
        externalFilters?.drawingGeometries ||
        appliedFilters.drawingGeometries;
      const preservedAddressCoordinates =
        filters.addressCoordinates ||
        externalFilters?.addressCoordinates ||
        appliedFilters.addressCoordinates;
      const preservedAddressZoom =
        filters.addressZoom ||
        externalFilters?.addressZoom ||
        appliedFilters.addressZoom;

      const filtersWithCity = {
        ...filters,
        cities: filters.cities.length > 0 ? filters.cities : currentCity,
        // Preservar drawingGeometries e addressCoordinates
        drawingGeometries: preservedDrawingGeometries,
        addressCoordinates: preservedAddressCoordinates,
        addressZoom: preservedAddressZoom,
      };
      setAppliedFilters(filtersWithCity);
      setTempFilters(filtersWithCity);
      onFiltersChange(filtersWithCity);
    },
    [
      onFiltersChange,
      tempFilters.cities,
      appliedFilters,
      externalFilters,
      defaultCity,
    ]
  );

  // Função para pesquisar
  const handleSearch = useCallback(() => {
    // Preservar drawingGeometries e addressCoordinates dos filtros aplicados ou externos
    const filtersWithPreserved = {
      ...tempFilters,
      drawingGeometries:
        tempFilters.drawingGeometries ||
        appliedFilters.drawingGeometries ||
        externalFilters?.drawingGeometries,
      addressCoordinates:
        tempFilters.addressCoordinates ||
        appliedFilters.addressCoordinates ||
        externalFilters?.addressCoordinates,
      addressZoom:
        tempFilters.addressZoom ||
        appliedFilters.addressZoom ||
        externalFilters?.addressZoom,
    };
    setAppliedFilters(filtersWithPreserved);
    onFiltersChange(filtersWithPreserved);
  }, [tempFilters, appliedFilters, externalFilters, onFiltersChange]);

  // Ref para rastrear se houve mudança local recente (para evitar sobrescrita pelo externalFilters)
  const hasLocalChangeRef = useRef(false);
  const lastLocalChangeRef = useRef<string>("");

  // Função para lidar com mudança de bairros
  const handleNeighborhoodChange = useCallback(
    (neighborhoods: string[]) => {
      console.log("handleNeighborhoodChange chamado com:", neighborhoods);
      const updatedFilters = {
        ...tempFilters,
        neighborhoods,
        // Preservar drawingGeometries e addressCoordinates
        drawingGeometries:
          tempFilters.drawingGeometries ||
          appliedFilters.drawingGeometries ||
          externalFilters?.drawingGeometries,
        addressCoordinates:
          tempFilters.addressCoordinates ||
          appliedFilters.addressCoordinates ||
          externalFilters?.addressCoordinates,
        addressZoom:
          tempFilters.addressZoom ||
          appliedFilters.addressZoom ||
          externalFilters?.addressZoom,
      };

      // Criar chave única para esta mudança local
      const changeKey = JSON.stringify({
        neighborhoods: [...neighborhoods].sort().join(","),
        timestamp: Date.now(),
      });
      lastLocalChangeRef.current = changeKey;

      // Marcar que houve mudança local
      hasLocalChangeRef.current = true;

      setTempFilters(updatedFilters);

      // Manter filtros aplicados sincronizados com a seleção de bairros
      setAppliedFilters(updatedFilters);

      // Fechar o select após seleção
      setIsNeighborhoodSelectOpen(false);

      // Aplicar filtros automaticamente quando um bairro for selecionado para centralizar o mapa
      console.log("Chamando onFiltersChange com:", updatedFilters);
      onFiltersChange(updatedFilters);

      // Resetar flag após um delay maior para garantir que externalFilters seja atualizado primeiro
      setTimeout(() => {
        hasLocalChangeRef.current = false;
      }, 500);
    },
    [tempFilters, appliedFilters, externalFilters, onFiltersChange]
  );

  // Função para limpar todos os bairros selecionados
  const handleClearNeighborhoods = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      handleNeighborhoodChange([]);
    },
    [handleNeighborhoodChange]
  );

  // Carregar Google Maps API para autocomplete de endereços
  // NOTA: Não carregamos o Places aqui porque já é carregado pelo MapComponent
  // via useLoadScript. Apenas aguardamos que ele esteja disponível.
  useEffect(() => {
    // Função para inicializar os serviços do Places de forma segura
    const initializePlacesServices = () => {
      try {
        if (typeof window === "undefined") return false;

        // Verificar se google está disponível
        if (!window.google) return false;
        if (!window.google.maps) return false;
        if (!window.google.maps.places) return false;

        // Verificar se os construtores estão disponíveis e são funções
        const AutocompleteService =
          window.google.maps.places.AutocompleteService;
        const PlacesService = window.google.maps.places.PlacesService;

        if (
          typeof AutocompleteService !== "undefined" &&
          typeof PlacesService !== "undefined" &&
          typeof AutocompleteService === "function" &&
          typeof PlacesService === "function"
        ) {
          // Só criar se ainda não foram criados
          if (!autocompleteService.current) {
            autocompleteService.current = new AutocompleteService();
          }
          if (!placesService.current) {
            placesService.current = new PlacesService(
              document.createElement("div")
            );
          }
          setIsGoogleLoaded(true);
          return true;
        }
      } catch (error) {
        console.error("Erro ao inicializar Places Services:", error);
        // Não definir como carregado se houver erro
        return false;
      }
      return false;
    };

    // Verificar se já está carregado
    if (initializePlacesServices()) {
      return;
    }

    // Verificar se já existe um script do Google Maps (carregado pelo useLoadScript)
    // Se existir, apenas aguardar que Places esteja pronto
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );

    if (existingScript) {
      // Script já existe (carregado pelo MapComponent), aguardar que Places esteja pronto
      let intervalId: ReturnType<typeof setInterval> | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let attempts = 0;
      const maxAttempts = 100; // 10 segundos (100 * 100ms)

      intervalId = setInterval(() => {
        attempts++;
        if (initializePlacesServices()) {
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
        } else if (attempts >= maxAttempts) {
          // Parar após max tentativas
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
          console.warn("Timeout ao aguardar Google Maps Places API");
        }
      }, 100);

      // Timeout de segurança
      timeoutId = setTimeout(() => {
        if (intervalId) clearInterval(intervalId);
      }, 12000);

      return () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    } else {
      // Se não existe script, aguardar um pouco e tentar novamente
      // (pode ser que o script ainda não tenha sido adicionado ao DOM)
      const checkInterval = setInterval(() => {
        const script = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (script) {
          clearInterval(checkInterval);
          // Recursivamente chamar o useEffect aguardando o script
          // Mas isso pode causar loops, então vamos usar polling direto
          let attempts = 0;
          const maxAttempts = 100;
          const pollInterval = setInterval(() => {
            attempts++;
            if (initializePlacesServices()) {
              clearInterval(pollInterval);
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              console.warn("Timeout ao aguardar Google Maps Places API");
            }
          }, 100);
        }
      }, 200);

      // Timeout para parar de verificar
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 5000);

      return () => {
        clearInterval(checkInterval);
      };
    }
  }, []);

  // Buscar endereços quando o usuário digita
  const searchAddresses = useCallback(
    (query: string) => {
      if (!isGoogleLoaded || !autocompleteService.current || query.length < 3) {
        setAutocompleteOptions([]);
        return;
      }

      try {
        const request: google.maps.places.AutocompletionRequest = {
          input: query,
          types: ["address"],
          componentRestrictions: { country: "br" },
          language: "pt-BR",
        };

        autocompleteService.current.getPlacePredictions(
          request,
          (
            predictions: google.maps.places.AutocompletePrediction[] | null,
            status: google.maps.places.PlacesServiceStatus
          ) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setAutocompleteOptions(predictions);
            } else {
              setAutocompleteOptions([]);
            }
          }
        );
      } catch (error) {
        console.error("Erro ao buscar endereços:", error);
        setAutocompleteOptions([]);
      }
    },
    [isGoogleLoaded]
  );

  // Debounce para busca de endereços
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInputValue.length >= 3 && isGoogleLoaded) {
        searchAddresses(searchInputValue);
      } else {
        setAutocompleteOptions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInputValue, isGoogleLoaded, searchAddresses]);

  // Estado para armazenar o bairro extraído do autocomplete enquanto carrega
  const pendingNeighborhoodRef = useRef<string | null>(null);

  // Função para extrair cidade e bairro do resultado do Places API
  const extractCityAndNeighborhood = useCallback(
    (placeId: string, fallbackDescription?: string) => {
      if (!isGoogleLoaded || !placesService.current) {
        console.warn("Places Service não está disponível");
        return;
      }

      try {
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId,
          fields: ["address_components", "formatted_address", "geometry"],
        };

        placesService.current.getDetails(request, (place, status) => {
          try {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              place &&
              place.address_components
            ) {
              let cityName = "";
              let neighborhoodName = "";

              // Extrair cidade e bairro dos address_components
              place.address_components.forEach((component) => {
                const types = component.types;

                // Cidade (locality ou administrative_area_level_2)
                if (
                  !cityName &&
                  (types.includes("locality") ||
                    types.includes("administrative_area_level_2"))
                ) {
                  cityName = component.long_name.toUpperCase();
                }

                // Bairro (sublocality, sublocality_level_1 ou neighborhood)
                if (
                  !neighborhoodName &&
                  (types.includes("sublocality") ||
                    types.includes("sublocality_level_1") ||
                    types.includes("neighborhood"))
                ) {
                  neighborhoodName = component.long_name;
                }
              });

              // IMPORTANTE: Atualizar o campo de busca com o endereço completo formatado
              // Isso garante que o payload tenha o endereço completo, não apenas as palavras digitadas
              let coordinatesToStore: { lat: number; lng: number } | undefined;
              let zoomToStore: number | undefined;
              let formattedAddressToUse: string | undefined;

              if (place.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                coordinatesToStore = { lat, lng };
                // Zoom padrão para busca por endereço (14 conforme exemplo do payload esperado)
                zoomToStore = 14;
              }

              if (place.formatted_address) {
                formattedAddressToUse = place.formatted_address;
                setSearchInputValue(formattedAddressToUse);
              } else if (fallbackDescription) {
                // Fallback: se não houver formatted_address, usar o description do autocomplete
                formattedAddressToUse = fallbackDescription;
                setSearchInputValue(formattedAddressToUse);
              }

              // Quando há busca por endereço, NÃO setar cidade automaticamente
              // Apenas atualizar o campo de busca com coordenadas
              // O mapa centralizará no endereço, não na cidade
              if (formattedAddressToUse) {
                const updatedFilters: FilterState = {
                  ...tempFilters,
                  search: formattedAddressToUse,
                  // NÃO incluir cities aqui - deixar vazio para busca por endereço
                  // Se o usuário quiser filtrar por cidade, ele pode selecionar manualmente
                  addressCoordinates: coordinatesToStore,
                  addressZoom: zoomToStore,
                  // Preservar drawingGeometries
                  drawingGeometries:
                    tempFilters.drawingGeometries ||
                    appliedFilters.drawingGeometries ||
                    externalFilters?.drawingGeometries,
                };
                setTempFilters(updatedFilters);
                onFiltersChange(updatedFilters);
              }

              // Limpar bairro pendente já que não estamos setando cidade automaticamente
              pendingNeighborhoodRef.current = null;
            }
          } catch (error) {
            console.error("Erro ao processar detalhes do lugar:", error);
          }
        });
      } catch (error) {
        console.error("Erro ao buscar detalhes do lugar:", error);
      }
    },
    [
      isGoogleLoaded,
      tempFilters,
      appliedFilters,
      externalFilters,
      onFiltersChange,
    ]
  );

  // Quando os bairros forem carregados, tentar selecionar o bairro pendente
  useEffect(() => {
    if (
      neighborhoodsLoaded &&
      neighborhoods.length > 0 &&
      pendingNeighborhoodRef.current
    ) {
      const pendingNeighborhood = pendingNeighborhoodRef.current;
      pendingNeighborhoodRef.current = null;

      // Normalizar o bairro pendente para busca
      const normalizedPending = pendingNeighborhood
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // Procurar o bairro na lista
      const foundNeighborhood = neighborhoods.find((n) => {
        const normalized = n.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        return normalized === normalizedPending;
      });

      // Atualizar filtros com cidade e bairro (se encontrado)
      setTempFilters((prev) => ({
        ...prev,
        neighborhoods: foundNeighborhood ? [foundNeighborhood.name] : [],
      }));
    }
  }, [neighborhoodsLoaded, neighborhoods]);

  // Função para lidar com seleção de endereço no autocomplete
  const handleAddressSelect = useCallback(
    (
      _: React.SyntheticEvent,
      value: google.maps.places.AutocompletePrediction | string | null
    ) => {
      if (value && typeof value !== "string" && value.place_id) {
        // Definir o description temporariamente para melhor UX
        // O extractCityAndNeighborhood vai atualizar com o formatted_address completo depois
        setSearchInputValue(value.description);
        // Passar o description como fallback caso não haja formatted_address
        extractCityAndNeighborhood(value.place_id, value.description);
      } else if (typeof value === "string") {
        setSearchInputValue(value);
        // Limpar coordenadas quando o usuário digita uma string (não seleciona do autocomplete)
        handleFilterChange({
          search: value,
          addressCoordinates: undefined,
          addressZoom: undefined,
        });
      }
    },
    [handleFilterChange, extractCityAndNeighborhood]
  );

  // Sincronizar searchInputValue com tempFilters.search quando mudar externamente (apenas se não for mudança manual)
  useEffect(() => {
    // Só atualizar se o usuário não estiver digitando
    if (
      tempFilters.search !== searchInputValue &&
      !autocompleteInputRef.current?.matches(":focus")
    ) {
      setSearchInputValue(tempFilters.search);
    }
  }, [tempFilters.search, searchInputValue]);

  // Ref para rastrear última sincronização e evitar loops
  const lastSyncRef = useRef<string>("");
  const hasInitializedFromContextRef = useRef(false);

  // Inicializar com cidades do contexto quando o componente montar (apenas uma vez)
  useEffect(() => {
    // Só inicializar se ainda não foi inicializado e não houver externalFilters definindo cidades
    if (hasInitializedFromContextRef.current) return;
    if (externalFilters && externalFilters.cities.length > 0) {
      hasInitializedFromContextRef.current = true;
      return;
    }

    // Se há cidades no contexto e estão disponíveis, usar elas
    if (contextCities.length > 0) {
      // Validar que todas as cidades do contexto estão disponíveis
      const validCities = contextCities.filter((city) =>
        availableCities.includes(city)
      );

      if (validCities.length > 0) {
        hasInitializedFromContextRef.current = true;
        const initialFilters = {
          ...tempFilters,
          cities: validCities,
        };
        setTempFilters(initialFilters);
        setAppliedFilters(initialFilters);
        // Se as cidades do contexto não estão todas disponíveis, atualizar contexto
        if (validCities.length !== contextCities.length) {
          setContextCities(validCities);
        }
      } else {
        // Se nenhuma cidade do contexto é válida, limpar contexto
        setContextCities([]);
        hasInitializedFromContextRef.current = true;
      }
    } else {
      hasInitializedFromContextRef.current = true;
    }
  }, [contextCities, availableCities, externalFilters, tempFilters, setContextCities]);

  // Sincronizar filtros quando externalFilters mudar (ex: quando limpa todos os filtros)
  useEffect(() => {
    if (!externalFilters) return;

    // Não sincronizar se houve mudança local recente (para evitar sobrescrever mudanças do usuário)
    if (hasLocalChangeRef.current) {
      console.log(
        "Ignorando sincronização com externalFilters - mudança local recente"
      );
      return;
    }

    // Criar uma chave única baseada nos filtros externos
    const externalKey = JSON.stringify({
      search: externalFilters.search,
      cities: [...externalFilters.cities].sort().join(","),
      neighborhoods: [...externalFilters.neighborhoods].sort().join(","),
      venda: externalFilters.venda,
      aluguel: externalFilters.aluguel,
      residencial: externalFilters.residencial,
      comercial: externalFilters.comercial,
      industrial: externalFilters.industrial,
      agricultura: externalFilters.agricultura,
      quartos: externalFilters.quartos,
      banheiros: externalFilters.banheiros,
      suites: externalFilters.suites,
      garagem: externalFilters.garagem,
      area_min: externalFilters.area_min,
      area_max: externalFilters.area_max,
      preco_min: externalFilters.preco_min,
      preco_max: externalFilters.preco_max,
      lancamento: externalFilters.lancamento,
      palavras_chave: externalFilters.palavras_chave,
    });

    // Só sincronizar se realmente mudou E se não foi uma mudança que nós mesmos causamos
    if (lastSyncRef.current !== externalKey) {
      console.log("Sincronizando com externalFilters:", externalFilters);
      lastSyncRef.current = externalKey;
      setTempFilters(externalFilters);
      setAppliedFilters(externalFilters);
      setSearchInputValue(externalFilters.search);
      // Sincronizar cidades com contexto quando externalFilters mudar
      if (externalFilters.cities.length > 0) {
        setContextCities(externalFilters.cities);
      } else {
        setContextCities([]);
      }
      // Limpar bairros se não houver cidades
      if (externalFilters.cities.length === 0) {
        setNeighborhoods([]);
        setNeighborhoodsLoaded(false);
      }
    }
  }, [externalFilters, setContextCities]);

  // Função para limpar busca de endereço
  const handleClearAddressSearch = useCallback(() => {
    setSearchInputValue("");
    setAutocompleteOptions([]);
    handleFilterChange({
      search: "",
      addressCoordinates: undefined,
      addressZoom: undefined,
    });
    // Aplicar filtros sem o endereço, mas preservar drawingGeometries
    const updatedFilters: FilterState = {
      ...tempFilters,
      search: "",
      addressCoordinates: undefined,
      addressZoom: undefined,
      // Preservar drawingGeometries
      drawingGeometries:
        tempFilters.drawingGeometries ||
        appliedFilters.drawingGeometries ||
        externalFilters?.drawingGeometries,
    };
    setTempFilters(updatedFilters);
    setAppliedFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  }, [
    tempFilters,
    appliedFilters,
    externalFilters,
    handleFilterChange,
    onFiltersChange,
  ]);

  // Função para limpar todos os filtros
  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      search: "",
      cities: [],
      neighborhoods: [],
      addressCoordinates: undefined,
      addressZoom: undefined,
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
      // Opcionais
      lancamento: false,
      palavras_chave: "",
    };
    // Limpar também o campo de busca visual
    setSearchInputValue("");
    // Limpar bairros carregados
    setNeighborhoods([]);
    setNeighborhoodsLoaded(false);
    // Limpar opções do autocomplete
    setAutocompleteOptions([]);
    // Atualizar estados
    setTempFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    // Aplicar filtros limpos (isso vai disparar a busca com filtros vazios)
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

  // Contar filtros ativos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.cities.length > 1) count++;
    if (appliedFilters.neighborhoods.length > 0) count++;

    // Negócio
    if (appliedFilters.venda || appliedFilters.aluguel) count++;

    // Finalidade
    if (
      appliedFilters.residencial ||
      appliedFilters.comercial ||
      appliedFilters.industrial ||
      appliedFilters.agricultura
    )
      count++;

    // Tipo do Imóvel
    const propertyTypes = [
      appliedFilters.apartamento_padrao,
      appliedFilters.apartamento_flat,
      appliedFilters.apartamento_loft,
      appliedFilters.apartamento_studio,
      appliedFilters.apartamento_duplex,
      appliedFilters.apartamento_triplex,
      appliedFilters.apartamento_cobertura,
      appliedFilters.comercial_sala,
      appliedFilters.comercial_casa,
      appliedFilters.comercial_ponto,
      appliedFilters.comercial_galpao,
      appliedFilters.comercial_loja,
      appliedFilters.comercial_predio,
      appliedFilters.comercial_clinica,
      appliedFilters.comercial_coworking,
      appliedFilters.comercial_sobreloja,
      appliedFilters.casa_casa,
      appliedFilters.casa_sobrado,
      appliedFilters.casa_sitio,
      appliedFilters.casa_chale,
      appliedFilters.casa_chacara,
      appliedFilters.casa_edicula,
      appliedFilters.terreno_terreno,
      appliedFilters.terreno_fazenda,
      appliedFilters.outros_garagem,
      appliedFilters.outros_quarto,
      appliedFilters.outros_resort,
      appliedFilters.outros_republica,
      appliedFilters.outros_box,
      appliedFilters.outros_tombado,
      appliedFilters.outros_granja,
      appliedFilters.outros_haras,
      appliedFilters.outros_outros,
    ];
    if (propertyTypes.some(Boolean)) count++;

    // Cômodos
    if (
      appliedFilters.quartos !== null ||
      appliedFilters.banheiros !== null ||
      appliedFilters.suites !== null ||
      appliedFilters.garagem !== null
    )
      count++;

    // Sliders
    if (appliedFilters.area_min > 0 || appliedFilters.area_max < 1000000)
      count++;
    if (appliedFilters.preco_min > 0 || appliedFilters.preco_max < 100000000)
      count++;

    // Tipo de Anunciante
    if (
      appliedFilters.proprietario_direto ||
      appliedFilters.imobiliaria ||
      appliedFilters.portal
    )
      count++;

    // Opcionais
    if (appliedFilters.lancamento) count++;
    if (appliedFilters.palavras_chave) count++;

    return count;
  };

  return (
    <>
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          boxShadow: theme.shadows[8],
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          "@media (max-width: 750px)": {
            flexDirection: "column",
            alignItems: "stretch",
            p: 1.25,
            gap: 1,
          },
        }}
      >
        {/* Campo de Busca com Autocomplete do Google Places */}
        <Autocomplete
          freeSolo
          options={autocompleteOptions}
          value={tempFilters.search}
          inputValue={searchInputValue}
          onInputChange={(_, newValue) => {
            setSearchInputValue(newValue);
            // Limpar coordenadas quando o usuário digita manualmente (não seleciona do autocomplete)
            handleFilterChange({
              search: newValue,
              addressCoordinates: undefined,
              addressZoom: undefined,
            });
          }}
          onChange={handleAddressSelect}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.description;
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof value === "string") {
              return option.description === value;
            }
            return option.place_id === value.place_id;
          }}
          filterOptions={(x) => x}
          disabled={!isGoogleLoaded}
          loading={!isGoogleLoaded}
          sx={{
            flexGrow: 1,
            maxWidth: { xs: "100%", sm: 300, md: 350 },
            "@media (max-width: 750px)": {
              maxWidth: "100%",
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Buscar por endereço"
              size="small"
              inputRef={autocompleteInputRef}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                endAdornment:
                  tempFilters.search || tempFilters.addressCoordinates ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleClearAddressSearch}
                        sx={{
                          p: 0.5,
                          color: theme.palette.text.secondary,
                          "&:hover": {
                            color: theme.palette.error.main,
                            backgroundColor: theme.palette.error.light,
                          },
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              sx={{
                "@media (max-width: 750px)": {
                  "& .MuiInputBase-root": {
                    height: 36,
                    fontSize: "0.875rem",
                  },
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.place_id}>
              <Box
                sx={{ display: "flex", flexDirection: "column", width: "100%" }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {option.structured_formatting.main_text}
                </Typography>
                {option.structured_formatting.secondary_text && (
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    {option.structured_formatting.secondary_text}
                  </Typography>
                )}
              </Box>
            </li>
          )}
        />

        {/* Seletor de Cidade */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            "@media (max-width: 750px)": {
              width: "100%",
              justifyContent: "space-between",
            },
          }}
        >
          <Select
            multiple
            value={tempFilters.cities}
            onChange={(e) =>
              handleCityChange(
                typeof e.target.value === "string"
                  ? [e.target.value]
                  : e.target.value
              )
            }
            open={isCitySelectOpen}
            onOpen={() => setIsCitySelectOpen(true)}
            onClose={() => {
              setIsCitySelectOpen(false);
              setCitySearchInput("");
            }}
            displayEmpty
            size="small"
            renderValue={(selected) => {
              const selectedArray = selected as string[];
              // Mostrar botão de limpar se houver cidades selecionadas
              const showClearButton = selectedArray.length > 0;

              if (selectedArray.length === 0) {
                return <em>Selecione cidades</em>;
              }

              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    width: "100%",
                    position: "relative",
                  }}
                  onMouseDown={(e) => {
                    // Prevenir que o select abra quando clicar no botão de limpar
                    const target = e.target as HTMLElement;
                    if (target.closest("button")) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {selectedArray.length <= 2 ? (
                      selectedArray.map((city) => (
                        <Chip key={city} label={city} size="small" />
                      ))
                    ) : (
                      <>
                        {selectedArray.slice(0, 2).map((city) => (
                          <Chip key={city} label={city} size="small" />
                        ))}
                        <Chip
                          label={`+${selectedArray.length - 2}`}
                          size="small"
                        />
                      </>
                    )}
                  </Box>
                  {showClearButton && (
                    <IconButton
                      size="small"
                      onClick={handleClearCities}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      sx={{
                        flexShrink: 0,
                        p: 0.25,
                        color: theme.palette.text.secondary,
                        pointerEvents: "auto",
                        "&:hover": {
                          color: theme.palette.error.main,
                          backgroundColor: theme.palette.error.light,
                        },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            }}
            sx={{
              minWidth: 150,
              borderRadius: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
              "@media (max-width: 750px)": {
                flex: 1,
                minWidth: "auto",
                "& .MuiSelect-select": {
                  py: 0.5,
                },
                "& .MuiInputBase-root": {
                  height: 36,
                  fontSize: "0.875rem",
                },
              },
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                },
                sx: {
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
                },
              },
              MenuListProps: {
                style: {
                  padding: 0,
                },
              },
            }}
          >
            {/* Input de busca dentro do menu */}
            <Box
              sx={{
                p: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: "sticky",
                top: 0,
                backgroundColor: theme.palette.background.paper,
                zIndex: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Procure pela cidade..."
                value={citySearchInput}
                onChange={(e) => {
                  e.stopPropagation();
                  setCitySearchInput(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme.palette.divider,
                    },
                  },
                }}
              />
            </Box>
            {filterOptions(availableCities, citySearchInput).map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
            {filterOptions(availableCities, citySearchInput).length === 0 && (
              <MenuItem disabled>
                <em>Nenhuma cidade encontrada</em>
              </MenuItem>
            )}
          </Select>

          {/* Seletor de Bairros */}
          <Select
            multiple
            value={tempFilters.neighborhoods}
            onChange={(e) => {
              console.log(
                "Select onChange disparado:",
                e.target.value,
                "Tipo:",
                typeof e.target.value
              );
              const value =
                typeof e.target.value === "string"
                  ? [e.target.value]
                  : (e.target.value as string[]);
              console.log("Valor processado:", value);
              if (Array.isArray(value)) {
                handleNeighborhoodChange(value);
              }
            }}
            open={isNeighborhoodSelectOpen}
            onOpen={() => {
              setIsNeighborhoodSelectOpen(true);
              handleNeighborhoodSelectOpen();
            }}
            onClose={() => {
              setIsNeighborhoodSelectOpen(false);
              setNeighborhoodSearchInput("");
            }}
            displayEmpty
            size="small"
            disabled={tempFilters.cities.length === 0 || isLoadingNeighborhoods}
            onClick={() => {
              console.log(
                "Select clicado. Cidades:",
                tempFilters.cities.length,
                "Loading:",
                isLoadingNeighborhoods
              );
            }}
            renderValue={(selected) => {
              const selectedArray = selected as string[];
              const showClearButton = selectedArray.length > 0;
              const hasMultipleCities = tempFilters.cities.length > 1;

              if (selectedArray.length === 0) {
                return <em>Todos os bairros</em>;
              }

              // Função helper para obter o label do bairro (com cidade se necessário)
              const getNeighborhoodLabel = (neighborhoodName: string) => {
                if (!hasMultipleCities) {
                  return neighborhoodName;
                }
                // Buscar o objeto do bairro para obter a cidade
                const neighborhoodObj = neighborhoods.find(
                  (n) => n.name === neighborhoodName
                );
                if (neighborhoodObj) {
                  return `${neighborhoodObj.name} - ${neighborhoodObj.city.name}`;
                }
                return neighborhoodName;
              };

              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    width: "100%",
                    position: "relative",
                  }}
                  onMouseDown={(e) => {
                    // Prevenir que o select abra quando clicar no botão de limpar
                    const target = e.target as HTMLElement;
                    if (target.closest("button")) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.5,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {selectedArray.length <= 2 ? (
                      selectedArray.map((neighborhood) => (
                        <Chip
                          key={neighborhood}
                          label={getNeighborhoodLabel(neighborhood)}
                          size="small"
                        />
                      ))
                    ) : (
                      <>
                        {selectedArray.slice(0, 2).map((neighborhood) => (
                          <Chip
                            key={neighborhood}
                            label={getNeighborhoodLabel(neighborhood)}
                            size="small"
                          />
                        ))}
                        <Chip
                          label={`+${selectedArray.length - 2}`}
                          size="small"
                        />
                      </>
                    )}
                  </Box>
                  {showClearButton && (
                    <IconButton
                      size="small"
                      onClick={handleClearNeighborhoods}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      sx={{
                        flexShrink: 0,
                        p: 0.25,
                        color: theme.palette.text.secondary,
                        pointerEvents: "auto",
                        "&:hover": {
                          color: theme.palette.error.main,
                          backgroundColor: theme.palette.error.light,
                        },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            }}
            sx={{
              minWidth: 150,
              borderRadius: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
              "@media (max-width: 750px)": {
                flex: 1,
                minWidth: "auto",
                "& .MuiSelect-select": {
                  py: 0.5,
                },
                "& .MuiInputBase-root": {
                  height: 36,
                  fontSize: "0.875rem",
                },
              },
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                },
                sx: {
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
                },
              },
              MenuListProps: {
                style: {
                  padding: 0,
                },
              },
            }}
          >
            {/* Input de busca dentro do menu */}
            <Box
              sx={{
                p: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
                position: "sticky",
                top: 0,
                backgroundColor: theme.palette.background.paper,
                zIndex: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Procure pelo bairro..."
                value={neighborhoodSearchInput}
                onChange={(e) => {
                  e.stopPropagation();
                  setNeighborhoodSearchInput(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: isLoadingNeighborhoods ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} />
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme.palette.divider,
                    },
                  },
                }}
              />
            </Box>
            {isLoadingNeighborhoods ? (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Carregando...
              </MenuItem>
            ) : (
              <>
                {filterNeighborhoodOptions(neighborhoods, neighborhoodSearchInput).map(
                  (neighborhood) => {
                    const isSelected =
                      tempFilters.neighborhoods.includes(neighborhood.name);
                    return (
                      <MenuItem
                        key={`${neighborhood.name}-${neighborhood.city.name}`}
                        value={neighborhood.name}
                        selected={isSelected}
                        onClick={() => {
                          console.log(
                            "MenuItem onClick disparado:",
                            neighborhood
                          );
                          // Obter o valor atual
                          const currentNeighborhoods =
                            tempFilters.neighborhoods || [];
                          // Toggle: se já está selecionado, remove; se não, adiciona
                          const newNeighborhoods = isSelected
                            ? currentNeighborhoods.filter(
                                (n) => n !== neighborhood.name
                              )
                            : [...currentNeighborhoods, neighborhood.name];

                          console.log(
                            "Atualizando bairros de",
                            currentNeighborhoods,
                            "para",
                            newNeighborhoods
                          );

                          // Chamar handleNeighborhoodChange diretamente
                          handleNeighborhoodChange(newNeighborhoods);

                          // Não usar stopPropagation para permitir que o Select também processe
                          // Mas o handleNeighborhoodChange já vai atualizar o estado
                        }}
                      >
                        {neighborhood.name} - {neighborhood.city.name}
                      </MenuItem>
                    );
                  }
                )}
                {filterNeighborhoodOptions(neighborhoods, neighborhoodSearchInput)
                  .length === 0 && (
                  <MenuItem disabled>
                    <em>Nenhum bairro encontrado</em>
                  </MenuItem>
                )}
              </>
            )}
          </Select>
        </Box>

        {/* Container dos Botões - Mobile */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            "@media (max-width: 750px)": {
              width: "100%",
              justifyContent: "space-between",
              mt: 1,
            },
            "@media (min-width: 751px)": {
              display: "none",
            },
          }}
        >
          {/* Botão de Filtros */}
          <Button
            onClick={() => setIsFilterModalOpen(true)}
            variant="contained"
            startIcon={<FilterList />}
            sx={{
              borderRadius: 2,
              px: 2,
              py: 0.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              backgroundColor: theme.palette.primary.main,
              flex: 1,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Filtros{" "}
            {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Button>

          {/* Botão de Limpar Filtros */}
          <Button
            onClick={clearAllFilters}
            variant="contained"
            startIcon={<Close />}
            sx={{
              borderRadius: 2,
              px: 2,
              py: 0.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              backgroundColor: theme.palette.primary.main,
              color: "white",
              flex: 1,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Limpar Filtros
          </Button>
        </Box>

        {/* Container dos Botões - Desktop */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            "@media (max-width: 750px)": {
              display: "none",
            },
          }}
        >
          {/* Botão de Filtros */}
          <Button
            onClick={() => setIsFilterModalOpen(true)}
            variant="contained"
            startIcon={<FilterList />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Filtros{" "}
            {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Button>

          {/* Botão de Limpar Filtros */}
          <Button
            onClick={clearAllFilters}
            variant="contained"
            startIcon={<Close />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: theme.palette.primary.main,
              color: "white",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Limpar Filtros
          </Button>
        </Box>
      </Paper>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={clearAllFilters}
        initialFilters={appliedFilters}
      />
    </>
  );
}
