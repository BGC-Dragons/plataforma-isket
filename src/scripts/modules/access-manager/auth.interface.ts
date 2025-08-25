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
}

export interface IAuth {
  store: IAuthStore;
  login: (
    tokens: { accessToken: string; refreshToken: string },
    user: IAuthUser,
    redirect?: string
  ) => void;
  loginWithGoogle: (googleResponse: Record<string, unknown>) => Promise<void>;
  isLogged: boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}
