import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { AppRouter } from "./scripts/config/routes";
import { theme } from "./theme";

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}
