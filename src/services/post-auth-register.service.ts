import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";

export interface IRegisterRequest {
  name: string;
  email: string;
  /** Obrigatório no cadastro por email; ignorado quando googleUserId está presente. */
  password: string;
  phone?: string;
  /** Código de verificação (email); no fluxo Google pode ser placeholder. */
  verificationCode: string;
  defaultCityStateCode: string;
  companyName?: string;
  companyId?: string;
  profileImg?: string;
  /** ID do Google (sub); quando presente, registro é por Google e o backend já devolve tokens. */
  googleUserId?: string;
}

export interface IRegisterResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IRegisterError {
  statusCode: number;
  message: string;
}

export const postAuthRegisterURL = `${endpoints.api}/auth/register`;

export const postAuthRegister = (
  params: IRegisterRequest
): Promise<AxiosResponse<IRegisterResponse>> => {
  return isketApiClient.post<IRegisterResponse>(postAuthRegisterURL, params);
};

export const useAuthedPostAuthRegister = () => {
  const auth = useAuth();
  const fn = useCallback(
    (params: IRegisterRequest) => postAuthRegister(params),
    [auth]
  );
  return fn;
};
