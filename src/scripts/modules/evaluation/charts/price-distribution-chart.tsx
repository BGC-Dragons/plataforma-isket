import { Box, Typography, useTheme } from "@mui/material";

interface PriceRange {
  label: string;
  value: number;
}

interface PriceDistributionChartProps {
  data: PriceRange[];
}

export function PriceDistributionChart({
  data,
}: PriceDistributionChartProps) {
  const theme = useTheme();

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 200;
  const barWidth = 100;
  const spacing = 20;

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 1,
        }}
      >
        Distribuição de preços
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
        }}
      >
        Análise da faixa de valores dos imóveis
      </Typography>

      <Box
        sx={{
          position: "relative",
          height: chartHeight,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: spacing,
          px: 2,
        }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          return (
            <Box
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: barWidth,
                  height: barHeight,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: "4px 4px 0 0",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  color: theme.palette.text.secondary,
                  textAlign: "center",
                  maxWidth: barWidth + spacing,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Legenda */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mt: 2,
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: theme.palette.primary.main,
          }}
        />
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          Valor
        </Typography>
      </Box>
    </Box>
  );
}


