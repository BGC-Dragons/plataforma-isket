import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IGetAuthMeResponseSuccess {
  account: {
    company: string | null;
    createdAt: string;
    id: string;
    type: string;
    updatedAt: string;
  };
  accountId: string;
  authMethods: Array<{
    method: string;
    value: string;
  }>;
  createdAt: string;
  id: string;
  inactive: string | null;
  name: string;
  personalId: string | null;
  profile: {
    addressId: string | null;
    birthday: string | null;
    email: string;
    formattedAddress: string | null;
    gender: string | null;
    imageURL: string | null;
    phoneNumber: string | null;
    site: string | null;
  };
  roles: Array<{
    id: string;
    role: string;
    userId: string;
  }>;
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
