import { useContext } from "react";
import { AuthContext } from "./auth-context-definition";
import type { IAuth } from "./auth-context.types";

export const useAuth = (): IAuth => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
