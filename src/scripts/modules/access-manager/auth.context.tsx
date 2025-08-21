import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { postAuthGoogle } from "../../../services/post-auth-google.service";
import { createRequiredContext } from "../../library/helpers/create-required-context.function";
import type { IAuth, IAuthStore, IAuthUser } from "./auth.interface";

const [AuthContext] = createRequiredContext<IAuth>();

// Exportar o contexto para uso no hook
export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [store, setStore] = useState<IAuthStore>({
    token: localStorage.getItem("auth_token") || null,
    refreshToken: localStorage.getItem("auth_refresh_token") || null,
    user: localStorage.getItem("auth_user")
      ? JSON.parse(localStorage.getItem("auth_user")!)
      : null,
  });

  // Usar o estado diretamente para isLogged
  const isLogged = !!store.token;

  const handleUpdateStore = useCallback(
    (
      user: IAuthUser | null,
      tokens: { accessToken: string; refreshToken: string },
      fromLocalStorage = false
    ) => {
      if (!fromLocalStorage) {
        localStorage.setItem("auth_user", JSON.stringify(user));
        localStorage.setItem("auth_token", tokens.accessToken);
        localStorage.setItem("auth_refresh_token", tokens.refreshToken);
      }

      setStore((prevStore) => ({
        ...prevStore,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
      }));
    },
    []
  );

  // Verificar se há tokens salvos ao inicializar
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const refreshToken = localStorage.getItem("auth_refresh_token");
    const user = localStorage.getItem("auth_user");

    if (token && refreshToken && user) {
      const userData = JSON.parse(user);
      handleUpdateStore(userData, { accessToken: token, refreshToken }, true);
    }
  }, [handleUpdateStore]);

  const login = useCallback(
    (
      tokens: { accessToken: string; refreshToken: string },
      user: IAuthUser,
      redirect = ""
    ) => {
      handleUpdateStore(user, tokens);

      // Redirecionar para a página desejada ou para o dashboard
      const targetPath = redirect || "/dashboard";
      navigate(targetPath);
    },
    [handleUpdateStore, navigate]
  );

  const loginWithGoogle = useCallback(
    async (googleResponse: { access_token: string }) => {
      try {
        // Extrair o access token da resposta do Google
        const accessToken = googleResponse.access_token;

        // Chamar o backend com o access token
        const authResponse = await postAuthGoogle({ accessToken });

        if (authResponse.accessToken && authResponse.refreshToken) {
          // Usuário existente - login bem-sucedido
          const user: IAuthUser = {
            id: "temp-id", // O backend deve retornar o ID real
            name: "Usuário Google",
            email: "user@google.com",
          };

          login(
            {
              accessToken: authResponse.accessToken,
              refreshToken: authResponse.refreshToken,
            },
            user
          );
        } else if (authResponse.newAccount) {
          // Usuário novo - redirecionar para completar perfil
          navigate("/completar-perfil", {
            state: {
              googleUser: authResponse.newAccount,
            },
          });
        }
      } catch (error) {
        console.error("Erro na autenticação Google:", error);
        throw error;
      }
    },
    [login, navigate]
  );

  const logout = useCallback(() => {
    // Limpar estado local
    setStore({
      token: null,
      refreshToken: null,
      user: null,
    });

    // Limpar localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
    localStorage.removeItem("auth_user");

    // Redirecionar para a página inicial
    navigate("/");
  }, [navigate]);

  const refreshAuth = useCallback(async () => {
    // Implementar refresh de token se necessário
    // Por enquanto, apenas retorna
    return Promise.resolve();
  }, []);

  const value = useMemo((): IAuth => {
    return {
      store,
      login,
      loginWithGoogle,
      isLogged,
      logout,
      refreshAuth,
    };
  }, [store, login, loginWithGoogle, isLogged, logout, refreshAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
