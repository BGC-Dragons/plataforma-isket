import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router";
import isketLogo from "../../../assets/isket.svg";

export function EmailVerification() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Pegar o email que veio da tela anterior
  const email = location.state?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 4) return;

    setIsVerifying(true);

    try {
      // Simular verificação do código
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirecionar para tela de cadastro completo
      navigate("/complete-signup", {
        state: {
          email,
          isEmailVerified: true,
        },
      });
    } catch {
      // Em caso de erro, continuar na mesma tela
    } finally {
      setIsVerifying(false);
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
            Crie sua conta
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 4, opacity: 0.8 }}
          >
            Digite o código de 4 dígitos enviado para {email}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="verificationCode"
              label="Código de verificação"
              name="verificationCode"
              autoComplete="off"
              autoFocus
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputProps={{
                maxLength: 4,
                pattern: "[0-9]*",
                inputMode: "numeric",
              }}
              sx={{
                mb: 4,
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
              placeholder="0000"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isVerifying || verificationCode.length !== 4}
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
            >
              {isVerifying ? "Verificando..." : "Verificar código"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
