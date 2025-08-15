import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface ISendVerificationCodeRequest {
  emailOrPhone: string;
  method: "EMAIL" | "PHONE";
}

export interface ISendVerificationCodeResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
    expiresIn: number;
  };
}

export const postAuthSendVerificationCodeURL = `${endpoints.api}/auth/sendVerificationCode`;

export const postAuthSendVerificationCode = (
  params: ISendVerificationCodeRequest
): Promise<AxiosResponse<ISendVerificationCodeResponse>> => {
  return axios.post<ISendVerificationCodeResponse>(
    postAuthSendVerificationCodeURL,
    params
  );
};
