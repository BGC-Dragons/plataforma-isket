import type { IAuthStore, IAuthUser } from "./auth.interface";

export interface IAuth {
  store: IAuthStore;
  login: (
    tokens: { accessToken: string; refreshToken: string },
    user: IAuthUser,
    redirect?: string
  ) => void;
  loginWithGoogle: (googleResponse: { code: string }) => Promise<void>;
  isLogged: boolean;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  isValidating: boolean;
}
