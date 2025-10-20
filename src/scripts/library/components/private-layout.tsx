import React from "react";
import { Box, useTheme } from "@mui/material";
import { FloatingTopMenu } from "./floating-top-menu";

interface PrivateLayoutProps {
  children: React.ReactNode;
}

export function PrivateLayout({ children }: PrivateLayoutProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <FloatingTopMenu />

      <Box
        component="main"
        sx={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box>{children}</Box>
      </Box>
    </Box>
  );
}
