import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  Paper,
} from "@mui/material";
import { Close, ArrowBack } from "@mui/icons-material";
import { MetricCards } from "./metric-cards";
import { PriceDistributionChart } from "./charts/price-distribution-chart";
import { PropertyTypesChart } from "./charts/property-types-chart";
import { PricePerM2ComparisonChart } from "./charts/price-per-m2-comparison-chart";

interface AnalysisSummaryDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  // Mock data props
  appraisalValue?: number;
  averagePricePerM2?: number;
  averageTotalArea?: number;
  averageTotalAreaRange?: { min: number; max: number };
  bestDeal?: number;
  bestDealPerM2?: number;
  priceDistributionData?: Array<{ label: string; value: number }>;
  propertyTypesData?: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  pricePerM2Data?: Array<{ label: string; value: number }>;
  areaType?: "USABLE" | "TOTAL" | "BUILT";
}

export function AnalysisSummaryDrawer({
  open,
  onClose,
  selectedCount,
  appraisalValue = 177735,
  averagePricePerM2 = 255,
  averageTotalArea = 697,
  averageTotalAreaRange = { min: 414, max: 979 },
  bestDeal = 420,
  bestDealPerM2 = 1,
  priceDistributionData = [
    { label: "R$ 400 - R$ 99.9", value: 1 },
    { label: "R$ 199.452 - R$ 206.268", value: 0 },
    { label: "R$ 200.000 - R$ 400.000", value: 1 },
  ],
  propertyTypesData = [
    { type: "Casa", count: 1, percentage: 20, color: "#2196F3" },
    { type: "Studio", count: 1, percentage: 20, color: "#4CAF50" },
    { type: "Apartamento", count: 2, percentage: 40, color: "#FFC107" },
    { type: "Loja", count: 1, percentage: 20, color: "#9C27B0" },
  ],
  pricePerM2Data = [{ label: "R$ 400 - R$ 99.9", value: 1 }],
  areaType = "TOTAL",
}: AnalysisSummaryDrawerProps) {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: "80%", md: "60%", lg: "50%" },
          maxWidth: 900,
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={onClose}
              sx={{ color: theme.palette.text.primary }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                Dashboard: Resumo da Análise
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Análise completa de {selectedCount} imóveis selecionados
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
          }}
        >
          {/* Metric Cards */}
          <MetricCards
            appraisalValue={appraisalValue}
            averagePricePerM2={averagePricePerM2}
            averageTotalArea={averageTotalArea}
            averageTotalAreaRange={averageTotalAreaRange}
            bestDeal={bestDeal}
            bestDealPerM2={bestDealPerM2}
            areaType={areaType}
          />

          {/* Charts */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Price Distribution Chart */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: theme.shadows[2],
              }}
            >
              <PriceDistributionChart data={priceDistributionData} />
            </Paper>

            {/* Property Types Chart */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: theme.shadows[2],
              }}
            >
              <PropertyTypesChart data={propertyTypesData} />
            </Paper>

            {/* Price per m² Comparison Chart */}
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: theme.shadows[2],
              }}
            >
              <PricePerM2ComparisonChart data={pricePerM2Data} />
            </Paper>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
