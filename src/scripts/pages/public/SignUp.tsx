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
  Divider,
  useTheme,
} from "@mui/material";
import { Person, LocationOn, ArrowBack, PersonAdd } from "@mui/icons-material";
import { useNavigate } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { GoogleButton } from "../../library/components/google-button";

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
    console.log("Cadastro:", { name, city });
  };

  const handleGoogleSignUp = () => {
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
            Criar conta
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Preencha os dados abaixo para criar sua conta.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
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

            <Box>
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel id="city-label">Cidade</InputLabel>
                <Select
                  labelId="city-label"
                  id="city"
                  value={city}
                  label="Cidade"
                  onChange={(e) => setCity(e.target.value)}
                  required
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: "200px !important",
                        width: "auto",
                        minWidth: "100%",
                        boxShadow: theme.palette.brand.shadow,
                        border: `1px solid ${theme.palette.brand.border}`,
                        borderRadius: 2,
                        mt: 0.5,
                        overflow: "auto !important",
                        "& .MuiMenuItem-root": {
                          padding: "8px 16px",
                          fontSize: "14px",
                          "&:hover": {
                            backgroundColor: `${theme.palette.brand.secondary}14`,
                          },
                          "&.Mui-selected": {
                            backgroundColor: `${theme.palette.brand.secondary}1F`,
                            "&:hover": {
                              backgroundColor: `${theme.palette.brand.secondary}29`,
                            },
                          },
                        },
                      },
                      style: {
                        maxHeight: "200px",
                        overflow: "auto",
                      },
                    },
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    slotProps: {
                      paper: {
                        sx: {
                          maxHeight: "200px !important",
                          overflow: "auto !important",
                          "&::-webkit-scrollbar": {
                            width: "8px",
                          },
                          "&::-webkit-scrollbar-track": {
                            background: theme.palette.brand.light,
                            borderRadius: "4px",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: theme.palette.brand.primary,
                            borderRadius: "4px",
                            "&:hover": {
                              background: theme.palette.brand.secondary,
                            },
                          },
                        },
                        style: {
                          maxHeight: "200px",
                          overflow: "auto",
                        },
                      },
                    },
                  }}
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
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
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
              endIcon={<PersonAdd />}
            >
              Cadastrar
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

            <GoogleButton onClick={handleGoogleSignUp} variant="signup" />

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
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
