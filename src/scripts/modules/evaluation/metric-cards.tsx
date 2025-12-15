import { Box, Typography, useTheme } from "@mui/material";
import {
  Home,
  AttachMoney,
  SquareFoot,
  Star,
} from "@mui/icons-material";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, subtitle, icon }: MetricCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: "#E3F2FD",
        borderRadius: 3,
        p: 3,
        position: "relative",
        overflow: "hidden",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Ícone de fundo */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          opacity: 0.1,
          color: theme.palette.primary.main,
        }}
      >
        {icon}
      </Box>

      {/* Conteúdo */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.875rem",
            fontWeight: 500,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            fontSize: "1.75rem",
            mb: 1,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.8rem",
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

interface MetricCardsProps {
  appraisalValue: number;
  averagePricePerM2: number;
  averageTotalArea: number;
  averageTotalAreaRange: { min: number; max: number };
  bestDeal: number;
  bestDealPerM2: number;
  areaType?: "USABLE" | "TOTAL" | "BUILT";
}

export function MetricCards({
  appraisalValue,
  averagePricePerM2,
  averageTotalArea,
  averageTotalAreaRange,
  bestDeal,
  bestDealPerM2,
  areaType = "TOTAL",
}: MetricCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
        mb: 3,
      }}
    >
      <MetricCard
        title="Valor de Avaliação"
        value={formatCurrency(appraisalValue)}
        subtitle="Baseado em área total"
        icon={<Home sx={{ fontSize: 80 }} />}
      />
      <MetricCard
        title="Preço/m² médio"
        value={formatCurrency(averagePricePerM2)}
        subtitle={
          areaType === "USABLE"
            ? "Área útil"
            : areaType === "BUILT"
              ? "Área construída"
              : "Área total"
        }
        icon={<AttachMoney sx={{ fontSize: 80 }} />}
      />
      <MetricCard
        title="Área total média"
        value={`${averageTotalArea}m²`}
        subtitle={`${averageTotalAreaRange.min}m² - ${averageTotalAreaRange.max}m²`}
        icon={<SquareFoot sx={{ fontSize: 80 }} />}
      />
      <MetricCard
        title="Melhor Negócio"
        value={formatCurrency(bestDeal)}
        subtitle={`R$ ${bestDealPerM2}/m²`}
        icon={<Star sx={{ fontSize: 80 }} />}
      />
    </Box>
  );
}


