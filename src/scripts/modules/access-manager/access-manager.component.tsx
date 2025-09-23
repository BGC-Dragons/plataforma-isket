import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "./auth.hook";
import { AnimatedIsketLogo } from "../../library/components/animated-isket-logo";

export type AccessManagerProps = {
  component: React.ComponentType;
  requireAuth?: boolean;
};

export const AccessManager: React.FC<AccessManagerProps> = ({
  component: Component,
  requireAuth = true,
}) => {
  const { isLogged, isValidating, store } = useAuth();
  const { pathname, search } = useLocation();

  if (isValidating) {
    return <AnimatedIsketLogo />;
  }

  switch (true) {
    case !requireAuth:
      return <Component />;

    case requireAuth && !isLogged:
      // Evitar redirecionamento para páginas de autenticação
      const invalidRedirects = ["/esqueceu-senha", "/cadastro", "/login", "/reset-password"];
      const shouldRedirect = !invalidRedirects.some(invalid => pathname.includes(invalid));
      
      if (shouldRedirect) {
        return <Navigate to={`/login?redirect=${pathname + search}`} replace />;
      } else {
        return <Navigate to="/login" replace />;
      }

    default:
      return <Component />;
  }
};
