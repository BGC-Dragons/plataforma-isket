import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import type { ErrorResponse } from "./models/error-response.interface";
import { endpoints } from "./helpers/endpoint.constant";
import mockAdapter from "./helpers/mock-adapter.function";

export interface IPostAuthLoginParams {
  username: string;
  password: string;
}

export interface IPostAuthLoginResponseSuccess {
  token: string;
}

export type IPostAuthLoginResponseError = ErrorResponse &
  (
    | {
        email?: never;
      }
    | {
        email: string;
      }
  );

export const postAuthLoginURL = `${endpoints.api}/auth/login`;

export const postAuthLogin = (
  params: IPostAuthLoginParams
): Promise<AxiosResponse<IPostAuthLoginResponseSuccess>> => {
  return axios.post<IPostAuthLoginResponseSuccess>(postAuthLoginURL, params);
};

//MOCK

const successResponse: IPostAuthLoginResponseSuccess = {
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjcxYWRkOThjLTZiNzgtNGYwZS04Y2ViLWEwMmYzODkyMWIzMiIsImlhdCI6MTYzNDM5MTUzNCwiZXhwIjoxNjM0MzkxNTM3fQ.ZoGrjWkWW7yU_cHxOCwS0iSoBHGpf5Fyd9aTT1O5B7A",
};

const errorResponse: IPostAuthLoginResponseError = {
  statusCode: 401,
  message: "Usuário ou senha incorretos.",
  error: "Usuário ou senha incorretos.",
};

const errorEmailValidationResponse: IPostAuthLoginResponseError = {
  statusCode: 401,
  email: "galiotto.dev@gmail.com",
  message: "Você precisa confirmar sua conta.",
  error: "Você precisa confirmar sua conta.",
};

/**
 * User this function to mock the request to postAuthLogin service
 */ export const mockPostAuthLogin = (url: string) => {
  mockAdapter.onPost(url).reply((config: AxiosRequestConfig<string>) => {
    const data: IPostAuthLoginParams = JSON.parse(
      config.data || ""
    ) as IPostAuthLoginParams;
    switch (true) {
      case data?.username === "12345678910" && data?.password === "123456":
        return [200, successResponse];
      case data?.username === "85262382053" && data?.password === "123456":
        return [401, errorEmailValidationResponse];
      default:
        return [401, errorResponse];
    }
  });
};
