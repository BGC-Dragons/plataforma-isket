import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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
  return axios.post<IRegisterResponse>(postAuthRegisterURL, params);
};
