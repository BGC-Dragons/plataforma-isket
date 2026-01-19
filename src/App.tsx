import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppRouter } from "./scripts/config/routes";
import { theme } from "./theme";
import { GOOGLE_CONFIG } from "./scripts/config/google.constant";
import { useEffectOnce } from "react-use";
import smartlookClient from "smartlook-client";
import { ENV_VAR } from "./config/env-var";

export function App() {
  useEffectOnce(() => {
    if (ENV_VAR.smartlookApiKey) {
      smartlookClient.init(ENV_VAR.smartlookApiKey);
    }
  });
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CONFIG.CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRouter />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
