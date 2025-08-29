import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./auth.hook";

export type AccessManagerProps = {
  component: React.ComponentType;
  requireAuth?: boolean;
};

export const AccessManager: React.FC<AccessManagerProps> = ({
  component: Component,
  requireAuth = true,
}) => {
  const { isLogged } = useAuth();
  const { pathname, search } = useLocation();

  switch (true) {
    // Se não requer autenticação, renderiza o componente
    case !requireAuth:
      return <Component />;

    // Se requer autenticação mas não está logado, redireciona para a página inicial
    case requireAuth && !isLogged:
      return <Navigate to={`/login?redirect=${pathname + search}`} replace />; // Redirect to login

    // Se passou por todas as validações, renderiza o componente
    default:
      return <Component />;
  }
};
