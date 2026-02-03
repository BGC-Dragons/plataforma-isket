import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";

export interface IRegisterWithInviteRequest {
  token: string;
  name: string;
  password: string;
}

export interface IRegisterWithInviteResponse {
  accessToken: string;
  refreshToken: string;
}

export const postAuthRegisterWithInviteURL = "/auth/registerUserWithInvite";

export const postAuthRegisterWithInvite = (
  params: IRegisterWithInviteRequest
): Promise<AxiosResponse<IRegisterWithInviteResponse>> => {
  return isketApiClient.post<IRegisterWithInviteResponse>(
    postAuthRegisterWithInviteURL,
    params
  );
};
