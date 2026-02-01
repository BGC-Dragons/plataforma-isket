export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  sub?: string; // Google ID
}

export interface IAuthStore {
  token: string | null;
  refreshToken: string | null;
  user: IAuthUser | null;
  /** Exibido quando getAuthMe retorna 403 (assinatura expirada), ex.: após login com Google. */
  subscriptionBlocked: boolean;
}
