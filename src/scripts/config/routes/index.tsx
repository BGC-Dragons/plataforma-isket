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
import { ManagementComponent } from "../../pages/private/management/management.component";
import { SearchComponent } from "../../pages/private/search/search.component";
import { SourcingComponent } from "../../pages/private/sourcing/sourcing.component";
import { EvaluationComponent } from "../../pages/private/evaluation/evaluation.component";
import { AnalysesComponent } from "../../pages/private/analyses/analyses.component";

// Páginas temporárias para as rotas do menu
function AnalisesPage() {
  return (
    <PrivateLayout>
      <AnalysesComponent />
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
      <EvaluationComponent />
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
            element={<Navigate to="/pesquisar-anuncios" replace />}
          />
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
