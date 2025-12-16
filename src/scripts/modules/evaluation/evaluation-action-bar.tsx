import {
  Box,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Close,
  Description,
  PictureAsPdf,
  TableChart,
  InfoOutlined,
} from "@mui/icons-material";

interface EvaluationActionBarProps {
  selectedCount: number;
  calculationCriterion: string;
  onCalculationCriterionChange: (criterion: string) => void;
  onClearSelection: () => void;
  onAnalysisSummary: () => void;
  onGenerateReport: () => void;
  onExportExcel: () => void;
}

export function EvaluationActionBar({
  selectedCount,
  calculationCriterion,
  onCalculationCriterionChange,
  onClearSelection,
  onAnalysisSummary,
  onGenerateReport,
  onExportExcel,
}: EvaluationActionBarProps) {
  const theme = useTheme();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: theme.zIndex.appBar,
        width: "calc(100% - 32px)",
        maxWidth: 1400,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          px: 3,
          py: 2,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          gap: 3,
          flexWrap: "wrap",
          boxShadow: theme.shadows[8],
        }}
      >
        {/* Contador de selecionados */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, fontSize: "0.95rem" }}
          >
            {selectedCount} imóveis selecionados
          </Typography>
          <IconButton
            size="small"
            onClick={onClearSelection}
            sx={{
              color: theme.palette.primary.contrastText,
              p: 0.5,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Critério de cálculo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}
          >
            Critério de cálculo:
          </Typography>
          <FormControl
            size="small"
            sx={{
              minWidth: 150,
              "& .MuiOutlinedInput-root": {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                height: 32,
                "& fieldset": {
                  borderColor: theme.palette.divider,
                },
              },
            }}
          >
            <Select
              value={calculationCriterion}
              onChange={(e) => onCalculationCriterionChange(e.target.value)}
              displayEmpty
              sx={{
                fontSize: "0.9rem",
                "& .MuiSelect-select": {
                  py: 0.75,
                },
              }}
            >
              <MenuItem value="area-total">Área total</MenuItem>
              <MenuItem value="area-util">Área útil</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Informações sobre o critério de cálculo">
            <IconButton
              size="small"
              sx={{
                color: theme.palette.primary.contrastText,
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                },
              }}
            >
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Botões de ação */}
        <Box sx={{ display: "flex", gap: 1.5, ml: "auto" }}>
          <Button
            variant="contained"
            startIcon={<Description />}
            onClick={onAnalysisSummary}
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              px: 2,
              py: 0.75,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              "&:hover": {
                backgroundColor: theme.palette.grey[100],
                boxShadow: theme.shadows[4],
              },
            }}
          >
            Resumo da Análise
          </Button>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={onGenerateReport}
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              px: 2,
              py: 0.75,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              "&:hover": {
                backgroundColor: theme.palette.grey[100],
                boxShadow: theme.shadows[4],
              },
            }}
          >
            Gerar Relatório
          </Button>
          <Button
            variant="contained"
            startIcon={<TableChart />}
            onClick={onExportExcel}
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              px: 2,
              py: 0.75,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              "&:hover": {
                backgroundColor: theme.palette.grey[100],
                boxShadow: theme.shadows[4],
              },
            }}
          >
            Exportar Excel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
