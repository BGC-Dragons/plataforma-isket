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
import { SupplyByTypeChart } from "./charts/supply-by-type-chart";
import type { ISupplyByPropertyTypeItem } from "../../../services/post-analytics-supply-by-property-type.service";

interface SupplyByTypeAccordionProps {
  data: ISupplyByPropertyTypeItem[];
  loading?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
}

export function SupplyByTypeAccordion({
  data,
  loading = false,
  expanded = false,
  onChange,
}: SupplyByTypeAccordionProps) {
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
          Oferta por tipo de imóvel
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          p: { xs: 2, sm: 3 },
          overflowX: "hidden",
          overflowY: "visible",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <SupplyByTypeChart data={data} />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

