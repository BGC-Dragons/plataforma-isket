import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IPatchProfileRequest {
  name?: string;
  profile?: {
    email?: string;
    phoneNumber?: string;
    formattedAddress?: string;
    imageURL?: string;
  };
}

export interface IPatchProfileResponseSuccess {
  id: string;
  name: string;
  personalId: string | null;
  profile: {
    formattedAddress: string | null;
    addressId: string | null;
    imageURL: string | null;
    phoneNumber: string | null;
    email: string;
    site: string | null;
    gender: string | null;
    birthday: string | null;
  };
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
  accountId: string;
}

export const patchProfileURL = `${endpoints.api}/auth/profile`;

export const patchProfile = (
  token: string,
  data: IPatchProfileRequest
): Promise<AxiosResponse<IPatchProfileResponseSuccess>> => {
  return axios.patch<IPatchProfileResponseSuccess>(patchProfileURL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
