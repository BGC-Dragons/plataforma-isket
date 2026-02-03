import { ToggleButton, ToggleButtonGroup, Box, useTheme } from "@mui/material";
import { TrendingUp, Inventory } from "@mui/icons-material";

export type HeatmapMode = "demand" | "supply";

interface HeatmapToggleProps {
  value: HeatmapMode;
  onChange: (mode: HeatmapMode) => void;
  disabled?: boolean;
}

export function HeatmapToggle({
  value,
  onChange,
  disabled = false,
}: HeatmapToggleProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue) => newValue && onChange(newValue)}
        size="small"
        disabled={disabled}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          "& .MuiToggleButton-root": {
            px: 2,
            py: 0.75,
            textTransform: "none",
            fontSize: "0.8rem",
            fontWeight: 500,
            border: "none",
            "&.Mui-selected": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            },
          },
        }}
      >
        <ToggleButton value="demand">
          <TrendingUp sx={{ mr: 0.5, fontSize: "1rem" }} />
          Demanda
        </ToggleButton>
        <ToggleButton value="supply">
          <Inventory sx={{ mr: 0.5, fontSize: "1rem" }} />
          Oferta
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
