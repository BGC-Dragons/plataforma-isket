import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
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
  return isketApiClient.post<IRecoveryPasswordResponse>(
    postAuthRecoveryPasswordURL,
    data
  );
};
