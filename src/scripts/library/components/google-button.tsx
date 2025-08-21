import { Button, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import googleLogo from "../../../assets/google.svg";
import type { GoogleAuthResponse } from "../../../services/post-auth-google.service";
import { useGoogleAuth } from "../../../hooks/useGoogleAuth";

interface GoogleButtonProps {
  onSuccess: (response: GoogleAuthResponse) => void;
  onError?: (error: string) => void;
  text?: string;
  fullWidth?: boolean;
  variant?: "login" | "signup";
}

export function GoogleButton({
  onSuccess,
  onError,
  text,
  fullWidth = true,
  variant = "login",
}: GoogleButtonProps) {
  const theme = useTheme();

  const { loginWithGoogle, isLoading, error, clearError } = useGoogleAuth(
    onSuccess,
    onError
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
        onClick={loginWithGoogle}
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
