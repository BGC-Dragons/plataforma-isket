import { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  useTheme,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  Chip,
} from "@mui/material";
import {
  Search,
  FilterList,
  ViewList,
  Close,
  ExpandMore,
} from "@mui/icons-material";

interface FilterState {
  search: string;
  cities: string[];
  neighborhoods: string[];
  business: string[];
  purpose: string[];
  propertyTypes: {
    apartments: string[];
    commercial: string[];
    houses: string[];
    lands: string[];
    others: string[];
  };
  rooms: {
    bedrooms: number | null;
    bathrooms: number | null;
    suites: number | null;
    garage: number | null;
  };
  area: { min: number; max: number };
  price: { min: number; max: number };
  advertiserType: string[];
}

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
  defaultCity?: string;
  availableCities?: string[];
  onNeighborhoodsLoad?: (city: string) => Promise<string[]>;
}

export function FilterBar({
  onFiltersChange,
  defaultCity = "CURITIBA",
  availableCities = ["CURITIBA", "SÃO PAULO", "RIO DE JANEIRO"],
  onNeighborhoodsLoad,
}: FilterBarProps) {
  const theme = useTheme();

  // Estados dos filtros
  const [tempFilters, setTempFilters] = useState<FilterState>({
    search: "",
    cities: [defaultCity],
    neighborhoods: [],
    business: [],
    purpose: [],
    propertyTypes: {
      apartments: [],
      commercial: [],
      houses: [],
      lands: [],
      others: [],
    },
    rooms: {
      bedrooms: null,
      bathrooms: null,
      suites: null,
      garage: null,
    },
    area: { min: 0, max: 1000000 },
    price: { min: 0, max: 100000000 },
    advertiserType: [],
  });

  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(tempFilters);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [expandedAccordions, setExpandedAccordions] = useState<
    Record<string, boolean>
  >({
    apartments: false,
    commercial: false,
    houses: false,
    lands: false,
    others: false,
  });

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

  // Toggle functions

  const handleBusinessToggle = useCallback((business: string) => {
    setTempFilters((prev) => ({
      ...prev,
      business: prev.business.includes(business)
        ? prev.business.filter((b) => b !== business)
        : [...prev.business, business],
    }));
  }, []);

  const handlePurposeToggle = useCallback((purpose: string) => {
    setTempFilters((prev) => ({
      ...prev,
      purpose: prev.purpose.includes(purpose)
        ? prev.purpose.filter((p) => p !== purpose)
        : [...prev.purpose, purpose],
    }));
  }, []);

  const handlePropertyTypeToggle = useCallback(
    (category: string, type: string) => {
      setTempFilters((prev) => ({
        ...prev,
        propertyTypes: {
          ...prev.propertyTypes,
          [category]: prev.propertyTypes[
            category as keyof typeof prev.propertyTypes
          ].includes(type)
            ? prev.propertyTypes[
                category as keyof typeof prev.propertyTypes
              ].filter((t) => t !== type)
            : [
                ...prev.propertyTypes[
                  category as keyof typeof prev.propertyTypes
                ],
                type,
              ],
        },
      }));
    },
    []
  );

  const handleRoomChange = useCallback(
    (roomType: string, value: number | null) => {
      setTempFilters((prev) => ({
        ...prev,
        rooms: {
          ...prev.rooms,
          [roomType]: value,
        },
      }));
    },
    []
  );

  const handleAreaChange = useCallback(
    (newArea: { min: number; max: number }) => {
      setTempFilters((prev) => ({ ...prev, area: newArea }));
    },
    []
  );

  const handlePriceChange = useCallback(
    (newPrice: { min: number; max: number }) => {
      setTempFilters((prev) => ({ ...prev, price: newPrice }));
    },
    []
  );

  const handleAdvertiserTypeToggle = useCallback((type: string) => {
    setTempFilters((prev) => ({
      ...prev,
      advertiserType: prev.advertiserType.includes(type)
        ? prev.advertiserType.filter((t) => t !== type)
        : [...prev.advertiserType, type],
    }));
  }, []);

  const handleAccordionChange = useCallback(
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedAccordions((prev) => ({ ...prev, [panel]: isExpanded }));
    },
    []
  );

  // Função para limpar todos os filtros
  const clearAllFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      search: "",
      cities: [defaultCity],
      neighborhoods: [],
      business: [],
      purpose: [],
      propertyTypes: {
        apartments: [],
        commercial: [],
        houses: [],
        lands: [],
        others: [],
      },
      rooms: {
        bedrooms: null,
        bathrooms: null,
        suites: null,
        garage: null,
      },
      area: { min: 0, max: 1000000 },
      price: { min: 0, max: 100000000 },
      advertiserType: [],
    };
    setTempFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [defaultCity, onFiltersChange]);

  // Função para aplicar filtros
  const applyFilters = useCallback(() => {
    setAppliedFilters(tempFilters);
    onFiltersChange(tempFilters);
    setIsFilterModalOpen(false);
  }, [tempFilters, onFiltersChange]);

  // Contar filtros ativos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.cities.length > 1) count++;
    if (appliedFilters.neighborhoods.length > 0) count++;
    if (appliedFilters.business.length > 0) count++;
    if (appliedFilters.purpose.length > 0) count++;
    if (
      Object.values(appliedFilters.propertyTypes).some((arr) => arr.length > 0)
    )
      count++;
    if (Object.values(appliedFilters.rooms).some((val) => val !== null))
      count++;
    if (appliedFilters.area.min > 0 || appliedFilters.area.max < 1000000)
      count++;
    if (appliedFilters.price.min > 0 || appliedFilters.price.max < 100000000)
      count++;
    if (appliedFilters.advertiserType.length > 0) count++;
    return count;
  };

  const FilterModal = () => {
    return (
      <Dialog
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filtros
          </Typography>
          <IconButton
            onClick={() => setIsFilterModalOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column" }}>
          {/* Negócio */}
          <FormControl
            component="fieldset"
            sx={{ mb: 4, width: "100%", mt: 2 }}
          >
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Negócio
            </FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.business.includes("venda")}
                    onChange={() => handleBusinessToggle("venda")}
                  />
                }
                label="Venda"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.business.includes("aluguel")}
                    onChange={() => handleBusinessToggle("aluguel")}
                  />
                }
                label="Aluguel"
              />
            </FormGroup>
          </FormControl>

          {/* Finalidade */}
          <FormControl component="fieldset" sx={{ mb: 4, width: "100%" }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Finalidade
            </FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.purpose.includes("residencial")}
                    onChange={() => handlePurposeToggle("residencial")}
                  />
                }
                label="Residencial"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.purpose.includes("comercial")}
                    onChange={() => handlePurposeToggle("comercial")}
                  />
                }
                label="Comercial"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.purpose.includes("industrial")}
                    onChange={() => handlePurposeToggle("industrial")}
                  />
                }
                label="Industrial"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.purpose.includes("agricultura")}
                    onChange={() => handlePurposeToggle("agricultura")}
                  />
                }
                label="Agricultura"
              />
            </FormGroup>
          </FormControl>

          {/* Tipo do Imóvel */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Tipo do Imóvel
            </Typography>

            {/* Apartamentos */}
            <Accordion
              expanded={expandedAccordions.apartments}
              onChange={handleAccordionChange("apartments")}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Apartamentos</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {[
                    "padrão",
                    "flat",
                    "loft",
                    "studio",
                    "duplex",
                    "triplex",
                    "cobertura",
                  ].map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={tempFilters.propertyTypes.apartments.includes(
                            type
                          )}
                          onChange={() =>
                            handlePropertyTypeToggle("apartments", type)
                          }
                        />
                      }
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Comerciais */}
            <Accordion
              expanded={expandedAccordions.commercial}
              onChange={handleAccordionChange("commercial")}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Comerciais</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {[
                    "sala comercial",
                    "casa comercial",
                    "ponto comercial",
                    "galpão",
                    "loja",
                    "prédio",
                    "clínica",
                    "coworking",
                    "sobreloja",
                  ].map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={tempFilters.propertyTypes.commercial.includes(
                            type
                          )}
                          onChange={() =>
                            handlePropertyTypeToggle("commercial", type)
                          }
                        />
                      }
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Casas e Sítios */}
            <Accordion
              expanded={expandedAccordions.houses}
              onChange={handleAccordionChange("houses")}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Casas e Sítios</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {[
                    "casa",
                    "sobrado",
                    "sítio",
                    "chalé",
                    "chácara",
                    "edícula",
                  ].map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={tempFilters.propertyTypes.houses.includes(
                            type
                          )}
                          onChange={() =>
                            handlePropertyTypeToggle("houses", type)
                          }
                        />
                      }
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Terrenos */}
            <Accordion
              expanded={expandedAccordions.lands}
              onChange={handleAccordionChange("lands")}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Terrenos</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {["terreno", "fazenda"].map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={tempFilters.propertyTypes.lands.includes(
                            type
                          )}
                          onChange={() =>
                            handlePropertyTypeToggle("lands", type)
                          }
                        />
                      }
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>

            {/* Outros */}
            <Accordion
              expanded={expandedAccordions.others}
              onChange={handleAccordionChange("others")}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Outros</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  {[
                    "garagem",
                    "quarto",
                    "resort",
                    "república",
                    "box",
                    "tombado",
                    "granja",
                    "haras",
                    "outros",
                  ].map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={tempFilters.propertyTypes.others.includes(
                            type
                          )}
                          onChange={() =>
                            handlePropertyTypeToggle("others", type)
                          }
                        />
                      }
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Cômodos */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Cômodos
            </Typography>
            <Stack direction="column" spacing={2}>
              {/* Quartos */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Quartos
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={
                        tempFilters.rooms.bedrooms === num
                          ? "contained"
                          : "outlined"
                      }
                      size="small"
                      onClick={() =>
                        handleRoomChange(
                          "bedrooms",
                          tempFilters.rooms.bedrooms === num ? null : num
                        )
                      }
                      sx={{
                        minWidth: 40,
                        height: 32,
                        borderRadius: 2,
                        borderColor: theme.palette.primary.main,
                        color:
                          tempFilters.rooms.bedrooms === num
                            ? "white"
                            : theme.palette.primary.main,
                        backgroundColor:
                          tempFilters.rooms.bedrooms === num
                            ? theme.palette.primary.main
                            : "white",
                        "&:hover": {
                          borderColor: theme.palette.primary.dark,
                          backgroundColor:
                            tempFilters.rooms.bedrooms === num
                              ? theme.palette.primary.dark
                              : theme.palette.primary.light,
                        },
                      }}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant={
                      tempFilters.rooms.bedrooms === 5
                        ? "contained"
                        : "outlined"
                    }
                    size="small"
                    onClick={() =>
                      handleRoomChange(
                        "bedrooms",
                        tempFilters.rooms.bedrooms === 5 ? null : 5
                      )
                    }
                    sx={{
                      minWidth: 40,
                      height: 32,
                      borderRadius: 2,
                      borderColor: theme.palette.primary.main,
                      color:
                        tempFilters.rooms.bedrooms === 5
                          ? "white"
                          : theme.palette.primary.main,
                      backgroundColor:
                        tempFilters.rooms.bedrooms === 5
                          ? theme.palette.primary.main
                          : "white",
                      "&:hover": {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor:
                          tempFilters.rooms.bedrooms === 5
                            ? theme.palette.primary.dark
                            : theme.palette.primary.light,
                      },
                    }}
                  >
                    4+
                  </Button>
                </Stack>
              </Box>

              {/* Banheiros */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Banheiros
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={
                        tempFilters.rooms.bathrooms === num
                          ? "contained"
                          : "outlined"
                      }
                      size="small"
                      onClick={() =>
                        handleRoomChange(
                          "bathrooms",
                          tempFilters.rooms.bathrooms === num ? null : num
                        )
                      }
                      sx={{
                        minWidth: 40,
                        height: 32,
                        borderRadius: 2,
                        borderColor: theme.palette.primary.main,
                        color:
                          tempFilters.rooms.bathrooms === num
                            ? "white"
                            : theme.palette.primary.main,
                        backgroundColor:
                          tempFilters.rooms.bathrooms === num
                            ? theme.palette.primary.main
                            : "white",
                        "&:hover": {
                          borderColor: theme.palette.primary.dark,
                          backgroundColor:
                            tempFilters.rooms.bathrooms === num
                              ? theme.palette.primary.dark
                              : theme.palette.primary.light,
                        },
                      }}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant={
                      tempFilters.rooms.bathrooms === 5
                        ? "contained"
                        : "outlined"
                    }
                    size="small"
                    onClick={() =>
                      handleRoomChange(
                        "bathrooms",
                        tempFilters.rooms.bathrooms === 5 ? null : 5
                      )
                    }
                    sx={{
                      minWidth: 40,
                      height: 32,
                      borderRadius: 2,
                      borderColor: theme.palette.primary.main,
                      color:
                        tempFilters.rooms.bathrooms === 5
                          ? "white"
                          : theme.palette.primary.main,
                      backgroundColor:
                        tempFilters.rooms.bathrooms === 5
                          ? theme.palette.primary.main
                          : "white",
                      "&:hover": {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor:
                          tempFilters.rooms.bathrooms === 5
                            ? theme.palette.primary.dark
                            : theme.palette.primary.light,
                      },
                    }}
                  >
                    4+
                  </Button>
                </Stack>
              </Box>

              {/* Suítes */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Suítes
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={
                        tempFilters.rooms.suites === num
                          ? "contained"
                          : "outlined"
                      }
                      size="small"
                      onClick={() =>
                        handleRoomChange(
                          "suites",
                          tempFilters.rooms.suites === num ? null : num
                        )
                      }
                      sx={{
                        minWidth: 40,
                        height: 32,
                        borderRadius: 2,
                        borderColor: theme.palette.primary.main,
                        color:
                          tempFilters.rooms.suites === num
                            ? "white"
                            : theme.palette.primary.main,
                        backgroundColor:
                          tempFilters.rooms.suites === num
                            ? theme.palette.primary.main
                            : "white",
                        "&:hover": {
                          borderColor: theme.palette.primary.dark,
                          backgroundColor:
                            tempFilters.rooms.suites === num
                              ? theme.palette.primary.dark
                              : theme.palette.primary.light,
                        },
                      }}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant={
                      tempFilters.rooms.suites === 5 ? "contained" : "outlined"
                    }
                    size="small"
                    onClick={() =>
                      handleRoomChange(
                        "suites",
                        tempFilters.rooms.suites === 5 ? null : 5
                      )
                    }
                    sx={{
                      minWidth: 40,
                      height: 32,
                      borderRadius: 2,
                      borderColor: theme.palette.primary.main,
                      color:
                        tempFilters.rooms.suites === 5
                          ? "white"
                          : theme.palette.primary.main,
                      backgroundColor:
                        tempFilters.rooms.suites === 5
                          ? theme.palette.primary.main
                          : "white",
                      "&:hover": {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor:
                          tempFilters.rooms.suites === 5
                            ? theme.palette.primary.dark
                            : theme.palette.primary.light,
                      },
                    }}
                  >
                    4+
                  </Button>
                </Stack>
              </Box>

              {/* Garagem */}
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Garagem
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      variant={
                        tempFilters.rooms.garage === num
                          ? "contained"
                          : "outlined"
                      }
                      size="small"
                      onClick={() =>
                        handleRoomChange(
                          "garage",
                          tempFilters.rooms.garage === num ? null : num
                        )
                      }
                      sx={{
                        minWidth: 40,
                        height: 32,
                        borderRadius: 2,
                        borderColor: theme.palette.primary.main,
                        color:
                          tempFilters.rooms.garage === num
                            ? "white"
                            : theme.palette.primary.main,
                        backgroundColor:
                          tempFilters.rooms.garage === num
                            ? theme.palette.primary.main
                            : "white",
                        "&:hover": {
                          borderColor: theme.palette.primary.dark,
                          backgroundColor:
                            tempFilters.rooms.garage === num
                              ? theme.palette.primary.dark
                              : theme.palette.primary.light,
                        },
                      }}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    variant={
                      tempFilters.rooms.garage === 5 ? "contained" : "outlined"
                    }
                    size="small"
                    onClick={() =>
                      handleRoomChange(
                        "garage",
                        tempFilters.rooms.garage === 5 ? null : 5
                      )
                    }
                    sx={{
                      minWidth: 40,
                      height: 32,
                      borderRadius: 2,
                      borderColor: theme.palette.primary.main,
                      color:
                        tempFilters.rooms.garage === 5
                          ? "white"
                          : theme.palette.primary.main,
                      backgroundColor:
                        tempFilters.rooms.garage === 5
                          ? theme.palette.primary.main
                          : "white",
                      "&:hover": {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor:
                          tempFilters.rooms.garage === 5
                            ? theme.palette.primary.dark
                            : theme.palette.primary.light,
                      },
                    }}
                  >
                    4+
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* Área (m²) */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Área (m²)
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={[tempFilters.area.min, tempFilters.area.max]}
                onChange={(_, newValue) => {
                  const [min, max] = newValue as number[];
                  handleAreaChange({ min, max });
                }}
                valueLabelDisplay="auto"
                min={0}
                max={1000000}
                step={10}
                marks={[
                  { value: 0, label: "0" },
                  { value: 500000, label: "500k" },
                  { value: 1000000, label: "1M" },
                ]}
                sx={{ width: "95%", mx: "auto" }}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Mínimo"
                  type="number"
                  value={tempFilters.area.min}
                  onChange={(e) =>
                    handleAreaChange({
                      ...tempFilters.area,
                      min: Number(e.target.value),
                    })
                  }
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Máximo"
                  type="number"
                  value={tempFilters.area.max}
                  onChange={(e) =>
                    handleAreaChange({
                      ...tempFilters.area,
                      max: Number(e.target.value),
                    })
                  }
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Stack>
            </Box>
          </Box>

          {/* Preço Total */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Preço Total
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={[tempFilters.price.min, tempFilters.price.max]}
                onChange={(_, newValue) => {
                  const [min, max] = newValue as number[];
                  handlePriceChange({ min, max });
                }}
                valueLabelDisplay="auto"
                min={0}
                max={100000000}
                step={10000}
                marks={[
                  { value: 0, label: "R$ 0" },
                  { value: 50000000, label: "R$ 50M" },
                  { value: 100000000, label: "R$ 100M" },
                ]}
                sx={{ width: "95%", mx: "auto" }}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Mínimo"
                  type="number"
                  value={tempFilters.price.min}
                  onChange={(e) =>
                    handlePriceChange({
                      ...tempFilters.price,
                      min: Number(e.target.value),
                    })
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Máximo"
                  type="number"
                  value={tempFilters.price.max}
                  onChange={(e) =>
                    handlePriceChange({
                      ...tempFilters.price,
                      max: Number(e.target.value),
                    })
                  }
                  size="small"
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Box>
          </Box>

          {/* Tipo de Anunciante */}
          <FormControl component="fieldset" sx={{ mb: 4 }}>
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Tipo de Anunciante
            </FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.advertiserType.includes(
                      "proprietario"
                    )}
                    onChange={() => handleAdvertiserTypeToggle("proprietario")}
                  />
                }
                label="Proprietário Direto"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.advertiserType.includes("imobiliaria")}
                    onChange={() => handleAdvertiserTypeToggle("imobiliaria")}
                  />
                }
                label="Imobiliária"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempFilters.advertiserType.includes("portal")}
                    onChange={() => handleAdvertiserTypeToggle("portal")}
                  />
                }
                label="Portal"
              />
            </FormGroup>
          </FormControl>
        </DialogContent>

        <DialogActions
          sx={{ p: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}
        >
          <Button
            onClick={clearAllFilters}
            variant="outlined"
            sx={{
              mr: 2,
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              backgroundColor: theme.palette.background.paper,
              "&:hover": {
                borderColor: theme.palette.text.primary,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Limpar
          </Button>
          <Button
            onClick={applyFilters}
            variant="contained"
            sx={{
              minWidth: 120,
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Filtrar
          </Button>
        </DialogActions>
      </Dialog>
    );
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
            value=""
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
            {neighborhoods.map((neighborhood) => (
              <MenuItem key={neighborhood} value={neighborhood}>
                {neighborhood}
              </MenuItem>
            ))}
          </Select>

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
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 1.5,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ViewList sx={{ fontSize: "1.2rem" }} />
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
            {appliedFilters.business.map((business) => (
              <Chip
                key={business}
                label={business.charAt(0).toUpperCase() + business.slice(1)}
                onDelete={() => handleBusinessToggle(business)}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            ))}
            {appliedFilters.purpose.map((purpose) => (
              <Chip
                key={purpose}
                label={purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                onDelete={() => handlePurposeToggle(purpose)}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            ))}
            {appliedFilters.advertiserType.map((type) => (
              <Chip
                key={type}
                label={type.charAt(0).toUpperCase() + type.slice(1)}
                onDelete={() => handleAdvertiserTypeToggle(type)}
                size="small"
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        )}
      </Paper>

      <FilterModal />
    </>
  );
}
