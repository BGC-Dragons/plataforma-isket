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
} from "@mui/material";
import { Close, PictureAsPdf, ZoomIn, ZoomOut } from "@mui/icons-material";
import type { IPropertyAd } from "../../../../services/post-property-ad-search.service";
import {
  initializeReportData,
  calculateSummary,
  generatePDF,
  type ReportData,
  type ReportProperty,
} from "./report-generator";
import { mapCalculationCriterionToAreaType } from "./evaluation-helpers";

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
  const [activeTab, setActiveTab] = useState(0);
  const [zoom, setZoom] = useState(40);
  const [reportAreaType, setReportAreaType] = useState<"USABLE" | "TOTAL" | "BUILT">(
    mapCalculationCriterionToAreaType(calculationCriterion)
  );
  const [reportProperties, setReportProperties] = useState<ReportProperty[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    title: "",
    subtitle: "",
    description: "",
    author: "",
    date: new Date().toLocaleDateString("pt-BR"),
    properties: [],
    summary: {
      totalProperties: 0,
      averagePrice: 0,
      averagePricePerM2: 0,
      averageUsableArea: 0,
      averageTotalArea: 0,
      priceRange: { min: 0, max: 0 },
      areaRange: { min: 0, max: 0 },
    },
  });
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    author: "",
    date: new Date().toLocaleDateString("pt-BR"),
  });

  // Inicializa dados do relatório quando o modal abre ou propriedades mudam
  useEffect(() => {
    if (open && selectedProperties.length > 0) {
      const properties = initializeReportData(selectedProperties, reportAreaType);
      setReportProperties(properties);
      const summary = calculateSummary(properties, reportAreaType);
      setReportData((prev) => ({
        ...prev,
        properties,
        summary,
      }));
    }
  }, [open, selectedProperties, reportAreaType]);

  // Recalcula resumo quando área ou propriedades mudam
  useEffect(() => {
    if (reportProperties.length > 0) {
      const summary = calculateSummary(reportProperties, reportAreaType);
      setReportData((prev) => ({
        ...prev,
        summary,
      }));
    }
  }, [reportProperties, reportAreaType]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 20));
  };

  const handleClear = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      author: "",
      date: new Date().toLocaleDateString("pt-BR"),
    });
  };

  const handleGenerate = useCallback(() => {
    const finalReportData: ReportData = {
      ...reportData,
      ...formData,
    };

    const filename = `${(formData.title || "relatorio-avaliacao")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;

    generatePDF(finalReportData, filename);
  }, [reportData, formData]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        sx={{
          width: "90vw",
          maxWidth: 1400,
          maxHeight: "90vh",
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
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left Column - Form */}
          <Box
            sx={{
              width: "50%",
              borderRight: `1px solid ${theme.palette.divider}`,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                px: 2,
              }}
            >
              <Tab label="Geral" />
              <Tab label="Empresa" />
              <Tab label="Imóveis" />
              <Tab label="Análise" />
              <Tab label="Estilo" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Área</InputLabel>
                  <Select
                    value={reportAreaType}
                    label="Tipo de Área"
                    onChange={(e) =>
                      setReportAreaType(
                        e.target.value as "USABLE" | "TOTAL" | "BUILT"
                      )
                    }
                  >
                    <MenuItem value="TOTAL">Área Total</MenuItem>
                    <MenuItem value="USABLE">Área Útil</MenuItem>
                    <MenuItem value="BUILT">Área Construída</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Título do Relatório"
                  fullWidth
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
                <TextField
                  label="Subtítulo do Relatório"
                  fullWidth
                  value={formData.subtitle}
                  onChange={(e) =>
                    handleInputChange("subtitle", e.target.value)
                  }
                />
                <TextField
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
                <TextField
                  label="Autor"
                  fullWidth
                  value={formData.author}
                  onChange={(e) => handleInputChange("author", e.target.value)}
                />
                <TextField
                  label="Data"
                  fullWidth
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Typography>Conteúdo da aba Empresa</Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Typography>Conteúdo da aba Imóveis</Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Typography>Conteúdo da aba Análise</Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <Typography>Conteúdo da aba Estilo</Typography>
            </TabPanel>
          </Box>

          {/* Right Column - Preview */}
          <Box
            sx={{
              width: "50%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: theme.palette.grey[100],
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
                Preview do relatório
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="small" onClick={handleZoomOut}>
                  <ZoomOut />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{ minWidth: 50, textAlign: "center" }}
                >
                  {zoom}%
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
              }}
            >
              <Paper
                sx={{
                  width: `${zoom}%`,
                  minWidth: 400,
                  p: 4,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: theme.shadows[4],
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {formData.title || "Relatório de Avaliação Imobiliária"}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ mb: 3, color: theme.palette.text.secondary }}
                >
                  {formData.subtitle || "Análise Comparativa de Mercado"}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Autor: {formData.author || "Autor"}
                  </Typography>
                  <Typography variant="body2">Data: {formData.date}</Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Resumo Executivo
                </Typography>

                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.dark,
                    color: theme.palette.primary.contrastText,
                    p: 3,
                    borderRadius: 2,
                    mb: 3,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(reportData.summary.averagePrice)}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    VALOR DE AVALIAÇÃO
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Estimativa baseada em{" "}
                    {reportAreaType === "USABLE"
                      ? "área útil"
                      : reportAreaType === "BUILT"
                        ? "área construída"
                        : "área total"}{" "}
                    (
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(reportData.summary.averagePricePerM2)}
                    /m²)
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {reportData.summary.totalProperties} Imóveis avaliados
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(reportData.summary.averagePricePerM2)}{" "}
                      Preço médio/m²
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {reportData.summary.areaRange.min}m² -{" "}
                      {reportData.summary.areaRange.max}m² Faixa de área
                    </Typography>
                  </Paper>
                </Box>

                {formData.description && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {formData.description}
                  </Typography>
                )}
              </Paper>
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
          <Button onClick={handleClear} variant="contained">
            Limpar
          </Button>
          <Button
            onClick={handleGenerate}
            variant="contained"
            startIcon={<PictureAsPdf />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Gerar relatório
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}
