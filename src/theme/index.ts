import { createTheme } from "@mui/material/styles";

// Cores principais do tema
const COLORS = {
  PRIMARY: "#262353",
  SECONDARY: "#E3003A",
  ACCENT: "#C70033",
  DARK: "#A6002A",
  LIGHT: "#F8F9FA",
  WHITE: "#FFFFFF",
  BORDER: "#E0E0E0",
  TEXT_PRIMARY: "#333333",
} as const;

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
      textPrimary: string;
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
      textPrimary: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.PRIMARY,
      contrastText: COLORS.WHITE,
    },
    secondary: {
      main: COLORS.WHITE,
      contrastText: COLORS.PRIMARY,
    },
    error: {
      main: COLORS.SECONDARY,
    },
    background: {
      default: COLORS.WHITE,
      paper: COLORS.WHITE,
    },
    brand: {
      primary: COLORS.PRIMARY,
      secondary: COLORS.SECONDARY,
      accent: COLORS.ACCENT,
      dark: COLORS.DARK,
      light: COLORS.LIGHT,
      gradient: `linear-gradient(135deg, ${COLORS.SECONDARY}, ${COLORS.ACCENT})`,
      gradientHover: `linear-gradient(135deg, ${COLORS.ACCENT}, ${COLORS.DARK})`,
      background: COLORS.PRIMARY,
      surface: "rgba(255, 255, 255, 0.95)",
      border: "rgba(255, 255, 255, 0.2)",
      shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      shadowHover: "0 8px 25px rgba(38, 35, 83, 0.15)",
      shadowFocus: "0 8px 25px rgba(227, 0, 58, 0.2)",
      shadowButton: "0 8px 25px rgba(227, 0, 58, 0.3)",
      shadowButtonHover: "0 12px 35px rgba(227, 0, 58, 0.4)",
      textPrimary: COLORS.TEXT_PRIMARY,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          /* Webkit (Chrome, Edge, Safari) */
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#eeeeee", // grey[200]
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#bdbdbd", // grey[400]
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "#757575", // grey[600]
            },
          },
        },

        "html, body": {
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#eeeeee", // grey[200]
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#bdbdbd", // grey[400]
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "#757575", // grey[600]
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.SECONDARY,
          color: COLORS.WHITE,
          "&:hover": {
            backgroundColor: COLORS.ACCENT,
          },
          textTransform: "none",
          borderRadius: 8,
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: 600,
        },
        outlined: {
          borderColor: COLORS.SECONDARY,
          color: COLORS.SECONDARY,
          "&:hover": {
            backgroundColor: "rgba(227, 0, 58, 0.04)",
            borderColor: COLORS.ACCENT,
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
              borderColor: COLORS.BORDER,
            },
            "&:hover fieldset": {
              borderColor: COLORS.PRIMARY,
            },
            "&.Mui-focused fieldset": {
              borderColor: COLORS.PRIMARY,
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
        select: {
          display: "flex",
          alignItems: "center",
          gap: 1,
        },
      },
      defaultProps: {
        MenuProps: {
          PaperProps: {
            sx: {
              "&::-webkit-scrollbar": {
                width: 6,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#e0e0e0", // grey[200]
                borderRadius: 3,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#bdbdbd", // grey[400]
                borderRadius: 3,
                "&:hover": {
                  backgroundColor: "#757575", // grey[600]
                },
              },
            },
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "14px",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "rgba(227, 0, 58, 0.08)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(227, 0, 58, 0.12)",
            "&:hover": {
              backgroundColor: "rgba(227, 0, 58, 0.16)",
            },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: 8,
          maxHeight: "200px !important",
          overflow: "auto !important",
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#e0e0e0", // grey[200]
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#bdbdbd", // grey[400]
            borderRadius: 3,
            "&:hover": {
              backgroundColor: "#757575", // grey[600]
            },
          },
        },
        root: {
          "& .MuiPaper-root": {
            maxHeight: "200px !important",
            overflow: "auto !important",
          },
        },
      },
      defaultProps: {
        PaperProps: {
          style: {
            maxHeight: "200px",
            overflow: "auto",
          },
        },
      },
    },
  },
});
