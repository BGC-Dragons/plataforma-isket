import { Button, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useAuth } from "../../modules/access-manager/auth.hook";
import googleLogo from "../../../assets/google.svg";

interface GoogleButtonProps {
  text?: string;
  fullWidth?: boolean;
  variant?: "login" | "signup";
}

export function GoogleButton({
  text,
  fullWidth = true,
  variant = "login",
}: GoogleButtonProps) {
  const theme = useTheme();
  const { loginWithGoogle: authLoginWithGoogle } = useAuth();

  const { loginWithGoogle, isLoading, error, clearError } = useGoogleAuth(
    async (response: { code: string }) => {
      try {
        await authLoginWithGoogle(response);
      } catch (err) {
        // O erro será tratado pelo hook useGoogleAuth
        throw err;
      }
    },
    (errorMessage: string) => {
      // Tratamento de erro já está no hook
    }
  );

  const getButtonText = () => {
    if (text) return text;
    return variant === "login" ? "Entrar com Google" : "Cadastrar com Google";
  };

  return (
    <>
      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      <Button
        fullWidth={fullWidth}
        variant="outlined"
        onClick={() => loginWithGoogle()}
        disabled={isLoading}
        sx={{
          mb: 3,
          py: 1.8,
          borderRadius: 3,
          borderColor: theme.palette.brand.border,
          color: theme.palette.brand.textPrimary,
          backgroundColor: theme.palette.brand.surface,
          boxShadow: theme.palette.brand.shadow,
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: theme.palette.brand.light,
            borderColor: theme.palette.brand.primary,
            transform: "translateY(-2px)",
            boxShadow: theme.palette.brand.shadowHover,
          },
          "&:disabled": {
            opacity: 0.6,
            transform: "none",
            boxShadow: theme.palette.brand.shadow,
          },
        }}
        startIcon={
          isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <img src={googleLogo} alt="Google" width="20" height="20" />
          )
        }
      >
        {isLoading ? "Conectando..." : getButtonText()}
      </Button>
    </>
  );
}
