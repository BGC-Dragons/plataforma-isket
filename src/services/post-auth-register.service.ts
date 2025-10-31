import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  verificationCode: string;
  defaultCityStateCode: string;
  companyName?: string;
  companyId?: string;
  profileImg?: string;
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
