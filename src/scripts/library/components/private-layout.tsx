import React, { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { SidebarMenu } from "./sidebar-menu";

interface PrivateLayoutProps {
  children: React.ReactNode;
}

export function PrivateLayout({ children }: PrivateLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Menu Lateral */}
      <SidebarMenu open={sidebarOpen} onToggle={handleSidebarToggle} />

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${80}px)` }, // Ajustado para menu compacto
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Área de Conteúdo */}
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            pt: { xs: 8, sm: 3, md: 4 }, // Espaço para botão de menu mobile
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
