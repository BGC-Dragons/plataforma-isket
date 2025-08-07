import { createTheme } from "@mui/material/styles";

// Estender o tema para incluir cores personalizadas
declare module "@mui/material/styles" {
  interface Palette {
    brand: {
      primary: string;
      secondary: string;
      accent: string;
      dark: string;
      light: string;
      gradient: string;
      gradientHover: string;
      background: string;
      surface: string;
      border: string;
      shadow: string;
      shadowHover: string;
      shadowFocus: string;
      shadowButton: string;
      shadowButtonHover: string;
    };
  }
  interface PaletteOptions {
    brand?: {
      primary: string;
      secondary: string;
      accent: string;
      dark: string;
      light: string;
      gradient: string;
      gradientHover: string;
      background: string;
      surface: string;
      border: string;
      shadow: string;
      shadowHover: string;
      shadowFocus: string;
      shadowButton: string;
      shadowButtonHover: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: "#262353", // rgba(38, 35, 83, 1)
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#FFFFFF", // rgba(255, 255, 255, 1)
      contrastText: "#262353",
    },
    error: {
      main: "#E3003A", // rgba(227, 0, 58, 1)
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    // Cores personalizadas da marca
    brand: {
      primary: "#262353",
      secondary: "#E3003A",
      accent: "#C70033",
      dark: "#A6002A",
      light: "#F8F9FA",
      gradient: "linear-gradient(135deg, #E3003A, #C70033)",
      gradientHover: "linear-gradient(135deg, #C70033, #A6002A)",
      background: "#262353",
      surface: "rgba(255, 255, 255, 0.95)",
      border: "rgba(255, 255, 255, 0.2)",
      shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      shadowHover: "0 8px 25px rgba(38, 35, 83, 0.15)",
      shadowFocus: "0 8px 25px rgba(227, 0, 58, 0.2)",
      shadowButton: "0 8px 25px rgba(227, 0, 58, 0.3)",
      shadowButtonHover: "0 12px 35px rgba(227, 0, 58, 0.4)",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#E3003A",
          color: "#FFFFFF",
          "&:hover": {
            backgroundColor: "#C70033",
          },
          textTransform: "none",
          borderRadius: 8,
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: 600,
        },
        outlined: {
          borderColor: "#E3003A",
          color: "#E3003A",
          "&:hover": {
            backgroundColor: "rgba(227, 0, 58, 0.04)",
            borderColor: "#C70033",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "& fieldset": {
              borderColor: "#E0E0E0",
            },
            "&:hover fieldset": {
              borderColor: "#262353",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#262353",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
