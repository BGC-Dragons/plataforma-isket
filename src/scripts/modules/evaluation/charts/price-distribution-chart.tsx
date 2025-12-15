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

  if (!data || data.length === 0) {
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
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.text.secondary,
          }}
        >
          <Typography variant="body2">
            Nenhum dado disponível para exibir
          </Typography>
        </Box>
      </Box>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalItems = data.reduce((sum, d) => sum + d.value, 0);

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

      {/* Gráfico de barras horizontais */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {data.map((item, index) => {
          const percentage = totalItems > 0 ? (item.value / totalItems) * 100 : 0;
          const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          
          return (
            <Box
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.75rem",
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.75rem",
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                  }}
                >
                  {item.value} {item.value === 1 ? "imóvel" : "imóveis"} ({Math.round(percentage)}%)
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  height: 32,
                  backgroundColor: theme.palette.grey[200],
                  borderRadius: 1,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${barWidth}%`,
                    height: "100%",
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 1,
                    transition: "width 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    pr: 1,
                    minWidth: item.value > 0 ? "40px" : "0",
                  }}
                >
                  {item.value > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.primary.contrastText,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    >
                      {item.value}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}


