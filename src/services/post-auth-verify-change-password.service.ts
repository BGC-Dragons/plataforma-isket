import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IVerifyChangePasswordRequest {
  token: string;
  password: string;
}

export interface IVerifyChangePasswordResponse {
  status: number;
  message: string;
}

export const postAuthVerifyChangePasswordURL = `${endpoints.api}/auth/verifyAndChangePassword`;

export const postAuthVerifyChangePassword = (
  data: IVerifyChangePasswordRequest
): Promise<AxiosResponse<IVerifyChangePasswordResponse>> => {
  return axios.post<IVerifyChangePasswordResponse>(
    postAuthVerifyChangePasswordURL,
    data
  );
};
