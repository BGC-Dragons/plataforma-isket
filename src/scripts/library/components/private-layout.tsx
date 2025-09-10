import React from "react";
import { Box, useTheme } from "@mui/material";
import { SidebarMenu } from "./sidebar-menu";

interface PrivateLayoutProps {
  children: React.ReactNode;
}

export function PrivateLayout({ children }: PrivateLayoutProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Menu Lateral */}
      <SidebarMenu />

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - 80px)`, // Sempre considera o menu
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Área de Conteúdo */}
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
