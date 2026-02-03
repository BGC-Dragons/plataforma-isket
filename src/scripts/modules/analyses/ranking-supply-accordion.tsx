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
  Chip,
} from "@mui/material";
import { ExpandMore, Home } from "@mui/icons-material";

interface RankingSupplyAccordionProps {
  data: Array<{ neighborhood: string; count: number }>;
  selectedNeighborhoods?: string[];
  loading?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

export function RankingSupplyAccordion({
  data,
  selectedNeighborhoods = [],
  loading = false,
  expanded = false,
  onChange,
}: RankingSupplyAccordionProps) {
  const theme = useTheme();
  const navigate = useNavigate();

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

  const sortedData = [...filteredData].sort((a, b) => b.count - a.count);

  const totalSupply = sortedData.reduce((acc, item) => acc + item.count, 0);

  const handleViewClick = (neighborhood: string) => {
    const cleanNeighborhood = neighborhood.split("-")[0].trim();
    navigate("/pesquisar-anuncios", {
      state: {
        neighborhoodFilter: cleanNeighborhood,
      },
    });
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            pr: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Oferta por bairro
          </Typography>
          {!loading && totalSupply > 0 && (
            <Chip
              size="small"
              icon={<Home sx={{ fontSize: "1rem !important" }} />}
              label={`${formatCount(totalSupply)} imóveis`}
              sx={{
                backgroundColor: theme.palette.success.light,
                color: theme.palette.success.contrastText,
                fontWeight: 500,
              }}
            />
          )}
        </Box>
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
                      color: theme.palette.success.main,
                      minWidth: { xs: 25, sm: 30 },
                      flexShrink: 0,
                      fontSize: { xs: "0.9rem", sm: "1.25rem" },
                    }}
                  >
                    {index + 1}.
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {item.count.toLocaleString("pt-BR")} imóveis
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleViewClick(item.neighborhood)}
                  sx={{
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.main,
                    textTransform: "none",
                    fontWeight: 600,
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 1 },
                    flexShrink: 0,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    whiteSpace: "nowrap",
                    "&:hover": {
                      backgroundColor: theme.palette.success.light,
                      borderColor: theme.palette.success.main,
                    },
                  }}
                >
                  Ver imóveis
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
