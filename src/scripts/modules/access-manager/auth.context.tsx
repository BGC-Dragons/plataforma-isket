import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { postAuthGoogle } from "../../../services/post-auth-google.service";
import { postAuthRefreshToken } from "../../../services/post-auth-refresh-token.service";
import { setupAxiosInterceptors } from "../../../services/helpers/axios-interceptor.function";
import type { IAuthStore, IAuthUser } from "./auth.interface";
import type { IAuth } from "./auth-context.types";
import { AuthContext } from "./auth-context-definition";

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

  // Configurar interceptors do Axios
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  const handleUpdateStore = useCallback(
    (
      user: IAuthUser | null,
      accessToken: string,
      refreshToken: string,
      fromLocalStorage = false
    ) => {
      if (!fromLocalStorage) {
        localStorage.setItem("auth_user", JSON.stringify(user));
        localStorage.setItem("auth_token", accessToken);
        localStorage.setItem("auth_refresh_token", refreshToken);
      }

      setStore((store) => ({
        ...store,
        token: accessToken,
        refreshToken: refreshToken,
        user,
      }));
    },
    []
  );

  // Inicializar estado do localStorage
  useEffect(() => {
    const user = localStorage.getItem("auth_user");
    const token = localStorage.getItem("auth_token");
    const refreshToken = localStorage.getItem("auth_refresh_token");

    if (user && token && refreshToken) {
      const parsedUser = JSON.parse(user);
      handleUpdateStore(parsedUser, token, refreshToken, true);
    }
  }, [handleUpdateStore]);

  const login = useCallback(
    (
      tokens: { accessToken: string; refreshToken: string },
      user: IAuthUser
    ) => {
      handleUpdateStore(user, tokens.accessToken, tokens.refreshToken);
      navigate("/dashboard");
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
          // O backend deve retornar os dados reais do usuário
          const user: IAuthUser = {
            id: authResponse.user?.id || "temp-id",
            name: authResponse.user?.name || "Usuário Google",
            email: authResponse.user?.email || "",
            picture: authResponse.user?.picture,
            sub: authResponse.user?.sub,
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
    setStore({
      token: null,
      refreshToken: null,
      user: null,
    });
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
    localStorage.removeItem("auth_user");
    navigate("/");
  }, [navigate]);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      if (!store.refreshToken) {
        return false;
      }

      const response = await postAuthRefreshToken({
        refreshToken: store.refreshToken,
      });

      // Atualizar tokens
      handleUpdateStore(
        store.user,
        response.data.accessToken,
        response.data.refreshToken
      );

      return true;
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      logout();
      return false;
    }
  }, [store.refreshToken, store.user, handleUpdateStore, logout]);

  const isLogged = !!store.token;

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
