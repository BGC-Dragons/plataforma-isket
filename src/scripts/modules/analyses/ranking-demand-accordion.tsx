import { useNavigate } from "react-router";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import type { ISearchDemandNeighborhoodRankingItem } from "../../../services/post-analytics-search-demand-neighborhood-ranking.service";

interface RankingDemandAccordionProps {
  data: ISearchDemandNeighborhoodRankingItem[];
  selectedNeighborhoods?: string[]; // Bairros selecionados no filtro
  loading?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

export function RankingDemandAccordion({
  data,
  selectedNeighborhoods = [],
  loading = false,
  expanded = false,
  onChange,
}: RankingDemandAccordionProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  // Filtrar dados para mostrar apenas bairros selecionados (ou todos se nenhum selecionado)
  // Usar comparação case-insensitive e trim para garantir matching correto
  const normalizeName = (name: string) => name.trim().toLowerCase();

  const filteredData =
    selectedNeighborhoods.length > 0
      ? data.filter((item) => {
          const normalizedItemName = normalizeName(item.neighborhood);
          return selectedNeighborhoods.some(
            (selected) => normalizeName(selected) === normalizedItemName
          );
        })
      : data;

  // Ordenar por count (maior para menor)
  const sortedData = [...filteredData].sort((a, b) => b.count - a.count);

  const handleCaptureClick = (neighborhood: string) => {
    // Remove sufixos após hífen se houver
    const cleanNeighborhood = neighborhood.split("-")[0].trim();

    // Navega para a página de busca com o filtro de bairro
    navigate("/pesquisar-anuncios", {
      state: {
        neighborhoodFilter: cleanNeighborhood,
      },
    });
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onChange?.(isExpanded)}
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        "&:before": {
          display: "none",
        },
        "&.Mui-expanded": {
          margin: "0 0 16px 0",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          backgroundColor: theme.palette.grey[50],
          borderRadius: expanded ? "8px 8px 0 0" : "8px",
          "&:hover": {
            backgroundColor: theme.palette.grey[100],
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Ranking de procura por região
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          p: { xs: 2, sm: 3 },
          overflowX: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : !sortedData || sortedData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            Sem dados para o filtro selecionado
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 2,
              minWidth: 0,
            }}
          >
            {sortedData.map((item, index) => (
              <Box
                key={item.neighborhood}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  gap: { xs: 1, sm: 2 },
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      minWidth: { xs: 25, sm: 30 },
                      flexShrink: 0,
                      fontSize: { xs: "0.9rem", sm: "1.25rem" },
                    }}
                  >
                    {index + 1}.
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    {item.neighborhood}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleCaptureClick(item.neighborhood)}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    textTransform: "none",
                    fontWeight: 600,
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 1 },
                    flexShrink: 0,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    whiteSpace: "nowrap",
                    "&:hover": {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  Captar na região
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
