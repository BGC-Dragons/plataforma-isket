import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Checkbox,
  FormControlLabel,
  Box,
  IconButton,
  Divider,
  FormControl,
  FormLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Slider,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Close, ExpandMore } from "@mui/icons-material";
import type { FilterState } from "./filter.types";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  onClearFilters?: () => void;
  initialFilters?: FilterState;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onClearFilters,
  initialFilters,
}) => {
  const [areaRange, setAreaRange] = useState<number[]>([0, 1000000]);
  const [precoRange, setPrecoRange] = useState<number[]>([0, 100000000]);

  const getDefaultFilters = (): FilterState => ({
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

  const [filters, setFilters] = useState<FilterState>(getDefaultFilters());
  const prevIsOpenRef = useRef(false);
  const prevInitialFiltersRef = useRef<string>("");

  // Função para criar uma string de comparação dos filtros
  const getFiltersKey = (filters: FilterState | undefined): string => {
    if (!filters) return "";
    return JSON.stringify({
      venda: filters.venda,
      aluguel: filters.aluguel,
      residencial: filters.residencial,
      comercial: filters.comercial,
      industrial: filters.industrial,
      agricultura: filters.agricultura,
      apartamento_padrao: filters.apartamento_padrao,
      apartamento_flat: filters.apartamento_flat,
      apartamento_loft: filters.apartamento_loft,
      apartamento_studio: filters.apartamento_studio,
      apartamento_duplex: filters.apartamento_duplex,
      apartamento_triplex: filters.apartamento_triplex,
      apartamento_cobertura: filters.apartamento_cobertura,
      comercial_sala: filters.comercial_sala,
      comercial_casa: filters.comercial_casa,
      comercial_ponto: filters.comercial_ponto,
      comercial_galpao: filters.comercial_galpao,
      comercial_loja: filters.comercial_loja,
      comercial_predio: filters.comercial_predio,
      comercial_clinica: filters.comercial_clinica,
      comercial_coworking: filters.comercial_coworking,
      comercial_sobreloja: filters.comercial_sobreloja,
      casa_casa: filters.casa_casa,
      casa_sobrado: filters.casa_sobrado,
      casa_sitio: filters.casa_sitio,
      casa_chale: filters.casa_chale,
      casa_chacara: filters.casa_chacara,
      casa_edicula: filters.casa_edicula,
      terreno_terreno: filters.terreno_terreno,
      terreno_fazenda: filters.terreno_fazenda,
      outros_garagem: filters.outros_garagem,
      outros_quarto: filters.outros_quarto,
      outros_resort: filters.outros_resort,
      outros_republica: filters.outros_republica,
      outros_box: filters.outros_box,
      outros_tombado: filters.outros_tombado,
      outros_granja: filters.outros_granja,
      outros_haras: filters.outros_haras,
      outros_outros: filters.outros_outros,
      quartos: filters.quartos,
      banheiros: filters.banheiros,
      suites: filters.suites,
      garagem: filters.garagem,
      area_min: filters.area_min,
      area_max: filters.area_max,
      preco_min: filters.preco_min,
      preco_max: filters.preco_max,
      proprietario_direto: filters.proprietario_direto,
      imobiliaria: filters.imobiliaria,
      portal: filters.portal,
      lancamento: filters.lancamento,
      palavras_chave: filters.palavras_chave,
    });
  };

  // Sincronizar filtros quando o modal abre ou quando initialFilters muda
  useEffect(() => {
    if (!initialFilters) return;

    const currentFiltersKey = getFiltersKey(initialFilters);
    const prevFiltersKey = prevInitialFiltersRef.current;

    // Sincronizar quando o modal muda de fechado para aberto
    if (isOpen && !prevIsOpenRef.current) {
      setFilters(initialFilters);
      setAreaRange([initialFilters.area_min, initialFilters.area_max]);
      setPrecoRange([initialFilters.preco_min, initialFilters.preco_max]);
      prevInitialFiltersRef.current = currentFiltersKey;
    }
    // Sincronizar quando initialFilters muda enquanto o modal está aberto
    // (por exemplo, quando limpa os filtros)
    else if (
      isOpen &&
      prevIsOpenRef.current &&
      currentFiltersKey !== prevFiltersKey
    ) {
      setFilters(initialFilters);
      setAreaRange([initialFilters.area_min, initialFilters.area_max]);
      setPrecoRange([initialFilters.preco_min, initialFilters.preco_max]);
      prevInitialFiltersRef.current = currentFiltersKey;
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialFilters]);

  const handleCheckboxChange = (filterType: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const handleComodoChange = (
    comodoType: "quartos" | "banheiros" | "suites" | "garagem",
    value: number | null
  ) => {
    setFilters((prev) => ({
      ...prev,
      [comodoType]: prev[comodoType] === value ? null : value,
    }));
  };

  const handleSliderChange = (
    sliderType: "area" | "preco",
    value: number[],
    setValue: (value: number[]) => void
  ) => {
    setValue(value);
    if (sliderType === "area") {
      setFilters((prev) => ({
        ...prev,
        area_min: value[0],
        area_max: value[1],
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        preco_min: value[0],
        preco_max: value[1],
      }));
    }
  };

  // Função para formatar área (número com separador de milhar)
  const formatArea = (value: number): string => {
    return value.toLocaleString("pt-BR");
  };

  // Função para desformatar área (remover pontos e espaços)
  const unformatArea = (value: string): number => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? parseInt(numbers, 10) : 0;
  };

  // Função para formatar preço (moeda brasileira)
  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Função para desformatar preço (remover símbolos de moeda e formatação)
  const unformatPrice = (value: string): number => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? parseInt(numbers, 10) : 0;
  };

  const handleApplyFilters = () => {
    // Preservar a cidade se não estiver nos filtros
    // E preservar drawingGeometries e addressCoordinates dos filtros iniciais
    const filtersWithCity = {
      ...filters,
      cities:
        filters.cities.length > 0
          ? filters.cities
          : initialFilters?.cities && initialFilters.cities.length > 0
          ? initialFilters.cities
          : [],
      // Preservar drawingGeometries e addressCoordinates dos filtros iniciais
      drawingGeometries: initialFilters?.drawingGeometries,
      addressCoordinates: initialFilters?.addressCoordinates,
      addressZoom: initialFilters?.addressZoom,
    };
    onApplyFilters(filtersWithCity);
    onClose();
  };

  const handleClearFilters = () => {
    // Preservar a cidade atual dos filtros iniciais
    const preservedCity =
      initialFilters?.cities && initialFilters.cities.length > 0
        ? initialFilters.cities
        : [];

    setAreaRange([0, 1000000]);
    setPrecoRange([0, 100000000]);

    const clearedFilters: FilterState = {
      search: "",
      cities: preservedCity,
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

    // Apenas limpar o estado interno do modal
    setFilters(clearedFilters);

    // Se existe onClearFilters, chama ele (que vai aplicar os filtros limpos)
    // O onClearFilters do FilterBar já aplica os filtros, então não precisa aplicar aqui
    if (onClearFilters) {
      onClearFilters();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Filtros
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{}}
      >
        <FormControl component="fieldset" sx={{ mb: 4, width: "100%", mt: 2 }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            Negócio
          </FormLabel>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.venda}
                  onChange={() => handleCheckboxChange("venda")}
                />
              }
              label="Venda"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.aluguel}
                  onChange={() => handleCheckboxChange("aluguel")}
                />
              }
              label="Aluguel"
            />
          </FormGroup>
        </FormControl>

        <FormControl component="fieldset" sx={{ mb: 4, width: "100%" }}>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            Finalidade
          </FormLabel>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.residencial}
                  onChange={() => handleCheckboxChange("residencial")}
                />
              }
              label="Residencial"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.comercial}
                  onChange={() => handleCheckboxChange("comercial")}
                />
              }
              label="Comercial"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.industrial}
                  onChange={() => handleCheckboxChange("industrial")}
                />
              }
              label="Industrial"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.agricultura}
                  onChange={() => handleCheckboxChange("agricultura")}
                />
              }
              label="Agricultura"
            />
          </FormGroup>
        </FormControl>

        {/* Seção Tipo do Imóvel */}
        <FormControl component="fieldset" sx={{ mb: 4, width: "100%" }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Tipo do Imóvel
          </FormLabel>

          {/* Accordion Apartamentos */}
          <Accordion sx={{ mb: 1, boxShadow: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Apartamentos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.apartamento_padrao}
                      onChange={() =>
                        handleCheckboxChange("apartamento_padrao")
                      }
                    />
                  }
                  label="Padrão"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.apartamento_flat}
                      onChange={() => handleCheckboxChange("apartamento_flat")}
                    />
                  }
                  label="Flat"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.apartamento_loft}
                      onChange={() => handleCheckboxChange("apartamento_loft")}
                    />
                  }
                  label="Loft"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.apartamento_studio}
                      onChange={() =>
                        handleCheckboxChange("apartamento_studio")
                      }
                    />
                  }
                  label="Studio"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.apartamento_duplex}
                      onChange={() =>
                        handleCheckboxChange("apartamento_duplex")
                      }
                    />
                  }
                  label="Duplex"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.apartamento_triplex}
                      onChange={() =>
                        handleCheckboxChange("apartamento_triplex")
                      }
                    />
                  }
                  label="Triplex"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.apartamento_cobertura}
                      onChange={() =>
                        handleCheckboxChange("apartamento_cobertura")
                      }
                    />
                  }
                  label="Cobertura"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Accordion Comerciais */}
          <Accordion sx={{ mb: 1, boxShadow: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Comerciais
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_sala}
                      onChange={() => handleCheckboxChange("comercial_sala")}
                    />
                  }
                  label="Sala comercial"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_casa}
                      onChange={() => handleCheckboxChange("comercial_casa")}
                    />
                  }
                  label="Casa comercial"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_ponto}
                      onChange={() => handleCheckboxChange("comercial_ponto")}
                    />
                  }
                  label="Ponto comercial"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_galpao}
                      onChange={() => handleCheckboxChange("comercial_galpao")}
                    />
                  }
                  label="Galpão"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_loja}
                      onChange={() => handleCheckboxChange("comercial_loja")}
                    />
                  }
                  label="Loja"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_predio}
                      onChange={() => handleCheckboxChange("comercial_predio")}
                    />
                  }
                  label="Prédio"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_clinica}
                      onChange={() => handleCheckboxChange("comercial_clinica")}
                    />
                  }
                  label="Clínica"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_coworking}
                      onChange={() =>
                        handleCheckboxChange("comercial_coworking")
                      }
                    />
                  }
                  label="Coworking"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.comercial_sobreloja}
                      onChange={() =>
                        handleCheckboxChange("comercial_sobreloja")
                      }
                    />
                  }
                  label="Sobreloja"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Accordion Casas e Sítios */}
          <Accordion sx={{ mb: 1, boxShadow: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Casas e Sítios
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.casa_casa}
                      onChange={() => handleCheckboxChange("casa_casa")}
                    />
                  }
                  label="Casa"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.casa_sobrado}
                      onChange={() => handleCheckboxChange("casa_sobrado")}
                    />
                  }
                  label="Sobrado"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.casa_sitio}
                      onChange={() => handleCheckboxChange("casa_sitio")}
                    />
                  }
                  label="Sítio"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.casa_chale}
                      onChange={() => handleCheckboxChange("casa_chale")}
                    />
                  }
                  label="Chalé"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.casa_chacara}
                      onChange={() => handleCheckboxChange("casa_chacara")}
                    />
                  }
                  label="Chácara"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.casa_edicula}
                      onChange={() => handleCheckboxChange("casa_edicula")}
                    />
                  }
                  label="Edícula"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Accordion Terrenos */}
          <Accordion sx={{ mb: 1, boxShadow: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Terrenos
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.terreno_terreno}
                      onChange={() => handleCheckboxChange("terreno_terreno")}
                    />
                  }
                  label="Terreno"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.terreno_fazenda}
                      onChange={() => handleCheckboxChange("terreno_fazenda")}
                    />
                  }
                  label="Fazenda"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          {/* Accordion Outros */}
          <Accordion sx={{ mb: 1, boxShadow: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Outros
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_garagem}
                      onChange={() => handleCheckboxChange("outros_garagem")}
                    />
                  }
                  label="Garagem"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_quarto}
                      onChange={() => handleCheckboxChange("outros_quarto")}
                    />
                  }
                  label="Quarto"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_resort}
                      onChange={() => handleCheckboxChange("outros_resort")}
                    />
                  }
                  label="Resort"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_republica}
                      onChange={() => handleCheckboxChange("outros_republica")}
                    />
                  }
                  label="República"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_box}
                      onChange={() => handleCheckboxChange("outros_box")}
                    />
                  }
                  label="Box"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_tombado}
                      onChange={() => handleCheckboxChange("outros_tombado")}
                    />
                  }
                  label="Tombado"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_granja}
                      onChange={() => handleCheckboxChange("outros_granja")}
                    />
                  }
                  label="Granja"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_haras}
                      onChange={() => handleCheckboxChange("outros_haras")}
                    />
                  }
                  label="Haras"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.outros_outros}
                      onChange={() => handleCheckboxChange("outros_outros")}
                    />
                  }
                  label="Outros"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        </FormControl>

        {/* Seção Cômodos */}
        <FormControl component="fieldset" sx={{ mb: 4, width: "100%" }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Cômodos
          </FormLabel>

          {/* Quartos */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Quartos
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[1, 2, 3, 4].map((num) => {
                const isSelected = filters.quartos === (num === 4 ? 4 : num);
                return (
                  <Button
                    key={num}
                    onClick={() =>
                      handleComodoChange("quartos", num === 4 ? 4 : num)
                    }
                    sx={{
                      minWidth: 40,
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "primary.main",
                      backgroundColor: isSelected ? "primary.main" : "white",
                      color: isSelected ? "white" : "primary.main",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "primary.dark"
                          : "primary.light",
                      },
                    }}
                  >
                    {num === 4 ? "4+" : num.toString()}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Banheiros */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Banheiros
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[1, 2, 3, 4].map((num) => {
                const isSelected = filters.banheiros === (num === 4 ? 4 : num);
                return (
                  <Button
                    key={num}
                    onClick={() =>
                      handleComodoChange("banheiros", num === 4 ? 4 : num)
                    }
                    sx={{
                      minWidth: 40,
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "primary.main",
                      backgroundColor: isSelected ? "primary.main" : "white",
                      color: isSelected ? "white" : "primary.main",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "primary.dark"
                          : "primary.light",
                      },
                    }}
                  >
                    {num === 4 ? "4+" : num.toString()}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Suítes */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Suítes
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[1, 2, 3, 4].map((num) => {
                const isSelected = filters.suites === (num === 4 ? 4 : num);
                return (
                  <Button
                    key={num}
                    onClick={() =>
                      handleComodoChange("suites", num === 4 ? 4 : num)
                    }
                    sx={{
                      minWidth: 40,
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "primary.main",
                      backgroundColor: isSelected ? "primary.main" : "white",
                      color: isSelected ? "white" : "primary.main",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "primary.dark"
                          : "primary.light",
                      },
                    }}
                  >
                    {num === 4 ? "4+" : num.toString()}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Garagem */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Garagem
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[1, 2, 3, 4].map((num) => {
                const isSelected = filters.garagem === (num === 4 ? 4 : num);
                return (
                  <Button
                    key={num}
                    onClick={() =>
                      handleComodoChange("garagem", num === 4 ? 4 : num)
                    }
                    sx={{
                      minWidth: 40,
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "primary.main",
                      backgroundColor: isSelected ? "primary.main" : "white",
                      color: isSelected ? "white" : "primary.main",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "primary.dark"
                          : "primary.light",
                      },
                    }}
                  >
                    {num === 4 ? "4+" : num.toString()}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </FormControl>

        {/* Seção Sliders */}
        <FormControl component="fieldset" sx={{ mb: 4, width: "100%" }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Área e Preço
          </FormLabel>

          {/* Slider Área */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Área (m²)
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={areaRange}
                onChange={(_, newValue) =>
                  handleSliderChange("area", newValue as number[], setAreaRange)
                }
                valueLabelDisplay="auto"
                min={0}
                max={1000000}
                step={1000}
                valueLabelFormat={(value) => `${value.toLocaleString()} m²`}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Mínimo"
                  value={formatArea(areaRange[0])}
                  onChange={(e) => {
                    const unformattedValue = unformatArea(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(1000000, unformattedValue)
                    );
                    const newRange = [value, Math.max(value, areaRange[1])];
                    setAreaRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      area_min: newRange[0],
                      area_max: newRange[1],
                    }));
                  }}
                  onBlur={(e) => {
                    const unformattedValue = unformatArea(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(1000000, unformattedValue)
                    );
                    const newRange = [value, Math.max(value, areaRange[1])];
                    setAreaRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      area_min: newRange[0],
                      area_max: newRange[1],
                    }));
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                  inputProps={{
                    inputMode: "numeric",
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">m²</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Máximo"
                  value={formatArea(areaRange[1])}
                  onChange={(e) => {
                    const unformattedValue = unformatArea(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(1000000, unformattedValue)
                    );
                    const newRange = [Math.min(value, areaRange[0]), value];
                    setAreaRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      area_min: newRange[0],
                      area_max: newRange[1],
                    }));
                  }}
                  onBlur={(e) => {
                    const unformattedValue = unformatArea(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(1000000, unformattedValue)
                    );
                    const newRange = [Math.min(value, areaRange[0]), value];
                    setAreaRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      area_min: newRange[0],
                      area_max: newRange[1],
                    }));
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                  inputProps={{
                    inputMode: "numeric",
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">m²</InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Slider Preço */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Preço Total
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={precoRange}
                onChange={(_, newValue) =>
                  handleSliderChange(
                    "preco",
                    newValue as number[],
                    setPrecoRange
                  )
                }
                valueLabelDisplay="auto"
                min={0}
                max={100000000}
                step={10000}
                valueLabelFormat={(value) => `R$ ${value.toLocaleString()}`}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Mínimo"
                  value={formatPrice(precoRange[0])}
                  onChange={(e) => {
                    const unformattedValue = unformatPrice(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(100000000, unformattedValue)
                    );
                    const newRange = [value, Math.max(value, precoRange[1])];
                    setPrecoRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      preco_min: newRange[0],
                      preco_max: newRange[1],
                    }));
                  }}
                  onBlur={(e) => {
                    const unformattedValue = unformatPrice(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(100000000, unformattedValue)
                    );
                    const newRange = [value, Math.max(value, precoRange[1])];
                    setPrecoRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      preco_min: newRange[0],
                      preco_max: newRange[1],
                    }));
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                  inputProps={{
                    inputMode: "numeric",
                  }}
                />
                <TextField
                  label="Máximo"
                  value={formatPrice(precoRange[1])}
                  onChange={(e) => {
                    const unformattedValue = unformatPrice(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(100000000, unformattedValue)
                    );
                    const newRange = [Math.min(value, precoRange[0]), value];
                    setPrecoRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      preco_min: newRange[0],
                      preco_max: newRange[1],
                    }));
                  }}
                  onBlur={(e) => {
                    const unformattedValue = unformatPrice(e.target.value);
                    const value = Math.max(
                      0,
                      Math.min(100000000, unformattedValue)
                    );
                    const newRange = [Math.min(value, precoRange[0]), value];
                    setPrecoRange(newRange);
                    setFilters((prev) => ({
                      ...prev,
                      preco_min: newRange[0],
                      preco_max: newRange[1],
                    }));
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                  inputProps={{
                    inputMode: "numeric",
                  }}
                />
              </Box>
            </Box>
          </Box>
        </FormControl>

        {/* Seção Tipo de Anunciante */}
        <FormControl component="fieldset" sx={{ mb: 4, width: "100%" }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Tipo de Anunciante
          </FormLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.proprietario_direto}
                  onChange={() => handleCheckboxChange("proprietario_direto")}
                />
              }
              label="Proprietário Direto"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.imobiliaria}
                  onChange={() => handleCheckboxChange("imobiliaria")}
                />
              }
              label="Imobiliária"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.portal}
                  onChange={() => handleCheckboxChange("portal")}
                />
              }
              label="Portal"
            />
          </FormGroup>
        </FormControl>

        {/* Seção Opcionais */}
        <FormControl component="fieldset" sx={{ mb: 4, width: "100%" }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Opcionais
          </FormLabel>
          <FormGroup sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.lancamento}
                  onChange={() => handleCheckboxChange("lancamento")}
                />
              }
              label="Lançamento"
            />
          </FormGroup>
          <TextField
            label="Opcionais"
            placeholder="Digite opcionais para buscar"
            value={filters.palavras_chave}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                palavras_chave: e.target.value,
              }))
            }
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          />
        </FormControl>

        <Divider sx={{ my: 2 }} />

        {/* Botões de ação */}
        <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleClearFilters}
            sx={{
              flex: 1,
              borderColor: "divider",
              "&:hover": {
                borderColor: "text.primary",
                backgroundColor: "action.hover",
              },
            }}
          >
            Limpar
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyFilters}
            sx={{
              flex: 1,
              backgroundColor: "primary.main",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            Aplicar Filtros
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
