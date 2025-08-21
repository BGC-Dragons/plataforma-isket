import axios from "axios";
import { getHeader } from "./helpers/get-header-function";
import { endpoints } from "./helpers/endpoint.constant";

export interface GoogleAuthRequest {
  code?: string;
  idToken?: string;
  accessToken?: string;
}

export interface GoogleAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  newAccount?: {
    name: string;
    picture: string;
    sub: string;
    email: string;
  };
}

export const postAuthGoogle = async (
  data: GoogleAuthRequest
): Promise<GoogleAuthResponse> => {
  try {
    const response = await axios.post<GoogleAuthResponse>(
      `${endpoints}/auth/signInGoogle`,
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
