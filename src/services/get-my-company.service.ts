import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

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

export const getMyCompanyPATH = "/auth/companies/my-company";

export const getMyCompany = (
  token: string
): Promise<AxiosResponse<IGetMyCompanyResponseSuccess>> => {
  return isketApiClient.get<IGetMyCompanyResponseSuccess>(getMyCompanyPATH, {
    headers: getHeader({ token }),
  });
};

export const useAuthedGetMyCompany = () => {
  const auth = useAuth();
  const fn = useCallback(
    () => getMyCompany(auth.store.token as string),
    [auth]
  );
  return fn;
};

export const useGetMyCompany = () => {
  const fetcher = useAuthedGetMyCompany();
  const auth = useAuth();
  // Incluir userId na chave para isolamento entre usuários
  const cacheKey = auth.store.user?.id
    ? [getMyCompanyPATH, auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

// Função para invalidar cache de company
export const clearMyCompanyCache = () => {
  mutate(getMyCompanyPATH);
  mutate((key) => Array.isArray(key) && key[0] === getMyCompanyPATH);
};
