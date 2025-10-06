import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IGetMyCompanyResponseSuccess {
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
  parentCompany?: IGetMyCompanyResponseSuccess | null;
  parentCompanyId?: string;
  franchisor?: IGetMyCompanyResponseSuccess | null;
  franchisorId?: string;
  branches: IGetMyCompanyResponseSuccess[];
  franchises: IGetMyCompanyResponseSuccess[];
  createdAt: string;
  updatedAt: string;
}

export const getMyCompanyURL = `${endpoints.api}/auth/companies/my-company`;

export const getMyCompany = (
  token: string
): Promise<AxiosResponse<IGetMyCompanyResponseSuccess>> => {
  return axios.get<IGetMyCompanyResponseSuccess>(getMyCompanyURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
