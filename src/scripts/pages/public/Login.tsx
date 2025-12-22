import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Link,
  Paper,
  Divider,
  useTheme,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { GoogleButton } from "../../library/components/google-button";
import { postAuthLogin } from "../../../services/post-auth-login.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import { CustomTextField } from "../../library/components/custom-text-field";
import { useAuth } from "../../modules/access-manager/auth.hook";
import { SubscriptionBlockedModal } from "../../library/components/subscription-blocked-modal";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showSubscriptionBlocked, setShowSubscriptionBlocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login } = useAuth();

  // Carregar erro do localStorage quando o componente monta
  useEffect(() => {
    const savedError = localStorage.getItem("login_error");
    if (savedError) {
      setError(savedError);
      setShowError(true);
    }
  }, []);

  const redirectTo = (() => {
    if (!location.search.includes("redirect=")) return "/pesquisar-anuncios";

    const redirect = new URLSearchParams(location.search).get("redirect");
    const invalidRedirects = [
      "/esqueceu-senha",
      "/cadastro",
      "/login",
      "/reset-password",
    ];

    return redirect &&
      !invalidRedirects.some((invalid) => redirect.includes(invalid))
      ? redirect
      : "/pesquisar-anuncios";
  })();

  const successMessage = location.state?.message;

  useEffect(() => {
    if (successMessage) {
      setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 5000);
    }
  }, [successMessage, navigate, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      const errorMessage = "Por favor, preencha todos os campos.";
      setError(errorMessage);
      setShowError(true);
      localStorage.setItem("login_error", errorMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setShowError(false);
    localStorage.removeItem("login_error");

    try {
      const response = await postAuthLogin({
        authenticator: email,
        pass: password,
      });

      if (response.data.accessToken && response.data.refreshToken) {
        try {
          const userResponse = await getAuthMe(response.data.accessToken);
          const user = {
            id: userResponse.data.id,
            name: userResponse.data.name,
            email: userResponse.data.email || email,
          };

          login(
            {
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            },
            user,
            redirectTo !== "/pesquisar-anuncios" ? redirectTo : undefined
          );
        } catch (userError: unknown) {
          console.error("Erro ao buscar dados do usuário:", userError);

          // Verificar se é erro de assinatura expirada
          const axiosError = userError as {
            response?: {
              data?: {
                error?: string;
                message?: string;
                statusCode?: number;
              };
            };
          };

          if (
            axiosError.response?.data?.error === "ForbiddenException" ||
            axiosError.response?.data?.message ===
              "Your subscription has expired. Please update your payment method." ||
            axiosError.response?.data?.statusCode === 403
          ) {
            setShowSubscriptionBlocked(true);
            return;
          }

          const user = {
            id: email,
            name: email.split("@")[0],
            email: email,
          };

          login(
            {
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            },
            user
          );
        }
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string; error?: string } };
      };

      let errorMessage = "Erro ao fazer login. Tente novamente.";

      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
        if (errorMessage === "Invalid credentials") {
          errorMessage =
            "Senha incorreta. Verifique sua senha e tente novamente.";
        }
      } else if (axiosError.response?.data?.error) {
        errorMessage = axiosError.response.data.error;
        if (errorMessage === "Invalid credentials") {
          errorMessage =
            "Senha incorreta. Verifique sua senha e tente novamente.";
        }
      }

      setError(errorMessage);
      setShowError(true);
      localStorage.setItem("login_error", errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/esqueceu-senha");
  };

  const handleSignUp = () => {
    navigate("/cadastro");
  };

  const handleCloseSubscriptionBlocked = () => {
    setShowSubscriptionBlocked(false);
  };

  const handleBackToLogin = () => {
    setShowSubscriptionBlocked(false);
    // Limpar campos e focar no email
    setEmail("");
    setPassword("");
    setError(null);
    setShowError(false);
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
              style={{ width: "120px", height: "45px" }}
            />
          </Box>

          <Typography
            component="h1"
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 500, color: theme.palette.brand.dark, mb: 1 }}
          >
            Entre na sua conta
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            {showError && error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {successMessage}
              </Alert>
            )}
            <CustomTextField
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />

            <CustomTextField
              required
              fullWidth
              label="Senha"
              name="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordToggle
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
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
              endIcon={
                loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <ArrowForward />
                )
              }
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleForgotPassword}
                sx={{
                  color: theme.palette.brand.secondary,
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    color: theme.palette.brand.accent,
                    textDecoration: "underline",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Esqueceu sua senha?
              </Link>
            </Box>

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

            <GoogleButton variant="login" />

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Não tem uma conta?{" "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleSignUp}
                  sx={{
                    color: theme.palette.brand.secondary,
                    textDecoration: "none",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      color: theme.palette.brand.accent,
                      textDecoration: "underline",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Cadastre-se
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Modal de Assinatura Bloqueada */}
      <SubscriptionBlockedModal
        open={showSubscriptionBlocked}
        onClose={handleCloseSubscriptionBlocked}
        onBackToLogin={handleBackToLogin}
      />
    </Box>
  );
}
