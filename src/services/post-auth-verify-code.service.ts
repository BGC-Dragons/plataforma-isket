import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IVerifyCodeRequest {
  emailOrPhone: string;
  code: string;
  method: "EMAIL" | "PHONE";
}

export interface IVerifyCodeResponse {
  message: string;
}

export interface IVerifyCodeError {
  statusCode: number;
  message: string;
}

export const postAuthVerifyCodeURL = `${endpoints.api}/auth/verifyCode`;

export const postAuthVerifyCode = (
  params: IVerifyCodeRequest
): Promise<AxiosResponse<IVerifyCodeResponse>> => {
  return axios.post<IVerifyCodeResponse>(postAuthVerifyCodeURL, params);
};
