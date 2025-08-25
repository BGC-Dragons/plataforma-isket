import axios from "axios";
import { postAuthRefreshToken } from "../post-auth-refresh-token.service";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

export const setupAxiosInterceptors = () => {
  // Interceptor para adicionar token em todas as requisições
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor para lidar com tokens expirados
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Se já está renovando, adiciona à fila
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem("auth_refresh_token");

        if (!refreshToken) {
          processQueue(new Error("Sem refresh token"), null);
          isRefreshing = false;
          // Redirecionar para login
          window.location.href = "/";
          return Promise.reject(error);
        }

        try {
          const response = await postAuthRefreshToken({ refreshToken });

          // Atualizar tokens no localStorage
          localStorage.setItem("auth_token", response.data.accessToken);
          localStorage.setItem(
            "auth_refresh_token",
            response.data.refreshToken
          );

          // Atualizar header da requisição original
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

          // Processar fila de requisições pendentes
          processQueue(null, response.data.accessToken);

          // Retry da requisição original
          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);

          // Limpar tokens e redirecionar para login
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_refresh_token");
          localStorage.removeItem("auth_user");

          window.location.href = "/";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
