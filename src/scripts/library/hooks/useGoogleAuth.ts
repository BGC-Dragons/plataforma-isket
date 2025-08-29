import { useCallback, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";

interface UseGoogleAuthReturn {
  loginWithGoogle: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useGoogleAuth = (
  onSuccess: (response: { code: string }) => void,
  onError?: (error: string) => void
): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleGoogleSuccess = useCallback(
    async (response: { code: string }) => {
      try {
        setIsLoading(true);
        setError(null);

        // Chamar callback de sucesso com o code
        onSuccess(response);
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
    flow: "auth-code", // Mudança para fluxo de autorização
  });

  return {
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  };
};
