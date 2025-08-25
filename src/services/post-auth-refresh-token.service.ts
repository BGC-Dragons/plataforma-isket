import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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
  return axios.post<IPostAuthRefreshTokenResponseSuccess>(
    postAuthRefreshTokenURL,
    params
  );
};
