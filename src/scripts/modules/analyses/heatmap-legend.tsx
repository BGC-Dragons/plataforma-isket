import { Box, Typography, useTheme } from "@mui/material";
import type { HeatmapMode } from "./heatmap-toggle";

interface HeatmapLegendProps {
  mode: HeatmapMode;
}

export function HeatmapLegend({ mode }: HeatmapLegendProps) {
  const theme = useTheme();

  const isDemand = mode === "demand";

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        p: 1.5,
        borderRadius: 1,
        zIndex: 1,
        boxShadow: theme.shadows[2],
        minWidth: 120,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          display: "block",
          mb: 0.5,
          color: theme.palette.text.primary,
        }}
      >
        {isDemand ? "Demanda (buscas)" : "Oferta (imóveis)"}
      </Typography>
      <Box
        sx={{
          width: "100%",
          height: 8,
          background: isDemand
            ? "linear-gradient(90deg, rgba(0, 255, 255, 0.8), rgba(0, 0, 255, 0.8), rgba(255, 0, 0, 0.8))"
            : "linear-gradient(90deg, rgba(144, 238, 144, 0.8), rgba(50, 205, 50, 0.8), rgba(255, 165, 0, 0.8))",
          borderRadius: 1,
          mb: 0.5,
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Baixo
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Alto
        </Typography>
      </Box>
    </Box>
  );
}
