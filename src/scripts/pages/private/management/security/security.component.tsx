import { useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Alert,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { Lock } from "@mui/icons-material";
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
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        pt: 2,
        pb: 4,
        pl: 2,
        pr: 2,
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 3 }}
      >
        Segurança
      </Typography>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Informações de Segurança */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 3,
              flexDirection: { xs: "column", sm: "row" },
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                mr: { xs: 0, sm: 2 },
                mb: { xs: 2, sm: 0 },
                width: 60,
                height: 60,
              }}
            >
              <Lock sx={{ fontSize: 30 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: theme.palette.text.primary,
                }}
              >
                Alterar Senha
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                Enviaremos um link de alteração de senha para o seu email
                cadastrado.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Divisor */}
        <Box
          sx={{
            height: "1px",
            backgroundColor: theme.palette.divider,
            mb: 3,
          }}
        />

        {/* Botão de ação */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <Button
            variant="contained"
            onClick={handleSendRecoveryLink}
            disabled={isLoading}
            sx={{
              px: { xs: 2, sm: 4 },
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              minWidth: { xs: "100%", sm: 280 },
              maxWidth: { xs: "100%", sm: "none" },
              fontSize: { xs: "0.875rem", sm: "1rem" },
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
        </Box>

        {/* Alertas */}
        {showSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Link de alteração de senha enviado com sucesso! Verifique seu email.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
