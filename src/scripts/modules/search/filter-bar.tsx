import { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  IconButton,
  useTheme,
  Paper,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
} from "@mui/material";
import { Search, FilterList, ViewList, ViewModule } from "@mui/icons-material";
import { FilterModal } from "./filter-modal";

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

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
  defaultCity?: string;
  availableCities?: string[];
  onNeighborhoodsLoad?: (city: string) => Promise<string[]>;
  viewMode?: "cards" | "list";
  onViewModeChange?: () => void;
}

export function FilterBar({
  onFiltersChange,
  defaultCity = "CURITIBA",
  availableCities = ["CURITIBA", "SÃO PAULO", "RIO DE JANEIRO"],
  onNeighborhoodsLoad,
  viewMode = "cards",
  onViewModeChange,
}: FilterBarProps) {
  const theme = useTheme();

  // Estados dos filtros
  const [tempFilters, setTempFilters] = useState<FilterState>({
    search: "",
    cities: [defaultCity],
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
  });

  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(tempFilters);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");

  // Carregar bairros quando a cidade mudar
  useEffect(() => {
    if (onNeighborhoodsLoad && tempFilters.cities.length > 0) {
      onNeighborhoodsLoad(tempFilters.cities[0]).then(setNeighborhoods);
    }
  }, [tempFilters.cities, onNeighborhoodsLoad]);

  // Função para atualizar filtros
  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setTempFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Função para aplicar filtros do modal
  const handleApplyFilters = useCallback(
    (filters: FilterState) => {
      setAppliedFilters(filters);
      onFiltersChange(filters);
    },
    [onFiltersChange]
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
    const searchFilters = {
      ...tempFilters,
      neighborhoods: selectedNeighborhood ? [selectedNeighborhood] : [],
    };
    setAppliedFilters(searchFilters);
    onFiltersChange(searchFilters);
  }, [tempFilters, selectedNeighborhood, onFiltersChange]);

  // Função para lidar com mudança de bairro
  const handleNeighborhoodChange = useCallback((neighborhood: string) => {
    setSelectedNeighborhood(neighborhood);
    setTempFilters((prev) => ({
      ...prev,
      neighborhoods: neighborhood ? [neighborhood] : [],
    }));
  }, []);

  // Função para limpar todos os filtros
  const clearAllFilters = useCallback(() => {
    setSelectedNeighborhood("");
    const clearedFilters: FilterState = {
      search: "",
      cities: [defaultCity],
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
        }}
      >
        {/* Campo de Busca */}
        <TextField
          fullWidth
          placeholder="Buscar por endereço"
          value={tempFilters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: { xs: "100%", sm: 400, md: 500 } }}
        />

        {/* Seletor de Cidade */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Select
            value={tempFilters.cities[0] || ""}
            onChange={(e) => handleFilterChange({ cities: [e.target.value] })}
            displayEmpty
            size="small"
            sx={{
              minWidth: 120,
              borderRadius: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
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
            value={selectedNeighborhood}
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
            displayEmpty
            size="small"
            disabled={neighborhoods.length === 0}
            sx={{
              minWidth: 120,
              borderRadius: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
            }}
          >
            <MenuItem value="">
              <em>Todos os bairros</em>
            </MenuItem>
            {neighborhoods.map((neighborhood) => (
              <MenuItem key={neighborhood} value={neighborhood}>
                {neighborhood}
              </MenuItem>
            ))}
          </Select>

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

          {/* Botão de Visualização */}
          <IconButton
            onClick={onViewModeChange}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 1.5,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            {viewMode === "cards" ? (
              <ViewList sx={{ fontSize: "1.2rem" }} />
            ) : (
              <ViewModule sx={{ fontSize: "1.2rem" }} />
            )}
          </IconButton>
        </Box>

        {/* Chips dos Filtros Ativos */}
        {getActiveFiltersCount() > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              mt: 1,
              width: "100%",
            }}
          >
            {appliedFilters.venda && (
              <Chip
                label="Venda"
                onDelete={() => handleCheckboxChange("venda")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.aluguel && (
              <Chip
                label="Aluguel"
                onDelete={() => handleCheckboxChange("aluguel")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.residencial && (
              <Chip
                label="Residencial"
                onDelete={() => handleCheckboxChange("residencial")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.comercial && (
              <Chip
                label="Comercial"
                onDelete={() => handleCheckboxChange("comercial")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.industrial && (
              <Chip
                label="Industrial"
                onDelete={() => handleCheckboxChange("industrial")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.agricultura && (
              <Chip
                label="Agricultura"
                onDelete={() => handleCheckboxChange("agricultura")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.proprietario_direto && (
              <Chip
                label="Proprietário Direto"
                onDelete={() => handleCheckboxChange("proprietario_direto")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.imobiliaria && (
              <Chip
                label="Imobiliária"
                onDelete={() => handleCheckboxChange("imobiliaria")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.portal && (
              <Chip
                label="Portal"
                onDelete={() => handleCheckboxChange("portal")}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            )}
            {appliedFilters.neighborhoods.map((neighborhood) => (
              <Chip
                key={neighborhood}
                label={neighborhood}
                onDelete={() => {
                  setSelectedNeighborhood("");
                  handleNeighborhoodChange("");
                }}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        )}
      </Paper>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={clearAllFilters}
      />
    </>
  );
}
