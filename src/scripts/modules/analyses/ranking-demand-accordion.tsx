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
  loading?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

export function RankingDemandAccordion({
  data,
  loading = false,
  expanded = false,
  onChange,
}: RankingDemandAccordionProps) {
  const theme = useTheme();
  const navigate = useNavigate();

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
      <AccordionDetails sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : !data || data.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            Sem dados para o filtro selecionado
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.map((item, index) => (
              <Box
                key={item.neighborhood}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      minWidth: 40,
                    }}
                  >
                    {index + 1}.
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                    px: 3,
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

