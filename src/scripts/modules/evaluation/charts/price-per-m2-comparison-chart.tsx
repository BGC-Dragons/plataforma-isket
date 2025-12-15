import { Box, Typography, useTheme } from "@mui/material";

interface PricePerM2Data {
  label: string;
  value: number;
}

interface PricePerM2ComparisonChartProps {
  data: PricePerM2Data[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PricePerM2ComparisonChart({
  data,
}: PricePerM2ComparisonChartProps) {
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

  // Filtra valores válidos (maiores que 0)
  const validData = data.filter((d) => d.value > 0);
  
  if (validData.length === 0) {
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

  const maxValue = Math.max(...validData.map((d) => d.value));
  const minValue = Math.min(...validData.map((d) => d.value));

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

      {/* Gráfico de barras horizontais */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {validData.map((item, index) => {
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
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    mr: 2,
                  }}
                  title={item.label}
                >
                  {item.label || `Imóvel ${index + 1}`}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(item.value)}/m²
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
                    minWidth: "60px",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.primary.contrastText,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  >
                    {formatCurrency(item.value)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Informações adicionais */}
      {data.length > 0 && (
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, display: "block" }}
            >
              Menor valor
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {formatCurrency(minValue)}/m²
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, display: "block" }}
            >
              Maior valor
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {formatCurrency(maxValue)}/m²
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, display: "block" }}
            >
              Diferença
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}
            >
              {formatCurrency(maxValue - minValue)}/m²
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
