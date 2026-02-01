import React from "react";
import { Box, useTheme } from "@mui/material";
import { FloatingTopMenu } from "./floating-top-menu";
import { CompleteProfileModal } from "./complete-profile-modal";
import { useViewportHeight } from "../hooks/use-viewport-height";

interface PrivateLayoutProps {
  children: React.ReactNode;
}

export function PrivateLayout({ children }: PrivateLayoutProps) {
  const theme = useTheme();
  useViewportHeight();

  return (
    <Box
      sx={{
        height: "var(--app-height, 100vh)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.default,
        overflow: "hidden",
      }}
    >
      <CompleteProfileModal />
      <FloatingTopMenu />

      <Box
        component="main"
        sx={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.palette.background.default,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
