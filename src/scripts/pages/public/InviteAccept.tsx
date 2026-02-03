import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import { PersonAdd, ArrowBack } from "@mui/icons-material";
import { CustomTextField } from "../../library/components/custom-text-field";
import { validatePassword } from "../../library/helpers/validate-password.helper";
import { useAuth } from "../../modules/access-manager/auth.hook";
import { postAuthRegisterWithInvite } from "../../../services/post-auth-register-with-invite.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import isketLogo from "../../../assets/isket.svg";

export function InviteAccept() {
  const theme = useTheme();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const allFilled = name.trim() && password && confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Senha deve ter: ${passwordErrors.join(", ")}`);
      return;
    }

    if (!allFilled || !token) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await postAuthRegisterWithInvite({
        token,
        name: name.trim(),
        password,
      });

      const { accessToken, refreshToken } = response.data;

      // Check for error responses from backend (insufficient credits etc.)
      if ((response.data as any).status === 402) {
        setError(
          (response.data as any).message ||
            "Créditos insuficientes. Contate o administrador da conta."
        );
        return;
      }

      let user: { id: string; name: string; email: string };
      try {
        const userResponse = await getAuthMe(accessToken);

        if (userResponse.data.inactive) {
          setError(
            "Sua conta foi desativada. Entre em contato com o administrador."
          );
          setIsSubmitting(false);
          return;
        }

        user = {
          id: userResponse.data.id,
          name: userResponse.data.name,
          email: userResponse.data.profile?.email || "",
        };
      } catch {
        user = {
          id: "",
          name: name.trim(),
          email: "",
        };
      }

      login({ accessToken, refreshToken }, user);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const apiError = err as {
          response?: { status?: number; data?: { message?: string } };
        };
        if (apiError.response?.status === 400) {
          setError("Convite inválido ou expirado.");
        } else if (apiError.response?.status === 409) {
          setError("Este email já está cadastrado na plataforma.");
        } else if (apiError.response?.data?.message) {
          setError(apiError.response.data.message);
        } else {
          setError("Erro ao aceitar convite. Tente novamente.");
        }
      } else {
        setError("Erro ao aceitar convite. Tente novamente.");
      }
      console.error("Erro ao aceitar convite:", err);
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
            variant="h5"
            sx={{
              fontWeight: 600,
              color: theme.palette.brand.textPrimary,
              mb: 1,
            }}
          >
            Aceitar Convite
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Preencha seus dados para se juntar à equipe.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: "100%" }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: "100%" }}
          >
            <CustomTextField
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />

            <CustomTextField
              required
              fullWidth
              id="password"
              label="Senha"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
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
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              showPasswordToggle
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                A senha deve ter:
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                {"\u2022"} Mínimo 8 caracteres
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                {"\u2022"} Pelo menos 1 letra minúscula e 1 maiúscula
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                {"\u2022"} Pelo menos 1 número e 1 caractere especial
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting || !allFilled}
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
              endIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PersonAdd />
                )
              }
            >
              {isSubmitting ? "Criando conta..." : "Aceitar Convite"}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/login")}
              sx={{
                color: theme.palette.brand.secondary,
                textDecoration: "none",
                fontWeight: 500,
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
              <ArrowBack fontSize="small" />
              Voltar para o login
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
