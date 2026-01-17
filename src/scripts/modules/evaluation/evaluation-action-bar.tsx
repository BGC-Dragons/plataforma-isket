import { useEffect, useState } from "react";
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
  useMediaQuery,
} from "@mui/material";
import {
  Close,
  Description,
  PictureAsPdf,
  TableChart,
  InfoOutlined,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

export interface EvaluationActionBarProps {
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
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const isCollapsible = isXs || isMediumScreen;
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(isXs);
  }, [isXs]);

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
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2 },
          borderRadius: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 2, sm: 3 },
          flexWrap: "wrap",
          boxShadow: theme.shadows[8],
        }}
      >
        {isMediumScreen ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                gap: 2,
              }}
            >
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {!isCollapsed && (
                  <>
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
                        onChange={(e) =>
                          onCalculationCriterionChange(e.target.value)
                        }
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
                  </>
                )}
                {isCollapsible && (
                  <IconButton
                    size="small"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    aria-label={
                      isCollapsed
                        ? "Expandir selecionados"
                        : "Colapsar selecionados"
                    }
                    sx={{
                      color: theme.palette.primary.contrastText,
                      p: 0.5,
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                      },
                    }}
                  >
                    {isCollapsed ? (
                      <ExpandMore fontSize="small" />
                    ) : (
                      <ExpandLess fontSize="small" />
                    )}
                  </IconButton>
                )}
              </Box>
            </Box>
            {!isCollapsed && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  width: "100%",
                }}
              >
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
                    flex: 1,
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
                    flex: 1,
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
                    flex: 1,
                    "&:hover": {
                      backgroundColor: theme.palette.grey[100],
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  Exportar Excel
                </Button>
              </Box>
            )}
          </>
        ) : (
          <>
            {/* Contador de selecionados */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                position: "relative",
                pr: isXs ? 3 : 0,
              }}
            >
              {isXs && (
                <IconButton
                  size="small"
                  onClick={() => setIsCollapsed((prev) => !prev)}
                  aria-label={
                    isCollapsed
                      ? "Expandir selecionados"
                      : "Colapsar selecionados"
                  }
                  sx={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    color: theme.palette.primary.contrastText,
                    p: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    },
                  }}
                >
                  {isCollapsed ? (
                    <ExpandMore fontSize="small" />
                  ) : (
                    <ExpandLess fontSize="small" />
                  )}
                </IconButton>
              )}
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

            {(!isCollapsible || !isCollapsed) && (
              <>
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
                      onChange={(e) =>
                        onCalculationCriterionChange(e.target.value)
                      }
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
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 1, sm: 1.5 },
                    width: { xs: "100%", sm: "auto" },
                    ml: { xs: 0, sm: "auto" },
                  }}
                >
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
                      width: { xs: "100%", sm: "auto" },
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
                      width: { xs: "100%", sm: "auto" },
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
                      width: { xs: "100%", sm: "auto" },
                      "&:hover": {
                        backgroundColor: theme.palette.grey[100],
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    Exportar Excel
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
