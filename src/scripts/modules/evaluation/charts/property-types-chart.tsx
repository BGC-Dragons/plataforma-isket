import { Box, Typography, useTheme } from "@mui/material";

interface PropertyTypeData {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface PropertyTypesChartProps {
  data: PropertyTypeData[];
}

export function PropertyTypesChart({ data }: PropertyTypesChartProps) {
  const theme = useTheme();

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barHeight = 40;
  const maxBarWidth = 300;

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
        Tipos de imóveis
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {data.map((item, index) => {
          const barWidth = (item.count / maxCount) * maxBarWidth;
          return (
            <Box key={index} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 100,
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                >
                  {item.type}
                </Typography>
                <Box
                  sx={{
                    width: barWidth,
                    height: barHeight,
                    backgroundColor: item.color,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    pr: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.getContrastText(item.color),
                    }}
                  >
                    {item.count} ({item.percentage}%)
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}


