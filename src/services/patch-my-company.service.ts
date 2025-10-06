import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IPatchMyCompanyRequest {
  name?: string;
  nationalId?: string;
  profile?: {
    formattedAddress?: string;
    addressId?: string;
    imageURL?: string;
    phoneNumber?: string;
    email?: string;
    site?: string;
    gender?: string;
    birthday?: string;
  };
}

export interface IPatchMyCompanyResponseSuccess {
  id: string;
  name: string;
  nationalId: string;
  accountId: string;
  profile?: {
    formattedAddress?: string;
    addressId?: string;
    imageURL?: string;
    phoneNumber?: string;
    email?: string;
    site?: string;
    gender?: string;
    birthday?: string;
  };
  parentCompany?: IPatchMyCompanyResponseSuccess | null;
  parentCompanyId?: string;
  franchisor?: IPatchMyCompanyResponseSuccess | null;
  franchisorId?: string;
  branches: IPatchMyCompanyResponseSuccess[];
  franchises: IPatchMyCompanyResponseSuccess[];
  createdAt: string;
  updatedAt: string;
}

export const patchMyCompanyURL = `${endpoints.api}/auth/companies/my-company`;

export const patchMyCompany = (
  token: string,
  data: IPatchMyCompanyRequest
): Promise<AxiosResponse<IPatchMyCompanyResponseSuccess>> => {
  return axios.patch<IPatchMyCompanyResponseSuccess>(patchMyCompanyURL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
