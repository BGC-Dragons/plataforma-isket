import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  IconButton,
  useTheme,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  useMediaQuery,
} from "@mui/material";
import {
  Close,
  PictureAsPdf,
  ZoomIn,
  ZoomOut,
  ExpandMore,
  ExpandLess,
  Edit,
  Visibility,
} from "@mui/icons-material";
import {
  createInitialReportData,
  calculateSummary,
  generatePDF,
  generateInitialAnalysis,
  formatCurrency,
  type ReportData,
} from "./report-generator";
import { mapCalculationCriterionToAreaType } from "./evaluation-helpers";
import { ReportTemplate } from "./report-template";
import type { IPropertyAd } from "../../../services/post-property-ad-search.service";

interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedProperties?: IPropertyAd[];
  calculationCriterion?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function GenerateReportModal({
  open,
  onClose,
  selectedCount,
  selectedProperties = [],
  calculationCriterion = "area-total",
}: GenerateReportModalProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery("(max-width: 1000px)");
  const [viewMode, setViewMode] = useState<"form" | "preview">("form");
  const [activeTab, setActiveTab] = useState(0);
  const [previewScale, setPreviewScale] = useState(0.6);
  const [reportAreaType, setReportAreaType] = useState<"USABLE" | "TOTAL">(
    mapCalculationCriterionToAreaType(calculationCriterion) === "BUILT"
      ? "TOTAL"
      : (mapCalculationCriterionToAreaType(calculationCriterion) as
          | "USABLE"
          | "TOTAL")
  );
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(
    new Set()
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Inicializa dados do relatório quando o modal abre
  useEffect(() => {
    if (open && selectedProperties.length > 0) {
      const initialData = createInitialReportData(
        selectedProperties,
        reportAreaType
      );
      // Gera análises iniciais
      initialData.analysis = generateInitialAnalysis(initialData);
      setReportData(initialData);
      // Expande imóveis incluídos por padrão
      const includedIds = initialData.properties
        .filter((p) => p.includeInReport)
        .map((p) => p.id);
      setExpandedProperties(new Set(includedIds));
    }
  }, [open, selectedProperties, reportAreaType]);

  // Recalcula resumo quando propriedades ou área mudam
  useEffect(() => {
    if (reportData) {
      const summary = calculateSummary(reportData.properties, reportAreaType);
      setReportData((prev) => (prev ? { ...prev, summary } : null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportData?.properties, reportAreaType]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const markAsDirty = useCallback(() => {
    if (reportData) {
      const summary = calculateSummary(reportData.properties, reportAreaType);
      setReportData((prev) => (prev ? { ...prev, summary } : null));
    }
  }, [reportData, reportAreaType]);

  const handleInputChange = (field: string, value: string) => {
    if (!reportData) return;
    setReportData((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
    markAsDirty();
  };

  const handleCompanyChange = (field: string, value: string) => {
    if (!reportData) return;
    setReportData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        company: { ...prev.company, [field]: value },
      };
    });
    markAsDirty();
  };

  const handleAnalysisChange = (field: string, value: string) => {
    if (!reportData) return;
    setReportData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        analysis: { ...prev.analysis, [field]: value },
      };
    });
    markAsDirty();
  };

  const handleStylingChange = (
    field: string,
    value: string | boolean | "left" | "center" | "right"
  ) => {
    if (!reportData) return;
    setReportData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        styling: { ...prev.styling, [field]: value },
      };
    });
    markAsDirty();
  };

  const handlePropertyChange = (
    propertyId: string,
    field: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ) => {
    if (!reportData) return;
    setReportData((prev) => {
      if (!prev) return null;
      const properties = prev.properties.map((prop) => {
        if (prop.id === propertyId) {
          const updated = { ...prop, [field]: value };

          // Recálculo automático de preços
          if (field === "price" && updated.price > 0) {
            if (updated.usableArea > 0) {
              updated.pricePerM2Usable = updated.price / updated.usableArea;
            }
            if (updated.totalArea > 0) {
              updated.pricePerM2Total = updated.price / updated.totalArea;
            }
          } else if (
            field === "pricePerM2Usable" &&
            updated.pricePerM2Usable > 0
          ) {
            if (updated.usableArea > 0) {
              updated.price = updated.pricePerM2Usable * updated.usableArea;
              if (updated.totalArea > 0) {
                updated.pricePerM2Total = updated.price / updated.totalArea;
              }
            }
          } else if (
            field === "pricePerM2Total" &&
            updated.pricePerM2Total > 0
          ) {
            if (updated.totalArea > 0) {
              updated.price = updated.pricePerM2Total * updated.totalArea;
              if (updated.usableArea > 0) {
                updated.pricePerM2Usable = updated.price / updated.usableArea;
              }
            }
          } else if (field === "usableArea" && updated.usableArea > 0) {
            if (updated.price > 0) {
              updated.pricePerM2Usable = updated.price / updated.usableArea;
            }
          } else if (field === "totalArea" && updated.totalArea > 0) {
            if (updated.price > 0) {
              updated.pricePerM2Total = updated.price / updated.totalArea;
            }
          }

          return updated;
        }
        return prop;
      });
      return { ...prev, properties };
    });
    markAsDirty();
  };

  const handlePropertyAddressChange = (
    propertyId: string,
    field: string,
    value: string
  ) => {
    if (!reportData) return;
    setReportData((prev) => {
      if (!prev) return null;
      const properties = prev.properties.map((prop) => {
        if (prop.id === propertyId) {
          return {
            ...prop,
            address: { ...prop.address, [field]: value },
          };
        }
        return prop;
      });
      return { ...prev, properties };
    });
    markAsDirty();
  };

  const handlePropertyFeaturesChange = (propertyId: string, value: string) => {
    if (!reportData) return;
    const features = value
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    handlePropertyChange(propertyId, "features", features);
  };

  const updatePropertyInclusion = (propertyId: string, included: boolean) => {
    if (!reportData) return;
    handlePropertyChange(propertyId, "includeInReport", included);
    if (included) {
      setExpandedProperties((prev) => new Set(prev).add(propertyId));
    } else {
      setExpandedProperties((prev) => {
        const newSet = new Set(prev);
        newSet.delete(propertyId);
        return newSet;
      });
    }
  };

  const togglePropertyExpansion = (propertyId: string) => {
    setExpandedProperties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const toggleAllProperties = () => {
    if (!reportData) return;
    const includedProperties = reportData.properties.filter(
      (p) => p.includeInReport
    );
    const allExpanded = includedProperties.every((p) =>
      expandedProperties.has(p.id)
    );

    if (allExpanded) {
      setExpandedProperties(new Set());
    } else {
      setExpandedProperties(new Set(includedProperties.map((p) => p.id)));
    }
  };

  const adjustPreviewScale = (delta: number) => {
    setPreviewScale((prev) => Math.max(0.3, Math.min(2.0, prev + delta)));
  };

  const handleZoomIn = () => adjustPreviewScale(0.1);
  const handleZoomOut = () => adjustPreviewScale(-0.1);

  const handleGenerate = useCallback(async () => {
    if (!reportData) return;

    const filename = `${(reportData.title || "relatorio-avaliacao")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;

    try {
      setIsGenerating(true);
      await generatePDF(reportData, filename);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      // Você pode adicionar uma notificação de erro aqui se desejar
    } finally {
      // Resetar após disparar print (não espera o usuário salvar)
      setTimeout(() => {
        setIsGenerating(false);
      }, 2000);
    }
  }, [reportData]);

  if (!reportData) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          height: "100%",
          width: "100%",
        }}
      >
        <Paper
        sx={{
          width: "95vw",
          maxWidth: 1600,
          maxHeight: "95vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Gerar relatório
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Você selecionou {selectedCount} imóveis. Preencha as informações
              que você deseja que constem no relatório.
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}
        >
          {/* Left Column - Form (40%) */}
          <Box
            sx={{
              width: isSmallScreen
                ? viewMode === "form"
                  ? "100%"
                  : 0
                : "40%",
              borderRight: isSmallScreen
                ? "none"
                : `1px solid ${theme.palette.divider}`,
              display:
                isSmallScreen && viewMode !== "form" ? "none" : "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: "width 0.3s ease",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                px: 2,
                minHeight: 48,
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Geral" />
              <Tab label="Empresa" />
              <Tab label="Imóveis" />
              <Tab label="Análise" />
              <Tab label="Estilo" />
            </Tabs>

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
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
              {/* Tab 0: Geral */}
              <TabPanel value={activeTab} index={0}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Área</InputLabel>
                    <Select
                      value={reportAreaType}
                      label="Tipo de Área"
                      onChange={(e) =>
                        setReportAreaType(e.target.value as "USABLE" | "TOTAL")
                      }
                    >
                      <MenuItem value="TOTAL">Área Total</MenuItem>
                      <MenuItem value="USABLE">Área Útil</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Título do Relatório"
                    fullWidth
                    placeholder="Ex: Relatório de Avaliação Imobiliária"
                    value={reportData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                  <TextField
                    label="Subtítulo"
                    fullWidth
                    placeholder="Ex: Análise Comparativa de Mercado"
                    value={reportData.subtitle}
                    onChange={(e) =>
                      handleInputChange("subtitle", e.target.value)
                    }
                  />
                  <TextField
                    label="Descrição"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Descreva o objetivo e escopo deste relatório..."
                    value={reportData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                  <TextField
                    label="Autor"
                    fullWidth
                    placeholder="Nome do responsável"
                    value={reportData.author}
                    onChange={(e) =>
                      handleInputChange("author", e.target.value)
                    }
                  />
                  <TextField
                    label="Data"
                    fullWidth
                    type="date"
                    value={reportData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </TabPanel>

              {/* Tab 1: Empresa */}
              <TabPanel value={activeTab} index={1}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Nome da Empresa"
                    fullWidth
                    placeholder="Nome da sua empresa"
                    value={reportData.company.name}
                    onChange={(e) =>
                      handleCompanyChange("name", e.target.value)
                    }
                  />
                  <TextField
                    label="Logo (URL)"
                    fullWidth
                    placeholder="https://exemplo.com/logo.png"
                    value={reportData.company.logo || ""}
                    onChange={(e) =>
                      handleCompanyChange("logo", e.target.value)
                    }
                  />
                  {reportData.company.logo && (
                    <Box
                      component="img"
                      src={reportData.company.logo}
                      alt="Logo preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                      sx={{
                        maxHeight: 64,
                        maxWidth: 200,
                        objectFit: "contain",
                        border: `1px solid ${theme.palette.divider}`,
                        p: 1,
                        borderRadius: 1,
                      }}
                    />
                  )}
                  <TextField
                    label="Endereço"
                    fullWidth
                    placeholder="Endereço completo da empresa"
                    value={reportData.company.address || ""}
                    onChange={(e) =>
                      handleCompanyChange("address", e.target.value)
                    }
                  />
                  <TextField
                    label="Telefone"
                    fullWidth
                    placeholder="(11) 99999-9999"
                    value={reportData.company.phone || ""}
                    onChange={(e) =>
                      handleCompanyChange("phone", e.target.value)
                    }
                  />
                  <TextField
                    label="E-mail"
                    fullWidth
                    type="email"
                    placeholder="contato@empresa.com"
                    value={reportData.company.email || ""}
                    onChange={(e) =>
                      handleCompanyChange("email", e.target.value)
                    }
                  />
                  <TextField
                    label="Website"
                    fullWidth
                    placeholder="www.empresa.com"
                    value={reportData.company.website || ""}
                    onChange={(e) =>
                      handleCompanyChange("website", e.target.value)
                    }
                  />
                </Box>
              </TabPanel>

              {/* Tab 2: Imóveis */}
              <TabPanel value={activeTab} index={2}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Imóveis ({reportData.properties.length})
                    </Typography>
                    <Button
                      size="small"
                      onClick={toggleAllProperties}
                      startIcon={
                        reportData.properties
                          .filter((p) => p.includeInReport)
                          .every((p) => expandedProperties.has(p.id)) ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )
                      }
                    >
                      {reportData.properties
                        .filter((p) => p.includeInReport)
                        .every((p) => expandedProperties.has(p.id))
                        ? "Recolher Todos"
                        : "Expandir Todos"}
                    </Button>
                  </Box>

                  {reportData.properties.map((property) => (
                    <Accordion
                      key={property.id}
                      expanded={expandedProperties.has(property.id)}
                      onChange={() => togglePropertyExpansion(property.id)}
                      disabled={!property.includeInReport}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            width: "100%",
                          }}
                        >
                          <Checkbox
                            checked={property.includeInReport}
                            onChange={(e) => {
                              e.stopPropagation();
                              updatePropertyInclusion(
                                property.id,
                                e.target.checked
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              {property.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {property.address.neighborhood},{" "}
                              {property.address.city}
                            </Typography>
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: "primary.main" }}
                          >
                            {formatCurrency(property.price)}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <TextField
                            label="Título"
                            fullWidth
                            size="small"
                            value={property.title}
                            onChange={(e) =>
                              handlePropertyChange(
                                property.id,
                                "title",
                                e.target.value
                              )
                            }
                          />
                          <TextField
                            label="Tipo"
                            fullWidth
                            size="small"
                            value={property.propertyType}
                            onChange={(e) =>
                              handlePropertyChange(
                                property.id,
                                "propertyType",
                                e.target.value
                              )
                            }
                          />
                          <TextField
                            label="Descrição"
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            value={property.description}
                            onChange={(e) =>
                              handlePropertyChange(
                                property.id,
                                "description",
                                e.target.value
                              )
                            }
                          />
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 2,
                            }}
                          >
                            <TextField
                              label="Preço Total"
                              type="number"
                              size="small"
                              inputProps={{ step: 1000 }}
                              value={property.price}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                            <TextField
                              label="Preço/m² Útil"
                              type="number"
                              size="small"
                              inputProps={{ step: 100 }}
                              value={property.pricePerM2Usable}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "pricePerM2Usable",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                            <TextField
                              label="Preço/m² Total"
                              type="number"
                              size="small"
                              inputProps={{ step: 100 }}
                              value={property.pricePerM2Total}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "pricePerM2Total",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 2,
                            }}
                          >
                            <TextField
                              label="Área Útil (m²)"
                              type="number"
                              size="small"
                              inputProps={{ step: 1 }}
                              value={property.usableArea}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "usableArea",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                            <TextField
                              label="Área Total (m²)"
                              type="number"
                              size="small"
                              inputProps={{ step: 1 }}
                              value={property.totalArea}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "totalArea",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: 2,
                            }}
                          >
                            <TextField
                              label="Quartos"
                              type="number"
                              size="small"
                              inputProps={{ min: 0, max: 20 }}
                              value={property.rooms}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "rooms",
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                            <TextField
                              label="Banheiros"
                              type="number"
                              size="small"
                              inputProps={{ min: 0, max: 20 }}
                              value={property.bathrooms}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "bathrooms",
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                            <TextField
                              label="Vagas"
                              type="number"
                              size="small"
                              inputProps={{ min: 0, max: 20 }}
                              value={property.parking}
                              onChange={(e) =>
                                handlePropertyChange(
                                  property.id,
                                  "parking",
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </Box>
                          <Divider />
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            Endereço Completo
                          </Typography>
                          <TextField
                            label="Rua/Logradouro"
                            fullWidth
                            size="small"
                            value={property.address.street}
                            onChange={(e) =>
                              handlePropertyAddressChange(
                                property.id,
                                "street",
                                e.target.value
                              )
                            }
                          />
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 2,
                            }}
                          >
                            <TextField
                              label="Bairro"
                              size="small"
                              value={property.address.neighborhood}
                              onChange={(e) =>
                                handlePropertyAddressChange(
                                  property.id,
                                  "neighborhood",
                                  e.target.value
                                )
                              }
                            />
                            <TextField
                              label="Cidade"
                              size="small"
                              value={property.address.city}
                              onChange={(e) =>
                                handlePropertyAddressChange(
                                  property.id,
                                  "city",
                                  e.target.value
                                )
                              }
                            />
                          </Box>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 2,
                            }}
                          >
                            <TextField
                              label="Estado"
                              size="small"
                              inputProps={{ maxLength: 2 }}
                              value={property.address.state}
                              onChange={(e) =>
                                handlePropertyAddressChange(
                                  property.id,
                                  "state",
                                  e.target.value.toUpperCase()
                                )
                              }
                            />
                            <TextField
                              label="CEP"
                              size="small"
                              inputProps={{ maxLength: 9 }}
                              value={property.address.postalCode}
                              onChange={(e) =>
                                handlePropertyAddressChange(
                                  property.id,
                                  "postalCode",
                                  e.target.value
                                )
                              }
                            />
                          </Box>
                          <Divider />
                          <TextField
                            label="Características (separadas por vírgula)"
                            fullWidth
                            size="small"
                            placeholder="Piscina, Academia, Churrasqueira, Varanda"
                            value={property.features.join(", ")}
                            onChange={(e) =>
                              handlePropertyFeaturesChange(
                                property.id,
                                e.target.value
                              )
                            }
                          />
                          <TextField
                            label="Observações Específicas"
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            placeholder="Observações específicas deste imóvel para o relatório"
                            value={property.customNotes}
                            onChange={(e) =>
                              handlePropertyChange(
                                property.id,
                                "customNotes",
                                e.target.value
                              )
                            }
                          />
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </TabPanel>

              {/* Tab 3: Análise */}
              <TabPanel value={activeTab} index={3}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    label="Visão Geral do Mercado"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Descreva a situação atual do mercado imobiliário..."
                    value={reportData.analysis.marketOverview}
                    onChange={(e) =>
                      handleAnalysisChange("marketOverview", e.target.value)
                    }
                  />
                  <TextField
                    label="Análise de Preços"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Análise detalhada dos preços encontrados..."
                    value={reportData.analysis.priceAnalysis}
                    onChange={(e) =>
                      handleAnalysisChange("priceAnalysis", e.target.value)
                    }
                  />
                  <TextField
                    label="Análise de Localização"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Análise das localizações dos imóveis..."
                    value={reportData.analysis.locationAnalysis}
                    onChange={(e) =>
                      handleAnalysisChange("locationAnalysis", e.target.value)
                    }
                  />
                  <TextField
                    label="Recomendações"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Suas recomendações baseadas na análise..."
                    value={reportData.analysis.recommendations}
                    onChange={(e) =>
                      handleAnalysisChange("recommendations", e.target.value)
                    }
                  />
                  <TextField
                    label="Conclusão"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Conclusão final do relatório..."
                    value={reportData.analysis.conclusion}
                    onChange={(e) =>
                      handleAnalysisChange("conclusion", e.target.value)
                    }
                  />
                </Box>
              </TabPanel>

              {/* Tab 4: Estilo */}
              <TabPanel value={activeTab} index={4}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Cor Primária
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <input
                        type="color"
                        value={reportData.styling.primaryColor}
                        onChange={(e) =>
                          handleStylingChange("primaryColor", e.target.value)
                        }
                        style={{
                          width: 60,
                          height: 40,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      />
                      <TextField
                        size="small"
                        value={reportData.styling.primaryColor}
                        onChange={(e) =>
                          handleStylingChange("primaryColor", e.target.value)
                        }
                        placeholder="#262353"
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Cor Secundária
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <input
                        type="color"
                        value={reportData.styling.secondaryColor}
                        onChange={(e) =>
                          handleStylingChange("secondaryColor", e.target.value)
                        }
                        style={{
                          width: 60,
                          height: 40,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      />
                      <TextField
                        size="small"
                        value={reportData.styling.secondaryColor}
                        onChange={(e) =>
                          handleStylingChange("secondaryColor", e.target.value)
                        }
                        placeholder="#dee6e8"
                      />
                    </Box>
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel>Fonte</InputLabel>
                    <Select
                      value={reportData.styling.fontFamily}
                      label="Fonte"
                      onChange={(e) =>
                        handleStylingChange("fontFamily", e.target.value)
                      }
                    >
                      <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                      <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
                      <MenuItem value="'Open Sans', sans-serif">
                        Open Sans
                      </MenuItem>
                      <MenuItem value="'Montserrat', sans-serif">
                        Montserrat
                      </MenuItem>
                      <MenuItem value="'Poppins', sans-serif">Poppins</MenuItem>
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Posição do Logo
                    </Typography>
                    <ToggleButtonGroup
                      value={reportData.styling.logoPosition}
                      exclusive
                      onChange={(_, value) => {
                        if (value) handleStylingChange("logoPosition", value);
                      }}
                      fullWidth
                    >
                      <ToggleButton value="left">Esquerda</ToggleButton>
                      <ToggleButton value="center">Centro</ToggleButton>
                      <ToggleButton value="right">Direita</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportData.styling.showCompanyInfo}
                        onChange={(e) =>
                          handleStylingChange(
                            "showCompanyInfo",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Mostrar Informações da Empresa"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportData.styling.showAnalysis}
                        onChange={(e) =>
                          handleStylingChange("showAnalysis", e.target.checked)
                        }
                      />
                    }
                    label="Mostrar Análise de Mercado"
                  />
                </Box>
              </TabPanel>
            </Box>
          </Box>

          {/* Right Column - Preview (60%) */}
          <Box
            sx={{
              width: isSmallScreen
                ? viewMode === "preview"
                  ? "100%"
                  : 0
                : "60%",
              display:
                isSmallScreen && viewMode !== "preview" ? "none" : "flex",
              flexDirection: "column",
              backgroundColor: theme.palette.grey[100],
              transition: "width 0.3s ease",
            }}
          >
            {/* Preview Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Preview do Relatório
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="small" onClick={handleZoomOut}>
                  <ZoomOut />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{ minWidth: 60, textAlign: "center" }}
                >
                  {Math.round(previewScale * 100)}%
                </Typography>
                <IconButton size="small" onClick={handleZoomIn}>
                  <ZoomIn />
                </IconButton>
              </Box>
            </Box>

            {/* Preview Content */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 3,
                display: "flex",
                justifyContent: "center",
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
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s",
                }}
              >
                <ReportTemplate reportData={reportData} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            p: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button onClick={onClose} variant="contained">
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            variant="contained"
            disabled={isGenerating}
            startIcon={
              <PictureAsPdf
                sx={{
                  animation: isGenerating ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            }
            sx={{
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
              "&:disabled": {
                opacity: 0.6,
              },
            }}
          >
            {isGenerating ? "Gerando..." : "Exportar PDF"}
          </Button>
        </Box>
      </Paper>

      {/* Botões flutuantes de toggle - apenas em telas pequenas */}
      {isSmallScreen && viewMode === "form" && (
        <IconButton
          onClick={() => setViewMode("preview")}
          aria-label="Ver preview do relatório"
          sx={{
            position: "fixed",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: theme.zIndex.modal + 1,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[8],
            "&:hover": {
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[12],
            },
            width: 48,
            height: 48,
          }}
        >
          <Visibility />
        </IconButton>
      )}

      {isSmallScreen && viewMode === "preview" && (
        <IconButton
          onClick={() => setViewMode("form")}
          aria-label="Editar dados do relatório"
          sx={{
            position: "fixed",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: theme.zIndex.modal + 1,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[8],
            "&:hover": {
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[12],
            },
            width: 48,
            height: 48,
          }}
        >
          <Edit />
        </IconButton>
      )}
      </Box>
    </Modal>
  );
}
