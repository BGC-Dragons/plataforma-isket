import { useState, useCallback } from "react";
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
} from "@mui/material";
import { Search, FilterList, Close } from "@mui/icons-material";
import { FilterModal } from "./filter-modal";
import { useAuth } from "../../access-manager/auth.hook";
import {
  postNeighborhoodsFindManyByCities,
  type INeighborhood,
} from "../../../../services/post-locations-neighborhoods-find-many-by-cities.service";

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
  // Opcionais
  lancamento: boolean;
  palavras_chave: string;
}

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
  defaultCity?: string;
  availableCities?: string[];
  cityToCodeMap?: Record<string, string>;
}

export function FilterBar({
  onFiltersChange,
  defaultCity = "CURITIBA",
  availableCities = ["CURITIBA", "SÃO PAULO", "RIO DE JANEIRO"],
  cityToCodeMap = {},
}: FilterBarProps) {
  const theme = useTheme();
  const { store } = useAuth();

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
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [neighborhoodsLoaded, setNeighborhoodsLoaded] = useState(false);

  // Função para atualizar filtros
  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setTempFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Resetar bairros quando as cidades mudarem
  const handleCityChange = useCallback((cities: string[]) => {
    setTempFilters((prev) => ({
      ...prev,
      cities,
      // Limpar bairros quando as cidades mudarem (serão recarregados)
      neighborhoods: [],
    }));
    setNeighborhoods([]);
    setNeighborhoodsLoaded(false);
  }, []);

  // Função para limpar todas as cidades selecionadas
  const handleClearCities = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Limpar todas as cidades (deixar vazio para que o select fique disabled)
    handleCityChange([]);
  }, [handleCityChange]);

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

      // Extrair nomes dos bairros da resposta
      const neighborhoodNames = response.data.map((neighborhood: INeighborhood) => neighborhood.name);
      
      // Remover duplicatas e ordenar
      const uniqueNeighborhoods = Array.from(new Set(neighborhoodNames)).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
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
      const currentCity = tempFilters.cities.length > 0 
        ? tempFilters.cities 
        : appliedFilters.cities.length > 0 
        ? appliedFilters.cities 
        : [defaultCity];
      
      const filtersWithCity = {
        ...filters,
        cities: filters.cities.length > 0 ? filters.cities : currentCity,
      };
      setAppliedFilters(filtersWithCity);
      setTempFilters(filtersWithCity);
      onFiltersChange(filtersWithCity);
    },
    [onFiltersChange, tempFilters.cities, appliedFilters.cities, defaultCity]
  );

  // Função para toggle de checkboxes
  const handleCheckboxChange = useCallback((filterType: keyof FilterState) => {
    setAppliedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
    setTempFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  }, []);

  // Função para pesquisar
  const handleSearch = useCallback(() => {
    setAppliedFilters(tempFilters);
    onFiltersChange(tempFilters);
  }, [tempFilters, onFiltersChange]);

  // Função para lidar com mudança de bairros
  const handleNeighborhoodChange = useCallback((neighborhoods: string[]) => {
    setTempFilters((prev) => ({
      ...prev,
      neighborhoods,
    }));
  }, []);

  // Função para limpar todos os filtros
  const clearAllFilters = useCallback(() => {
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
    setTempFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [defaultCity, onFiltersChange]);

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
        {/* Campo de Busca */}
        <TextField
          placeholder="Buscar por endereço"
          value={tempFilters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flexGrow: 1,
            maxWidth: { xs: "100%", sm: 300, md: 350 },
            "@media (max-width: 750px)": {
              maxWidth: "100%",
              "& .MuiInputBase-root": {
                height: 36,
                fontSize: "0.875rem",
              },
            },
          }}
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
            onChange={(e) => handleCityChange(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
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
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', position: 'relative' }}
                  onMouseDown={(e) => {
                    // Prevenir que o select abra quando clicar no botão de limpar
                    const target = e.target as HTMLElement;
                    if (target.closest('button')) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flex: 1, minWidth: 0 }}>
                    {selectedArray.length <= 2 ? (
                      selectedArray.map((city) => (
                        <Chip key={city} label={city} size="small" />
                      ))
                    ) : (
                      <>
                        {selectedArray.slice(0, 2).map((city) => (
                          <Chip key={city} label={city} size="small" />
                        ))}
                        <Chip label={`+${selectedArray.length - 2}`} size="small" />
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
                        pointerEvents: 'auto',
                        '&:hover': {
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
              },
            }}
          >
            {availableCities.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
          </Select>

          {/* Seletor de Bairros */}
          <Select
            multiple
            value={tempFilters.neighborhoods}
            onChange={(e) => handleNeighborhoodChange(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
            onOpen={handleNeighborhoodSelectOpen}
            displayEmpty
            size="small"
            disabled={
              tempFilters.cities.length === 0 ||
              isLoadingNeighborhoods
            }
            renderValue={(selected) => {
              const selectedArray = selected as string[];
              if (selectedArray.length === 0) {
                return <em>Todos os bairros</em>;
              }
              if (selectedArray.length <= 2) {
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedArray.map((neighborhood) => (
                      <Chip key={neighborhood} label={neighborhood} size="small" />
                    ))}
                  </Box>
                );
              }
              return (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedArray.slice(0, 2).map((neighborhood) => (
                    <Chip key={neighborhood} label={neighborhood} size="small" />
                  ))}
                  <Chip label={`+${selectedArray.length - 2}`} size="small" />
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
              },
            }}
          >
            {isLoadingNeighborhoods ? (
              <MenuItem disabled>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Carregando...
              </MenuItem>
            ) : (
              neighborhoods.map((neighborhood) => (
                <MenuItem key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </MenuItem>
              ))
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
          {/* Botão de Pesquisar */}
          <Button
            onClick={handleSearch}
            variant="contained"
            startIcon={<Search />}
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
            Pesquisar
          </Button>

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
          {/* Botão de Pesquisar */}
          <Button
            onClick={handleSearch}
            variant="contained"
            startIcon={<Search />}
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
            Pesquisar
          </Button>

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
