import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export interface IUserRole {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  userId: string;
}

export interface IUserProfile {
  profileImgURL?: string;
  email?: string;
  phoneNumber?: string;
  userId: string;
}

export interface IAuthMethod {
  method: "EMAIL" | "PHONE" | "GOOGLE";
  value: string;
}

export interface ICompany {
  id: string;
  name: string;
  nationalId: string;
}

export interface IAccount {
  id: string;
  type: "BUSINESS" | "INDEPENDENT";
  company?: ICompany;
}

export interface IGetUsersResponseSuccess {
  id: string;
  name: string;
  personalId?: string;
  inactive?: boolean;
  accountId: string;
  profile?: IUserProfile;
  account?: IAccount;
  authMethods?: IAuthMethod[];
  roles: IUserRole[];
  createdAt: string;
  updatedAt: string;
}

export const getUsersURL = `${endpoints.api}/auth/users`;

export const getUsers = (
  token: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }
): Promise<AxiosResponse<IGetUsersResponseSuccess[]>> => {
  return axios.get<IGetUsersResponseSuccess[]>(getUsersURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
};
