import axios, { type AxiosResponse } from "axios";
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
  return axios.post<IPostAuthLoginResponseSuccess>(postAuthLoginURL, params);
};
