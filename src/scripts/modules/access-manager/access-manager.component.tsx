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
  const { isLogged, isValidating } = useAuth();
  const { pathname, search } = useLocation();

  if (isValidating) {
    return <AnimatedIsketLogo />;
  }

  switch (true) {
    case !requireAuth:
      return <Component />;

    case requireAuth && !isLogged:
      return <Navigate to={`/login?redirect=${pathname + search}`} replace />;

    default:
      return <Component />;
  }
};
