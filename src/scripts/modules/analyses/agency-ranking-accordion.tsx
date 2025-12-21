import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { AgencyRankingTable } from "./tables/agency-ranking-table";
import type { IAgencyRankingItem } from "../../../services/post-analytics-agency-ranking.service";

interface AgencyRankingAccordionProps {
  data: IAgencyRankingItem[];
  neighborhoods: string[];
  loading?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

export function AgencyRankingAccordion({
  data,
  neighborhoods,
  loading = false,
  expanded = false,
  onChange,
}: AgencyRankingAccordionProps) {
  const theme = useTheme();

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
          Ranking de Imobiliárias
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <AgencyRankingTable data={data} neighborhoods={neighborhoods} />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

