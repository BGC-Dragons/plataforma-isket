import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  useTheme,
  Alert,
} from "@mui/material";
import { PersonAdd } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { CitySelect } from "../../library/components/city-select";
import { CustomTextField } from "../../library/components/custom-text-field";
import { postAuthRegister } from "../../../services/post-auth-register.service";
import { postAuthLogin } from "../../../services/post-auth-login.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import { useAuth } from "../../modules/access-manager/auth.hook";

export function CompleteSignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { login } = useAuth();

  // Verificar se veio da verificação de email
  const isFromEmailVerification = location.state?.isEmailVerified;
  const verifiedEmail = location.state?.email;
  const verificationCode = location.state?.verificationCode;

  useEffect(() => {
    if (verifiedEmail) {
      setEmail(verifiedEmail);
    }
  }, [verifiedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!name.trim() || !email.trim() || !city.trim()) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Chamar API de registro
      await postAuthRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        verificationCode: verificationCode || "1234", // Código da verificação ou fallback
        defaultCityStateCode: city,
        // Campos opcionais podem ser adicionados aqui
      });

      // Após registro bem-sucedido, fazer login automático
      try {
        const loginResponse = await postAuthLogin({
          authenticator: email.trim(),
          pass: password,
        });

        if (loginResponse.data.accessToken && loginResponse.data.refreshToken) {
          try {
            // Buscar dados do usuário usando o token
            const userResponse = await getAuthMe(
              loginResponse.data.accessToken
            );

            const user = {
              id: userResponse.data.id,
              name: userResponse.data.name,
              email: userResponse.data.email || email.trim(),
            };

            // Fazer login automático e redirecionar para o dashboard
            login(
              {
                accessToken: loginResponse.data.accessToken,
                refreshToken: loginResponse.data.refreshToken,
              },
              user
            );
          } catch (userError) {
            console.error("Erro ao buscar dados do usuário:", userError);

            // Fallback: usar dados do formulário
            const user = {
              id: email.trim(),
              name: name.trim(),
              email: email.trim(),
            };

            login(
              {
                accessToken: loginResponse.data.accessToken,
                refreshToken: loginResponse.data.refreshToken,
              },
              user
            );
          }
        }
      } catch (loginError) {
        console.error("Erro no login automático:", loginError);
        // Se falhar o login automático, redirecionar para login com mensagem
        navigate("/", {
          state: {
            message: "Conta criada com sucesso! Faça login para continuar.",
          },
        });
      }
    } catch (err: unknown) {
      // Tratar erros específicos da API
      if (err && typeof err === "object" && "response" in err) {
        const apiError = err as { response?: { data?: { message?: string } } };
        if (apiError.response?.data?.message) {
          setError(apiError.response.data.message);
        } else {
          setError("Erro ao criar conta. Tente novamente.");
        }
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
      console.error("Erro no registro:", err);
    } finally {
      setIsSubmitting(false);
    }
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
            Complete seu cadastro
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Preencha os dados para finalizar sua conta
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
              value={email}
              disabled={isFromEmailVerification}
            />

            <CustomTextField
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <CustomTextField
              required
              fullWidth
              id="password"
              label="Senha"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordToggle
            />

            <CustomTextField
              required
              fullWidth
              id="confirmPassword"
              label="Confirmar senha"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showPasswordToggle
            />

            <CitySelect
              value={city}
              onChange={setCity}
              required
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={
                isSubmitting || !name || !password || !confirmPassword || !city
              }
              sx={{
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
              endIcon={<PersonAdd />}
            >
              {isSubmitting
                ? "Criando conta e fazendo login..."
                : "Criar conta e entrar"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
