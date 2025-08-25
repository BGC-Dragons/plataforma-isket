import { useState } from "react";
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
import { useNavigate } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { GoogleButton } from "../../library/components/google-button";
import {
  postAuthLogin,
  type IPostAuthLoginParams,
} from "../../../services/post-auth-login.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import { CustomTextField } from "../../library/components/custom-text-field";
import { useAuth } from "../../modules/access-manager/auth.hook";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: IPostAuthLoginParams = {
        authenticator: email,
        pass: password,
      };
      const response = await postAuthLogin(params);

      // Se o login for bem-sucedido, buscar dados do usuário e fazer login
      if (response.data.accessToken && response.data.refreshToken) {
        try {
          // Buscar dados do usuário usando o token
          const userResponse = await getAuthMe(response.data.accessToken);

          const user = {
            id: userResponse.data.id,
            name: userResponse.data.name,
            email: userResponse.data.email || email, // Fallback para email do formulário
          };

          login(
            {
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            },
            user
          );
        } catch (userError) {
          console.error("Erro ao buscar dados do usuário:", userError);

          // Fallback: usar dados do formulário
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
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else {
          setError("Erro ao fazer login. Tente novamente.");
        }
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
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
            Entre na sua conta
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
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
    </Box>
  );
}
