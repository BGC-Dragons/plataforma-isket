import { Box, Typography, useTheme } from "@mui/material";
import { translatePropertyType } from "../../evaluation/evaluation-helpers";

interface SupplyByTypeData {
  propertyType: string;
  count: number;
}

interface SupplyByTypeChartProps {
  data: SupplyByTypeData[];
}

export function SupplyByTypeChart({ data }: SupplyByTypeChartProps) {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Sem dados para exibir
        </Typography>
      </Box>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const maxBarHeight = 200; // Altura máxima das barras em pixels

  // Ordenar por count (maior para menor)
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          height: maxBarHeight + 80, // Altura total incluindo espaço para labels
          px: 2,
        }}
      >
        {sortedData.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          const barHeight = (percentage / 100) * maxBarHeight; // Altura baseada na porcentagem
          const translatedType = translatePropertyType(item.propertyType);

          return (
            <Box
              key={item.propertyType}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                gap: 1,
              }}
            >
              {/* Barra vertical */}
              <Box
                sx={{
                  width: "100%",
                  height: barHeight,
                  minHeight: barHeight > 0 ? 4 : 0, // Mínimo de 4px se houver valor
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: "4px 4px 0 0",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  pb: 0.5,
                  position: "relative",
                }}
              >
                {/* Valor dentro da barra (se houver espaço) */}
                {barHeight > 30 && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.contrastText,
                      fontSize: "0.75rem",
                    }}
                  >
                    {item.count}
                  </Typography>
                )}
              </Box>

              {/* Label do tipo e porcentagem */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  width: "100%",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    textAlign: "center",
                    fontSize: "0.7rem",
                    lineHeight: 1.2,
                  }}
                >
                  {translatedType}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                  }}
                >
                  {percentage.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
