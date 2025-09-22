import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  postAuthRecoveryPassword,
  type IRecoveryPasswordRequest,
} from "../../../../../services/post-auth-recovery-password.service";

export function SecuritySection() {
  const theme = useTheme();
  const { store } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendRecoveryLink = async () => {
    if (!store.user?.email) {
      setError("Email não encontrado. Faça login novamente.");
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);
    setError(null);

    try {
      const requestData: IRecoveryPasswordRequest = {
        email: store.user.email,
      };

      await postAuthRecoveryPassword(requestData);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: unknown) {
      console.error("Erro ao enviar link de recuperação:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        "Erro ao enviar link de recuperação. Tente novamente.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 1.5 }}
      >
        Segurança
      </Typography>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: "center", maxWidth: 500, mx: "auto" }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, fontSize: "1.1rem", lineHeight: 1.6 }}
          >
            Enviaremos um link de alteração de senha para o seu email
            cadastrado.
          </Typography>

          <Button
            variant="contained"
            onClick={handleSendRecoveryLink}
            disabled={isLoading}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              minWidth: 280,
            }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Enviando...
              </Box>
            ) : (
              "Enviar link de alteração de senha"
            )}
          </Button>

          {showSuccess && (
            <Alert severity="success" sx={{ mt: 3 }}>
              Link de alteração de senha enviado com sucesso! Verifique seu
              email.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
