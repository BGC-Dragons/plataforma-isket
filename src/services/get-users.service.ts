import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

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

export const getUsersPATH = "/auth/users";

export const getUsers = (
  token: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }
): Promise<AxiosResponse<IGetUsersResponseSuccess[]>> => {
  return isketApiClient.get<IGetUsersResponseSuccess[]>(getUsersPATH, {
    headers: getHeader({ token }),
    params,
  });
};

export const useAuthedGetUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const auth = useAuth();
  const fn = useCallback(
    () => getUsers(auth.store.token as string, params),
    [auth, params?.page, params?.limit, params?.search, params?.role]
  );
  return fn;
};

export const useGetUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const fetcher = useAuthedGetUsers(params);
  const auth = useAuth();
  // Incluir userId na chave para isolamento entre usuários
  const cacheKey = auth.store.user?.id
    ? [getUsersPATH, auth.store.user.id, params]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

// Função para invalidar cache de users
export const clearUsersCache = () => {
  mutate(getUsersPATH);
  mutate((key) => Array.isArray(key) && key[0] === getUsersPATH);
};
