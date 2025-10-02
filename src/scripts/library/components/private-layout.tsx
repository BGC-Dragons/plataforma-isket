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
      <SidebarMenu />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - 80px)`,
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box>{children}</Box>
      </Box>
    </Box>
  );
}
