import type { IAuthStore, IAuthUser } from "./auth.interface";

export interface IAuth {
  store: IAuthStore;
  login: (
    tokens: { accessToken: string; refreshToken: string },
    user: IAuthUser,
    redirect?: string
  ) => void;
  /** code (fluxo OAuth) ou idToken (fluxo One Tap). O code é de uso único. */
  loginWithGoogle: (
    googleResponse: { code?: string; idToken?: string; accessToken?: string }
  ) => Promise<void>;
  isLogged: boolean;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  isValidating: boolean;
  clearSubscriptionBlocked: () => void;
}
