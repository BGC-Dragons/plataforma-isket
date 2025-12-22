import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  useTheme,
} from "@mui/material";
import { Home, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router";
import isketLogo from "../../../assets/isket.svg";

export function Error404() {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/pesquisar-anuncios");
  };

  const handleGoBack = () => {
    navigate(-1);
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
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            padding: { xs: 4, sm: 6 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
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
          {/* Logo */}
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

          {/* Número 404 grande */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "8rem", sm: "12rem" },
              fontWeight: 700,
              color: theme.palette.brand.primary,
              lineHeight: 1,
              mb: 2,
              textShadow: `0 0 20px ${theme.palette.brand.primary}40`,
            }}
          >
            404
          </Typography>

          {/* Título */}
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: theme.palette.brand.dark,
              mb: 2,
            }}
          >
            Página não encontrada
          </Typography>

          {/* Descrição */}
          <Typography
            variant="body1"
            sx={{
              color: "text.secondary",
              mb: 4,
              maxWidth: "500px",
              lineHeight: 1.6,
            }}
          >
            A página que você está procurando não existe ou foi movida.
            Verifique o endereço ou navegue para uma das opções abaixo.
          </Typography>

          {/* Botões de ação */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: 4,
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 3,
                background: theme.palette.brand.gradient,
                boxShadow: theme.palette.brand.shadowButton,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: theme.palette.brand.gradientHover,
                  transform: "translateY(-2px)",
                  boxShadow: theme.palette.brand.shadowButtonHover,
                },
              }}
            >
              Ir para o Início
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 3,
                borderColor: theme.palette.brand.border,
                color: theme.palette.brand.textPrimary,
                backgroundColor: theme.palette.brand.surface,
                boxShadow: theme.palette.brand.shadow,
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: theme.palette.brand.light,
                  borderColor: theme.palette.brand.primary,
                  transform: "translateY(-2px)",
                  boxShadow: theme.palette.brand.shadowHover,
                },
              }}
            >
              Voltar
            </Button>
          </Box>

          {/* Informações adicionais */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                opacity: 0.7,
              }}
            >
              Se você acredita que isso é um erro, entre em contato conosco
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.brand.secondary,
                fontWeight: 500,
              }}
            >
              suporte@isket.com
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
