import { useCallback, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { postAuthGoogle } from "../../../services/post-auth-google.service";
import type { GoogleAuthResponse } from "../../../services/post-auth-google.service";

interface UseGoogleAuthReturn {
  loginWithGoogle: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useGoogleAuth = (
  onSuccess: (response: GoogleAuthResponse) => void,
  onError?: (error: string) => void
): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleGoogleSuccess = useCallback(
    async (response: { access_token: string }) => {
      try {
        setIsLoading(true);
        setError(null);

        // Extrair o access token da resposta do Google
        const accessToken = response.access_token;

        // Chamar o backend com o access token
        const authResponse = await postAuthGoogle({ accessToken });

        // Chamar callback de sucesso
        onSuccess(authResponse);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro na autenticação com Google";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      const errorMessage = "Erro ao fazer login com Google";
      setError(errorMessage);
      onError?.(errorMessage);
    },
    flow: "implicit",
  });

  return {
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  };
};
