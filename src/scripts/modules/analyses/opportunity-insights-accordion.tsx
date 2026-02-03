import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  useTheme,
  CircularProgress,
  Chip,
} from "@mui/material";
import { ExpandMore, Circle } from "@mui/icons-material";
import { useMemo } from "react";

interface OpportunityData {
  neighborhood: string;
  demandCount: number;
  supplyCount: number;
  ratio: number;
  opportunity: "high" | "medium" | "low";
}

interface OpportunityInsightsAccordionProps {
  demandData: Array<{ neighborhood: string; count: number }>;
  supplyData: Array<{ neighborhood: string; count: number }>;
  loading?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

const normalizeNeighborhood = (name: string): string => {
  // Remove " - CIDADE" suffix if present and normalize
  return name.split(" - ")[0].trim().toUpperCase();
};

const calculateOpportunities = (
  demandData: Array<{ neighborhood: string; count: number }>,
  supplyData: Array<{ neighborhood: string; count: number }>
): OpportunityData[] => {
  const merged = new Map<
    string,
    { demand: number; supply: number; originalName: string }
  >();

  // Process demand data
  demandData.forEach((d) => {
    const normalized = normalizeNeighborhood(d.neighborhood);
    const existing = merged.get(normalized);
    if (existing) {
      existing.demand += d.count;
    } else {
      merged.set(normalized, {
        demand: d.count,
        supply: 0,
        originalName: d.neighborhood,
      });
    }
  });

  // Process supply data
  supplyData.forEach((s) => {
    const normalized = normalizeNeighborhood(s.neighborhood);
    const existing = merged.get(normalized);
    if (existing) {
      existing.supply += s.count;
    } else {
      merged.set(normalized, {
        demand: 0,
        supply: s.count,
        originalName: s.neighborhood,
      });
    }
  });

  // Calculate ratios and classify
  const result: OpportunityData[] = [];

  merged.forEach(({ demand, supply, originalName }) => {
    // Only include neighborhoods that have both demand and supply data
    // or have significant demand without supply (high opportunity)
    if (demand === 0 && supply === 0) return;

    let ratio: number;
    let opportunity: "high" | "medium" | "low";

    if (supply === 0 && demand > 0) {
      ratio = Infinity;
      opportunity = "high";
    } else if (demand === 0) {
      ratio = 0;
      opportunity = "low";
    } else {
      ratio = demand / supply;
      if (ratio > 2) {
        opportunity = "high";
      } else if (ratio >= 0.5) {
        opportunity = "medium";
      } else {
        opportunity = "low";
      }
    }

    result.push({
      neighborhood: originalName,
      demandCount: demand,
      supplyCount: supply,
      ratio,
      opportunity,
    });
  });

  // Sort by opportunity level (high first), then by ratio
  return result.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff =
      priorityOrder[a.opportunity] - priorityOrder[b.opportunity];
    if (priorityDiff !== 0) return priorityDiff;

    // Within same priority, sort by ratio (higher ratio = more opportunity)
    if (a.ratio === Infinity && b.ratio === Infinity)
      return b.demandCount - a.demandCount;
    if (a.ratio === Infinity) return -1;
    if (b.ratio === Infinity) return 1;
    return b.ratio - a.ratio;
  });
};

const getOpportunityColor = (
  opportunity: "high" | "medium" | "low"
): string => {
  switch (opportunity) {
    case "high":
      return "#4caf50"; // Green
    case "medium":
      return "#ff9800"; // Orange
    case "low":
      return "#f44336"; // Red
  }
};

