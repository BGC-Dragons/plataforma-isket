import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Link,
  Paper,
  useTheme,
} from "@mui/material";
import { ArrowBack, Send } from "@mui/icons-material";
import { useNavigate } from "react-router";
import isketLogo from "../../../assets/isket.svg";
import { CustomTextField } from "../../library/components/custom-text-field";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Recuperar senha para:", email);
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
            Recuperar senha
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Digite seu email e enviaremos um link para redefinir sua senha.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
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
              sx={{ mb: 4 }}
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
              endIcon={<Send />}
            >
              Enviar link de recuperação
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleBackToLogin}
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
}
