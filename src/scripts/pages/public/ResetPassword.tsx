import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Button,
  Container,
  Typography,
  Link,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  Lock,
} from "@mui/icons-material";
import isketLogo from "../../../assets/isket.svg";
import { CustomTextField } from "../../library/components/custom-text-field";
import { postAuthVerifyChangePassword } from "../../../services/post-auth-verify-change-password.service";

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      setError("");
    };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Mínimo 8 caracteres");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Pelo menos 1 letra minúscula");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Pelo menos 1 letra maiúscula");
    }
    if (!/\d/.test(password)) {
      errors.push("Pelo menos 1 número");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Pelo menos 1 caractere especial");
    }

    return errors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Token inválido");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(`Senha deve ter: ${passwordErrors.join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      await postAuthVerifyChangePassword({
        token,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);

      if (error.response?.status === 400) {
        setError("A nova senha deve ser diferente da senha atual");
      } else if (error.response?.status === 403) {
        setError("Token inválido ou expirado");
      } else if (error.response?.status === 404) {
        setError("Usuário não encontrado");
      } else {
        setError("Erro ao redefinir senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
                color: theme.palette.success.main,
                mb: 1,
              }}
            >
              Senha Redefinida!
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 4, opacity: 0.8 }}
            >
              Sua senha foi redefinida com sucesso. Você será redirecionado para
              o login.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate("/login")}
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
            >
              Ir para Login
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
            Redefinir Senha
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Digite sua nova senha abaixo
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, width: "100%" }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <CustomTextField
              fullWidth
              label="Nova Senha"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange("password")}
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <CustomTextField
              fullWidth
              label="Confirmar Nova Senha"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              required
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
                • Mínimo 8 caracteres
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                • Pelo menos 1 letra minúscula e 1 maiúscula
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                • Pelo menos 1 número e 1 caractere especial
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
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
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Lock />
                )
              }
            >
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>

            <Box sx={{ textAlign: "center" }}>
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
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
