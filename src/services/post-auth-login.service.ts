import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import type { ErrorResponse } from "react-router";
import { endpoints } from "./helpers/endpoint.constant";

export interface IPostAuthLoginParams {
  authenticator: string;
  pass: string;
}

export interface IPostAuthLoginResponseSuccess {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export type IPostAuthLoginResponseError = ErrorResponse & {
  authenticator?: string;
};

export const postAuthLoginURL = `${endpoints.api}/auth/login`;

export const postAuthLogin = (
  params: IPostAuthLoginParams
): Promise<AxiosResponse<IPostAuthLoginResponseSuccess>> => {
  return isketApiClient.post<IPostAuthLoginResponseSuccess>(
    postAuthLoginURL,
    params
  );
};
