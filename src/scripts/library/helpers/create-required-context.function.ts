import { createContext, useContext } from "react";

export function createRequiredContext<T>() {
  const Context = createContext<T | undefined>(undefined);

  const useRequiredContext = () => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error("useRequiredContext must be used within a Provider");
    }
    return context;
  };

  return [Context, useRequiredContext] as const;
}
