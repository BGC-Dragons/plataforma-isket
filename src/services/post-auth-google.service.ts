import { getHeader } from "./helpers/get-header-function";
import { isketApiClient } from "./clients/isket-api.client";
import axios from "axios";

export interface IPostAuthGoogleParams {
  code: string;
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
