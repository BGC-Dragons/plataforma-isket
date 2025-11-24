import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Login } from "../../pages/public/Login";
import { ForgotPassword } from "../../pages/public/ForgotPassword";
import { SignUp } from "../../pages/public/SignUp";
import { CompleteProfile } from "../../pages/public/CompleteProfile";
import { EmailVerification } from "../../pages/public/EmailVerification";
import { CompleteSignUp } from "../../pages/public/CompleteSignUp";
import { ResetPassword } from "../../pages/public/ResetPassword";
import { Error404 } from "../../pages/public/Error404";
import { AccessManager } from "../../modules/access-manager/access-manager.component";
import { AuthProvider } from "../../modules/access-manager/auth.context";
import { PrivateLayout } from "../../library/components/private-layout";
import { Button, Box, Typography, Paper, useTheme } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { useAuth } from "../../modules/access-manager/auth.hook";
import { ManagementComponent } from "../../pages/private/management/management.component";
import { SearchComponent } from "../../pages/private/search/search.component";
import { SourcingComponent } from "../../pages/private/sourcing/sourcing.component";

// Página temporária do Dashboard
function DashboardPage() {
  const { logout, store } = useAuth();
  const theme = useTheme();

  return (
    <PrivateLayout>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Paper
          elevation={8}
          sx={{
            padding: "3rem",
            textAlign: "center",
            borderRadius: 4,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[8],
          }}
        >
          <Typography
            variant="h3"
            gutterBottom
            sx={{ color: theme.palette.primary.main }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.text.primary, mb: 3 }}
          >
            Bem-vindo ao seu painel de controle!
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 4 }}>
            Esta é uma página temporária. Implemente o dashboard real aqui.
          </Typography>
          {store.user && (
            <Box
              sx={{ mb: 4, p: 2, bgcolor: "background.paper", borderRadius: 2 }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: theme.palette.secondary.main }}
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
          <Button
            variant="contained"
            size="large"
            startIcon={<Logout />}
            onClick={logout}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: 3,
              background: theme.palette.primary.main,
              boxShadow: theme.shadows[4],
              transition: "all 0.3s ease",
              "&:hover": {
                background: theme.palette.primary.dark,
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[8],
              },
            }}
          >
            Fazer Logout
          </Button>
        </Paper>
      </Box>
    </PrivateLayout>
  );
}

// Páginas temporárias para as rotas do menu
function AnalisesPage() {
  return (
    <PrivateLayout>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Paper
          elevation={8}
          sx={{
            padding: "3rem",
            textAlign: "center",
            borderRadius: 4,
            background: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h3" gutterBottom>
            📊 Análises
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Página de análises em desenvolvimento...
          </Typography>
        </Paper>
      </Box>
    </PrivateLayout>
  );
}

function PesquisarAnunciosPage() {
  return (
    <PrivateLayout>
      <SearchComponent />
    </PrivateLayout>
  );
}

function CaptacaoPage() {
  return (
    <PrivateLayout>
      <SourcingComponent />
    </PrivateLayout>
  );
}

function AvaliacaoPage() {
  return (
    <PrivateLayout>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Paper
          elevation={8}
          sx={{
            padding: "3rem",
            textAlign: "center",
            borderRadius: 4,
            background: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h3" gutterBottom>
            ⭐ Avaliação
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Página de avaliação em desenvolvimento...
          </Typography>
        </Paper>
      </Box>
    </PrivateLayout>
  );
}

function ConfiguracoesPage() {
  return (
    <PrivateLayout>
      <ManagementComponent />
    </PrivateLayout>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueceu-senha" element={<ForgotPassword />} />
          <Route path="/cadastro" element={<SignUp />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/complete-signup" element={<CompleteSignUp />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Rotas Privadas */}
          <Route
            path="/"
            element={
              <AccessManager component={DashboardPage} requireAuth={true} />
            }
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route
            path="/analises"
            element={
              <AccessManager component={AnalisesPage} requireAuth={true} />
            }
          />
          <Route
            path="/pesquisar-anuncios"
            element={
              <AccessManager
                component={PesquisarAnunciosPage}
                requireAuth={true}
              />
            }
          />
          <Route
            path="/pesquisar-anuncios/:propertyId"
            element={
              <AccessManager
                component={PesquisarAnunciosPage}
                requireAuth={true}
              />
            }
          />
          <Route
            path="/captacao"
            element={
              <AccessManager component={CaptacaoPage} requireAuth={true} />
            }
          />
          <Route
            path="/avaliacao"
            element={
              <AccessManager component={AvaliacaoPage} requireAuth={true} />
            }
          />
          <Route
            path="/configuracoes"
            element={
              <AccessManager component={ConfiguracoesPage} requireAuth={true} />
            }
          />

          <Route path="*" element={<Error404 />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
