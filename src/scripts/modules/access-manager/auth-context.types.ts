import type { IAuthStore, IAuthUser } from "./auth.interface";

export interface IAuth {
  store: IAuthStore;
  login: (
    tokens: { accessToken: string; refreshToken: string },
    user: IAuthUser
  ) => void;
  loginWithGoogle: (googleResponse: { access_token: string }) => Promise<void>;
  isLogged: boolean;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}
