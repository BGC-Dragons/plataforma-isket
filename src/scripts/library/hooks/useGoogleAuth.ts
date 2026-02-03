import { useCallback, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";

interface UseGoogleAuthReturn {
  loginWithGoogle: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useGoogleAuth = (
  onSuccess: (response: { code: string }) => void | Promise<void>,
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
        await onSuccess(response);
      } catch (err) {
        let errorMessage =
          err instanceof Error
            ? err.message
            : "Erro na autenticação com Google";

        // Traduzir erro de usuário inativo
        if (errorMessage === "INACTIVE_USER") {
          errorMessage =
            "Sua conta foi desativada. Entre em contato com o administrador.";
        }

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
