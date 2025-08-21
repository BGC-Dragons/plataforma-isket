import { BrowserRouter, Routes, Route } from "react-router";
import { Login } from "../../pages/public/Login";
import { ForgotPassword } from "../../pages/public/ForgotPassword";
import { SignUp } from "../../pages/public/SignUp";
import { CompleteProfile } from "../../pages/public/CompleteProfile";
import { EmailVerification } from "../../pages/public/EmailVerification";
import { CompleteSignUp } from "../../pages/public/CompleteSignUp";
import { Error404 } from "../../pages/public/Error404";
import { AccessManager } from "../../modules/access-manager/access-manager.component";
import { AuthProvider } from "../../modules/access-manager/auth.context";
import { useAuth } from "../../modules/access-manager/auth.hook";
import { Button, Box, Typography, Paper, useTheme } from "@mui/material";
import { Logout } from "@mui/icons-material";

// Página temporária do Dashboard
function DashboardPage() {
  const { logout, store } = useAuth();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.brand.background,
        padding: "2rem",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          padding: "3rem",
          textAlign: "center",
          borderRadius: 4,
          background: theme.palette.brand.surface,
          border: `1px solid ${theme.palette.brand.border}`,
          boxShadow: theme.palette.brand.shadow,
        }}
      >
        <Typography
          variant="h3"
          gutterBottom
          sx={{ color: theme.palette.brand.primary }}
        >
          Dashboard
        </Typography>

        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: theme.palette.brand.dark, mb: 3 }}
        >
          Bem-vindo ao seu painel de controle!
        </Typography>

        <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
          Esta é uma página temporária. Implemente o dashboard real aqui.
        </Typography>

        {/* Informações do usuário */}
        {store.user && (
          <Box
            sx={{ mb: 4, p: 2, bgcolor: "background.paper", borderRadius: 2 }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: theme.palette.brand.secondary }}
            >
              Informações do Usuário
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              <strong>Nome:</strong> {store.user.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              <strong>Email:</strong> {store.user.email}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              <strong>ID:</strong> {store.user.id}
            </Typography>
          </Box>
        )}

        {/* Botão de Logout */}
        <Button
          variant="contained"
          size="large"
          startIcon={<Logout />}
          onClick={logout}
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
          Fazer Logout
        </Button>
      </Paper>
    </Box>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/esqueceu-senha" element={<ForgotPassword />} />
          <Route path="/cadastro" element={<SignUp />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/complete-signup" element={<CompleteSignUp />} />
          <Route
            path="/dashboard"
            element={
              <AccessManager component={DashboardPage} requireAuth={true} />
            }
          />
          <Route path="*" element={<Error404 />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
