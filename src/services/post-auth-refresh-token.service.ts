import { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";

export interface IPostAuthRefreshTokenParams {
  refreshToken: string;
}

export interface IPostAuthRefreshTokenResponseSuccess {
  accessToken: string;
  refreshToken: string;
}

export const postAuthRefreshTokenURL = `${endpoints.api}/auth/refreshToken`;

export const postAuthRefreshToken = (
  params: IPostAuthRefreshTokenParams
): Promise<AxiosResponse<IPostAuthRefreshTokenResponseSuccess>> => {
  return isketApiClient.post<IPostAuthRefreshTokenResponseSuccess>(
    postAuthRefreshTokenURL,
    params
  );
};
