import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { postAuthGoogle } from "../../../services/post-auth-google.service";
import { postAuthRefreshToken } from "../../../services/post-auth-refresh-token.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import { setupAxiosInterceptors } from "../../../services/helpers/axios-interceptor.function";
import type { IAuthStore, IAuthUser } from "./auth.interface";
import type { IAuth } from "./auth-context.types";
import { AuthContext } from "./auth-context-definition";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [store, setStore] = useState<IAuthStore>({
    token: null,
    refreshToken: null,
    user: null,
  });
  const [isValidating, setIsValidating] = useState(true);

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

  const validateToken = useCallback(async (token: string) => {
    try {
      const response = await getAuthMe(token);
      const userData = response.data;

      const user: IAuthUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        picture: undefined,
        sub: undefined,
      };

      return user;
    } catch (error) {
      console.error("Token inválido:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("auth_token");
      const refreshToken = localStorage.getItem("auth_refresh_token");

      if (token && refreshToken) {
        const user = await validateToken(token);

        if (user) {
          handleUpdateStore(user, token, refreshToken, true);
        } else {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_refresh_token");
          localStorage.removeItem("auth_user");
        }
      }

      setIsValidating(false);
    };

    initializeAuth();
  }, [validateToken, handleUpdateStore]);

  const login = useCallback(
    (
      tokens: { accessToken: string; refreshToken: string },
      user: IAuthUser,
      redirect?: string
    ) => {
      handleUpdateStore(user, tokens.accessToken, tokens.refreshToken);
      navigate(redirect || "/dashboard");
    },
    [handleUpdateStore, navigate]
  );

  const loginWithGoogle = useCallback(
    async (googleResponse: { code: string }) => {
      try {
        // Extrair o code da resposta do Google
        const code = googleResponse.code;

        // Chamar o backend com o code
        const authResponse = await postAuthGoogle({ code });

        if (authResponse.accessToken && authResponse.refreshToken) {
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
    navigate("/login");
  }, [navigate]);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      if (!store.refreshToken) {
        return false;
      }

      const response = await postAuthRefreshToken({
        refreshToken: store.refreshToken,
      });

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

  const isLogged = !!store.token && !isValidating;

  const value = useMemo((): IAuth => {
    return {
      store,
      login,
      loginWithGoogle,
      isLogged,
      logout,
      refreshAuth,
      isValidating,
    };
  }, [
    store,
    login,
    loginWithGoogle,
    isLogged,
    logout,
    refreshAuth,
    isValidating,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