export function OpportunityInsightsAccordion({
  demandData,
  supplyData,
  loading = false,
  expanded = true,
  onChange,
}: OpportunityInsightsAccordionProps) {
  const theme = useTheme();

  const opportunities = useMemo(
    () => calculateOpportunities(demandData, supplyData),
    [demandData, supplyData]
  );

  const highOpportunities = opportunities.filter(
    (o) => o.opportunity === "high"
  );
  const mediumOpportunities = opportunities.filter(
    (o) => o.opportunity === "medium"
  );
  const lowOpportunities = opportunities.filter((o) => o.opportunity === "low");

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => onChange?.(isExpanded)}
      sx={{
        borderRadius: "8px !important",
        "&:before": { display: "none" },
        boxShadow: theme.shadows[1],
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: expanded ? "8px 8px 0 0" : "8px",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Oportunidades de Captação
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          backgroundColor: theme.palette.background.default,
          borderRadius: "0 0 8px 8px",
          p: 2,
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : opportunities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Selecione filtros para ver as oportunidades
          </Typography>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Regiões com alta demanda e baixa oferta são ótimas oportunidades
              para captação de imóveis.
            </Typography>

            {/* High Opportunities */}
            {highOpportunities.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: getOpportunityColor("high"),
                    fontWeight: 600,
                  }}
                >
                  Alta Oportunidade ({highOpportunities.length})
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 1,
                  }}
                >
                  {highOpportunities.slice(0, 10).map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        backgroundColor: "rgba(76, 175, 80, 0.08)",
                        borderRadius: 1,
                        border: `1px solid rgba(76, 175, 80, 0.2)`,
                      }}
                    >
                      <Circle
                        sx={{
                          fontSize: 8,
                          color: getOpportunityColor("high"),
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.neighborhood.split(" - ")[0]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.demandCount} buscas • {item.supplyCount} imóveis
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Medium Opportunities */}
            {mediumOpportunities.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: getOpportunityColor("medium"),
                    fontWeight: 600,
                  }}
                >
                  Mercado Equilibrado ({mediumOpportunities.length})
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 1,
                  }}
                >
                  {mediumOpportunities.slice(0, 6).map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        backgroundColor: "rgba(255, 152, 0, 0.08)",
                        borderRadius: 1,
                        border: `1px solid rgba(255, 152, 0, 0.2)`,
                      }}
                    >
                      <Circle
                        sx={{
                          fontSize: 8,
                          color: getOpportunityColor("medium"),
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.neighborhood.split(" - ")[0]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.demandCount} buscas • {item.supplyCount} imóveis
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Low Opportunities */}
            {lowOpportunities.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: getOpportunityColor("low"),
                    fontWeight: 600,
                  }}
                >
                  Mercado Saturado ({lowOpportunities.length})
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 1,
                  }}
                >
                  {lowOpportunities.slice(0, 4).map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        backgroundColor: "rgba(244, 67, 54, 0.08)",
                        borderRadius: 1,
                        border: `1px solid rgba(244, 67, 54, 0.2)`,
                      }}
                    >
                      <Circle
                        sx={{
                          fontSize: 8,
                          color: getOpportunityColor("low"),
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.neighborhood.split(" - ")[0]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.demandCount} buscas • {item.supplyCount} imóveis
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Legend */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                flexWrap: "wrap",
              }}
            >
              <Chip
                size="small"
                icon={
                  <Circle
                    sx={{
                      fontSize: "8px !important",
                      color: getOpportunityColor("high"),
                    }}
                  />
                }
                label="Alta demanda, baixa oferta"
                variant="outlined"
                sx={{ borderColor: getOpportunityColor("high") }}
              />
              <Chip
                size="small"
                icon={
                  <Circle
                    sx={{
                      fontSize: "8px !important",
                      color: getOpportunityColor("medium"),
                    }}
                  />
                }
                label="Demanda equilibrada"
                variant="outlined"
                sx={{ borderColor: getOpportunityColor("medium") }}
              />
              <Chip
                size="small"
                icon={
                  <Circle
                    sx={{
                      fontSize: "8px !important",
                      color: getOpportunityColor("low"),
                    }}
                  />
                }
                label="Muita oferta, pouca demanda"
                variant="outlined"
                sx={{ borderColor: getOpportunityColor("low") }}
              />
            </Box>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
