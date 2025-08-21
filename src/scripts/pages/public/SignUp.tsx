import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Divider,
  useTheme,
  Link,
  Alert,
} from "@mui/material";
import { Send } from "@mui/icons-material";
import { useNavigate } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { GoogleButton } from "../../library/components/google-button";
import { postAuthSendVerificationCode } from "../../../services/post-auth-send-verification-code.service";
import { CustomTextField } from "../../library/components/custom-text-field";
import type { GoogleAuthResponse } from "../../../services/post-auth-google.service";

export function SignUp() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Enviar código de verificação via API
      await postAuthSendVerificationCode({
        emailOrPhone: email,
        method: "EMAIL",
      });

      // Redirecionar para verificação de email
      navigate("/email-verification", {
        state: {
          email,
        },
      });
    } catch (err) {
      setError("Erro ao enviar código de verificação. Tente novamente.");
      console.error("Erro ao enviar código:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuthSuccess = (response: GoogleAuthResponse) => {
    console.log("Google auth response:", response);

    if (response.accessToken && response.refreshToken) {
      // Usuário existente - login bem-sucedido
      console.log("Login com Google bem-sucedido");
      // Aqui você pode salvar os tokens e redirecionar
      // localStorage.setItem('accessToken', response.accessToken);
      // localStorage.setItem('refreshToken', response.refreshToken);
      navigate("/cadastro"); // ou para onde quiser redirecionar após login
    } else if (response.newAccount) {
      // Usuário novo - precisa completar cadastro
      console.log("Novo usuário Google:", response.newAccount);
      // Aqui você pode redirecionar para completar o perfil
      // ou salvar os dados temporariamente
      navigate("/completar-perfil", {
        state: {
          googleUser: response.newAccount,
        },
      });
    }
  };

  const handleGoogleAuthError = (error: string) => {
    console.error("Erro na autenticação Google:", error);
    setError(`Erro na autenticação Google: ${error}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.brand.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: { xs: 3, sm: 5 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            borderRadius: 4,
            background: theme.palette.brand.surface,
            backdropFilter: "blur(20px)",
            border: `1px solid ${theme.palette.brand.border}`,
            boxShadow: theme.palette.brand.shadow,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${theme.palette.brand.primary}, ${theme.palette.brand.secondary}, ${theme.palette.brand.primary})`,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 4,
            }}
          >
            <img
              src={isketLogo}
              alt="isket"
              style={{
                width: "120px",
                height: "45px",
              }}
            />
          </Box>

          <Typography
            component="h1"
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 500,
              color: theme.palette.brand.dark,
              mb: 1,
            }}
          >
            Crie sua conta
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Digite seu email para receber um código de verificação
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: "100%" }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <CustomTextField
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting || !email}
              sx={{
                mb: 3,
                py: 1.8,
                borderRadius: 3,
                background: theme.palette.brand.gradient,
                boxShadow: theme.palette.brand.shadowButton,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: theme.palette.brand.gradientHover,
                  transform: "translateY(-2px)",
                  boxShadow: theme.palette.brand.shadowButtonHover,
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}
              endIcon={<Send />}
            >
              {isSubmitting ? "Enviando..." : "Verificar"}
            </Button>

            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Divider sx={{ flex: 1 }} />
              <Typography
                variant="body2"
                sx={{ mx: 2, color: "text.secondary" }}
              >
                ou
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <GoogleButton
              onSuccess={handleGoogleAuthSuccess}
              onError={handleGoogleAuthError}
              variant="signup"
            />

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Já tem uma conta?{" "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/")}
                  sx={{
                    color: theme.palette.brand.secondary,
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    "&:hover": {
                      color: theme.palette.brand.accent,
                      textDecoration: "underline",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Faça login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
