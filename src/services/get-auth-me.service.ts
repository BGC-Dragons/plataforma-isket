import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IGetAuthMeResponseSuccess {
  id: string;
  accountId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export const getAuthMeURL = `${endpoints.api}/auth/profile`;

export const getAuthMe = (
  token: string
): Promise<AxiosResponse<IGetAuthMeResponseSuccess>> => {
  return axios.get<IGetAuthMeResponseSuccess>(getAuthMeURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
