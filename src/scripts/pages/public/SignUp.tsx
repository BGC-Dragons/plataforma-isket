import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Fade,
  Grow,
  Divider,
  useTheme,
} from "@mui/material";
import { Person, LocationOn, ArrowBack, PersonAdd } from "@mui/icons-material";
import { useNavigate } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import googleLogo from "../../../assets/google.svg";

// Lista de cidades para o select (você pode expandir conforme necessário)
const cities = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Brasília",
  "Salvador",
  "Fortaleza",
  "Recife",
  "Porto Alegre",
  "Curitiba",
  "Goiânia",
  "Manaus",
  "Belém",
  "Vitória",
  "Florianópolis",
  "Natal",
  "Maceió",
  "João Pessoa",
  "Teresina",
  "Campo Grande",
  "Cuiabá",
];

export function SignUp() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementará a lógica de cadastro
    console.log("Cadastro:", { name, city });
  };

  const handleGoogleSignUp = () => {
    // Aqui você implementará a integração OAuth do Google
    console.log("Cadastro com Google");
  };

  const handleBackToLogin = () => {
    navigate("/");
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
        <Fade in timeout={800}>
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
            {/* Logo with modern design */}
            <Grow in timeout={1000}>
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
            </Grow>

            <Grow in timeout={1200}>
              <Typography
                component="h1"
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 500,
                  color: "#000000",
                  mb: 1,
                }}
              >
                Criar conta
              </Typography>
            </Grow>

            <Grow in timeout={1400}>
              <Typography
                variant="body1"
                color="text.secondary"
                textAlign="center"
                sx={{ mb: 4, opacity: 0.8 }}
              >
                Preencha os dados abaixo para criar sua conta.
              </Typography>
            </Grow>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%" }}
            >
              <Grow in timeout={1600}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Nome completo"
                  name="name"
                  autoComplete="name"
                  autoFocus
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
                      <InputAdornment position="start">
                        <Person sx={{ color: "primary.main", opacity: 0.7 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grow>

              <Grow in timeout={1800}>
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel id="city-label">Cidade</InputLabel>
                  <Select
                    labelId="city-label"
                    id="city"
                    value={city}
                    label="Cidade"
                    onChange={(e) => setCity(e.target.value)}
                    required
                    sx={{
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
                    }}
                    startAdornment={
                      <InputAdornment position="start">
                        <LocationOn
                          sx={{ color: "primary.main", opacity: 0.7 }}
                        />
                      </InputAdornment>
                    }
                  >
                    {cities.map((cityName) => (
                      <MenuItem key={cityName} value={cityName}>
                        {cityName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grow>

              <Grow in timeout={2000}>
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
                  endIcon={<PersonAdd />}
                >
                  Cadastrar
                </Button>
              </Grow>

              <Grow in timeout={2200}>
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
              </Grow>

              <Grow in timeout={2400}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleSignUp}
                  sx={{
                    mb: 3,
                    py: 1.8,
                    borderRadius: 3,
                    borderColor: "#E0E0E0",
                    color: "#333333",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#F8F9FA",
                      borderColor: "#DADCE0",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                  startIcon={
                    <img src={googleLogo} alt="Google" width="20" height="20" />
                  }
                >
                  Entrar com Google
                </Button>
              </Grow>

              <Grow in timeout={2600}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    Já tem uma conta?{" "}
                    <Link
                      component="button"
                      variant="body2"
                      onClick={handleBackToLogin}
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
                      <ArrowBack fontSize="small" />
                      Faça login
                    </Link>
                  </Typography>
                </Box>
              </Grow>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}
