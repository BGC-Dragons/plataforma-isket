import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppRouter } from "./scripts/config/routes";
import { theme } from "./theme";
import { GOOGLE_CONFIG } from "./scripts/config/google.constant";

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CONFIG.CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
