import { getHeader } from "./helpers/get-header-function";
import { isketApiClient } from "./clients/isket-api.client";
import axios from "axios";

/**
 * Body da requisição signInGoogle (SignInGoogleDto).
 * É necessário um dos dois: code ou idToken.
 * - code: fluxo OAuth (redirect); o backend troca por tokens no Google.
 * - idToken: fluxo One Tap / Sign-In; o backend valida em tokeninfo.
 * O code é de uso único: não reenviar o mesmo code em retry.
 */
export interface IPostAuthGoogleParams {
  /** Código de autorização (fluxo OAuth com redirect). Uso único. */
  code?: string;
  /** ID Token (fluxo One Tap / Sign-In). */
  idToken?: string;
  /** Access token do Google (opcional). */
  accessToken?: string;
  /** URI de redirect (opcional; o backend pode usar GOOGLE_REDIRECT_URI do env). */
  redirectUri?: string;
}

export interface GoogleAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    sub?: string;
  };
  /** Quando o usuário não existe; front deve abrir tela de conclusão de cadastro. */
  newAccount?: {
    name: string;
    picture: string;
    sub: string;
    email: string;
  };
}

export const postAuthGoogle = async (
  data: IPostAuthGoogleParams
): Promise<GoogleAuthResponse> => {
  if (!data.code && !data.idToken) {
    throw new Error("É necessário enviar code ou idToken.");
  }
  try {
    const response = await isketApiClient.post<GoogleAuthResponse>(
      `/auth/signInGoogle`,
      data,
      {
        headers: getHeader(),
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Erro na autenticação com Google"
      );
    }
    throw new Error("Erro inesperado na autenticação com Google");
  }
};
