import { mutate } from "swr";
import { getAuthMePATH } from "../get-auth-me.service";
import { getPurchasesPATH } from "../get-purchases.service";
import { getMyCompanyPATH } from "../get-my-company.service";
import { getUsersPATH } from "../get-users.service";

/**
 * Limpa todo o cache do SWR relacionado a dados do usuário autenticado.
 * Deve ser chamado no logout e login para evitar mostrar dados de usuários diferentes.
 */
export const clearAllUserDataCache = () => {
  // Limpar cache usando os PATHs diretamente
  mutate(getAuthMePATH);
  mutate(getPurchasesPATH);
  mutate(getMyCompanyPATH);
  mutate(getUsersPATH);

  // Limpar cache usando funções de filtro para pegar todas as variantes
  mutate((key) => Array.isArray(key) && key[0] === getAuthMePATH);
  mutate((key) => Array.isArray(key) && key[0] === getPurchasesPATH);
  mutate((key) => Array.isArray(key) && key[0] === getMyCompanyPATH);
  mutate((key) => Array.isArray(key) && key[0] === getUsersPATH);

  // Limpar cache de rotas dinâmicas
  mutate((key) => {
    if (Array.isArray(key) && typeof key[0] === "string") {
      return (
        key[0].startsWith("/auth/users/") ||
        key[0].startsWith("/dashboard/users/")
      );
    }
    if (typeof key === "string") {
      return (
        key.startsWith("/auth/users/") || key.startsWith("/dashboard/users/")
      );
    }
    return false;
  });

  // Limpar todo o cache (última opção, mais agressivo)
  mutate(() => true);
};

