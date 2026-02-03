import { Tabs, Tab, Box, useTheme, useMediaQuery } from "@mui/material";
import { TrendingUp, Inventory, Lightbulb } from "@mui/icons-material";

export type AnalyticsTabType = "demanda" | "oferta" | "oportunidades";

interface AnalyticsTabsProps {
  activeTab: AnalyticsTabType;
  onChange: (tab: AnalyticsTabType) => void;
}

export function AnalyticsTabs({ activeTab, onChange }: AnalyticsTabsProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        mb: 2,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, value) => onChange(value)}
        textColor="primary"
        indicatorColor="primary"
        variant={isSmallScreen ? "scrollable" : "standard"}
        scrollButtons={isSmallScreen ? "auto" : false}
        sx={{
          minHeight: 40,
          "& .MuiTab-root": {
            minHeight: 40,
            py: 1,
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
          },
        }}
      >
        <Tab
          label="Demanda"
          value="demanda"
          icon={<TrendingUp sx={{ fontSize: "1.1rem" }} />}
          iconPosition="start"
          sx={{ gap: 0.5 }}
        />
        <Tab
          label="Oferta"
          value="oferta"
          icon={<Inventory sx={{ fontSize: "1.1rem" }} />}
          iconPosition="start"
          sx={{ gap: 0.5 }}
        />
        <Tab
          label="Oportunidades"
          value="oportunidades"
          icon={<Lightbulb sx={{ fontSize: "1.1rem" }} />}
          iconPosition="start"
          sx={{ gap: 0.5 }}
        />
      </Tabs>
    </Box>
  );
}
