import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { postAuthGoogle } from "../../../services/post-auth-google.service";
import { postAuthRefreshToken } from "../../../services/post-auth-refresh-token.service";
import { getAuthMe } from "../../../services/get-auth-me.service";
import { clearAllUserDataCache } from "../../../services/helpers/clear-swr-cache.function";
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
    subscriptionBlocked: false,
  });
  const [isValidating, setIsValidating] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        email: userData.profile.email,
        picture: userData.profile.imageURL || undefined,
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
      // Limpar cache do SWR antes de fazer login para evitar mostrar dados de usuário anterior
      clearAllUserDataCache();

      // Marcar que estamos fazendo login para evitar interferências
      setIsLoggingIn(true);
      setIsValidating(false);
      handleUpdateStore(user, tokens.accessToken, tokens.refreshToken);

      // Aguardar um tick para garantir que o estado foi atualizado
      setTimeout(() => {
        setIsLoggingIn(false);
        navigate(redirect || "/pesquisar-anuncios");
      }, 0);
    },
    [handleUpdateStore, navigate]
  );

  const loginWithGoogle = useCallback(
    async (googleResponse: {
      code?: string;
      idToken?: string;
      accessToken?: string;
    }) => {
      try {
        // SignInGoogleDto: code ou idToken (um dos dois). O code é de uso único.
        const redirectUri = window.location.origin;
        const body =
          googleResponse.code != null
            ? { code: googleResponse.code, redirectUri }
            : googleResponse.idToken != null
              ? {
                  idToken: googleResponse.idToken,
                  accessToken: googleResponse.accessToken,
                }
              : null;

        if (!body) {
          throw new Error("É necessário enviar code ou idToken.");
        }

        const authResponse = await postAuthGoogle(body);

        if (authResponse.accessToken && authResponse.refreshToken) {
          const accessToken = authResponse.accessToken;
          const refreshToken = authResponse.refreshToken;

          try {
            const userResponse = await getAuthMe(accessToken);
            const userData = userResponse.data;

            const user: IAuthUser = {
              id: userData.id,
              name: userData.name,
              email: userData.profile.email,
              picture: userData.profile.imageURL || undefined,
              sub: authResponse.user?.sub,
            };

            login(
              { accessToken, refreshToken },
              user
            );
          } catch (userError: unknown) {
            const axiosError = userError as {
              response?: {
                data?: {
                  error?: string;
                  message?: string;
                  statusCode?: number;
                };
              };
            };

            if (
              axiosError.response?.data?.error === "ForbiddenException" ||
              axiosError.response?.data?.message ===
                "Your subscription has expired. Please update your payment method." ||
              axiosError.response?.data?.statusCode === 403
            ) {
              setStore((prev) => ({ ...prev, subscriptionBlocked: true }));
              return;
            }

            const user: IAuthUser = {
              id: authResponse.user?.id || "temp-id",
              name: authResponse.user?.name || "Usuário Google",
              email: authResponse.user?.email || "",
              picture: authResponse.user?.picture,
              sub: authResponse.user?.sub,
            };

            login({ accessToken, refreshToken }, user);
          }
        } else if (authResponse.newAccount) {
          setIsValidating(false);
          navigate("/complete-profile", {
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

  const clearSubscriptionBlocked = useCallback(() => {
    setStore((prev) => ({ ...prev, subscriptionBlocked: false }));
  }, []);

  const logout = useCallback(() => {
    clearAllUserDataCache();

    setStore({
      token: null,
      refreshToken: null,
      user: null,
      subscriptionBlocked: false,
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

  const isLogged = !!store.token && !isValidating && !isLoggingIn;

  const value = useMemo((): IAuth => {
    return {
      store,
      login,
      loginWithGoogle,
      isLogged,
      logout,
      refreshAuth,
      isValidating,
      clearSubscriptionBlocked,
    };
  }, [
    store,
    login,
    loginWithGoogle,
    isLogged,
    logout,
    refreshAuth,
    isValidating,
    clearSubscriptionBlocked,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
