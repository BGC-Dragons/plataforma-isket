import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IRecoveryPasswordRequest {
  email: string;
}

export interface IRecoveryPasswordResponse {
  status: number;
  message: string;
}

export const postAuthRecoveryPasswordURL = `${endpoints.api}/auth/recoveryPassword`;

export const postAuthRecoveryPassword = (
  data: IRecoveryPasswordRequest
): Promise<AxiosResponse<IRecoveryPasswordResponse>> => {
  return axios.post<IRecoveryPasswordResponse>(
    postAuthRecoveryPasswordURL,
    data
  );
};
