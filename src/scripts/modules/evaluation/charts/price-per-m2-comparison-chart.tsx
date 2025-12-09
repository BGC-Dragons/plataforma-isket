import { Box, Typography, useTheme } from "@mui/material";

interface PricePerM2Data {
  label: string;
  value: number;
}

interface PricePerM2ComparisonChartProps {
  data: PricePerM2Data[];
}

export function PricePerM2ComparisonChart({
  data,
}: PricePerM2ComparisonChartProps) {
  const theme = useTheme();

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 200;
  const barWidth = 80;
  const spacing = 15;

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
        Análise Comparativa de Preço/m²
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
        }}
      >
        Comparação dos valores por metro quadrado
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
    </Box>
  );
}
