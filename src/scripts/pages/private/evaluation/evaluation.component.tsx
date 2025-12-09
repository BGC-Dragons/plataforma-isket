import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  useTheme,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { FilterBar } from "../../../modules/search/filter/filter-bar";
import { MapComponent } from "../../../modules/search/map/map";
import { EvaluationPropertyCard } from "../../../modules/evaluation/evaluation-property-card";
import { EvaluationActionBar } from "../../../modules/evaluation/evaluation-action-bar";
import { GenerateReportModal } from "../../../modules/evaluation/generate-report-modal";
import { AnalysisSummaryDrawer } from "../../../modules/evaluation/analysis-summary-drawer";
import { CustomPagination } from "../../../library/components/custom-pagination";
import { useAuth } from "../../../modules/access-manager/auth.hook";

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

// Mock data para propriedades
const mockProperties: PropertyData[] = Array.from({ length: 30 }, (_, i) => ({
  id: `prop-${i + 1}`,
  title: `Propriedade ${i + 1}`,
  price: 145000,
  pricePerSquareMeter: 5370.37,
  address: "Rua Marechal Deodoro, 235, Centro",
  neighborhood: "Centro",
  city: "CURITIBA",
  state: "PR",
  propertyType: "RESIDENCIAL",
  bedrooms: 1,
  bathrooms: 1,
  area: 24,
  images: [],
}));

export function EvaluationComponent() {
  const theme = useTheme();
  const auth = useAuth();

  const [properties] = useState<PropertyData[]>(mockProperties);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(
    new Set()
  );
  const [loading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [calculationCriterion, setCalculationCriterion] =
    useState("area-total");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  const itemsPerPage = 18;

  // Mock cities data
  const defaultCity = "CURITIBA";
  const availableCities = ["CURITIBA", "SÃO PAULO", "RIO DE JANEIRO"];
  const cityToCodeMap: Record<string, string> = {
    CURITIBA: "4106902-PR",
    "SÃO PAULO": "3550308-SP",
    "RIO DE JANEIRO": "3304557-RJ",
  };

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
  const handleFilterChange = useCallback((filters: FilterState) => {
    setCurrentFilters(filters);
    setCurrentPage(1);
    // TODO: Implementar busca real
  }, []);

  const handlePropertySelect = useCallback((id: string, selected: boolean) => {
    setSelectedProperties((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = new Set(properties.map((p) => p.id));
        setSelectedProperties(allIds);
      } else {
        setSelectedProperties(new Set());
      }
    },
    [properties]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedProperties(new Set());
  }, []);

  const handleAnalysisSummary = useCallback(() => {
    setIsAnalysisDrawerOpen(true);
  }, []);

  const handleGenerateReport = useCallback(() => {
    setIsReportModalOpen(true);
  }, []);

  const handleExportExcel = useCallback(() => {
    // TODO: Implementar exportação
    console.log("Exportar Excel");
  }, []);

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

            {/* Contador de Resultados e Selecionar Todos */}
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
            </Box>

            {/* Cards de Propriedades */}
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
      />

      {/* Drawer de Resumo da Análise */}
      <AnalysisSummaryDrawer
        open={isAnalysisDrawerOpen}
        onClose={() => setIsAnalysisDrawerOpen(false)}
        selectedCount={selectedProperties.size}
      />
    </Box>
  );
}
