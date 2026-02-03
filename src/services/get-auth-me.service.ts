import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

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
  email: string;
  inactive: boolean;
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

export const getAuthMePATH = "/auth/profile";

export const getAuthMe = (
  token: string
): Promise<AxiosResponse<IGetAuthMeResponseSuccess>> => {
  return isketApiClient.get<IGetAuthMeResponseSuccess>(getAuthMePATH, {
    headers: getHeader({ token }),
  });
};

export const useAuthedGetAuthMe = () => {
  const auth = useAuth();
  const fn = useCallback(() => getAuthMe(auth.store.token as string), [auth]);
  return fn;
};

export const useGetAuthMe = () => {
  const fetcher = useAuthedGetAuthMe();
  const auth = useAuth();
  // Incluir userId na chave para isolamento entre usuários
  const cacheKey = auth.store.user?.id
    ? [getAuthMePATH, auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

// Função para invalidar cache de auth
export const clearAuthMeCache = () => {
  mutate(getAuthMePATH);
  mutate((key) => Array.isArray(key) && key[0] === getAuthMePATH);
};
