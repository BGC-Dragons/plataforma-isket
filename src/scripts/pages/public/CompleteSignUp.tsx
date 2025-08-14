import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  useTheme,
  Alert,
  IconButton,
  InputAdornment as MuiInputAdornment,
} from "@mui/material";
import {
  Person,
  PersonAdd,
  Visibility,
  VisibilityOff,
  Email,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { CitySelect } from "../../library/components/city-select";

export function CompleteSignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Verificar se veio da verificação de email
  const isFromEmailVerification = location.state?.isEmailVerified;
  const verifiedEmail = location.state?.email;

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

    setIsSubmitting(true);
    setError("");

    try {
      // Simular cadastro
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirecionar para login após sucesso
      navigate("/", {
        state: {
          message: "Conta criada com sucesso! Faça login para continuar.",
        },
      });
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
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
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={isFromEmailVerification}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowHover,
                  },
                  "&.Mui-focused": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowFocus,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <MuiInputAdornment position="start">
                    <Email sx={{ color: "primary.main", opacity: 0.7 }} />
                  </MuiInputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowHover,
                  },
                  "&.Mui-focused": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowFocus,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <MuiInputAdornment position="start">
                    <Person sx={{ color: "primary.main", opacity: 0.7 }} />
                  </MuiInputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              label="Senha"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowHover,
                  },
                  "&.Mui-focused": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowFocus,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <MuiInputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </MuiInputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="confirmPassword"
              label="Confirmar senha"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowHover,
                  },
                  "&.Mui-focused": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.palette.brand.shadowFocus,
                  },
                },
              }}
              InputProps={{
                endAdornment: (
                  <MuiInputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </MuiInputAdornment>
                ),
              }}
            />

            <CitySelect
              value={city}
              onChange={setCity}
              required
              sx={{ mb: 4 }}
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
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
