import { Button, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../modules/access-manager/auth.hook";
import { useState } from "react";
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
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response: { access_token: string }) => {
      try {
        setIsLoading(true);
        setError(null);
        await loginWithGoogle(response);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro na autenticação com Google";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      const errorMessage = "Erro ao fazer login com Google";
      setError(errorMessage);
    },
    flow: "implicit",
  });

  const getButtonText = () => {
    if (text) return text;
    return variant === "login" ? "Entrar com Google" : "Cadastrar com Google";
  };

  const clearError = () => setError(null);

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
        onClick={() => googleLogin()}
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
