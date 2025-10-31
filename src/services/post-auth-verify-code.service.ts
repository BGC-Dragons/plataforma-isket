import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
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
  return isketApiClient.post<IVerifyCodeResponse>(postAuthVerifyCodeURL, params);
};
