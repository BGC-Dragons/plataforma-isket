import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import type { IGetUsersResponseSuccess } from "./get-users.service";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export const getUserPATH = (id: string) => `/auth/users/${id}`;

export const getUser = (
  token: string,
  id: string
): Promise<AxiosResponse<IGetUsersResponseSuccess>> => {
  return isketApiClient.get<IGetUsersResponseSuccess>(getUserPATH(id), {
    headers: getHeader({ token }),
  });
};

export const useAuthedGetUser = (id: string) => {
  const auth = useAuth();
  const fn = useCallback(
    () => getUser(auth.store.token as string, id),
    [auth, id]
  );
  return fn;
};

export const useGetUser = (id: string) => {
  const fetcher = useAuthedGetUser(id);
  const auth = useAuth();
  // Incluir userId na chave para isolamento entre usuários
  const cacheKey = auth.store.user?.id
    ? [getUserPATH(id), auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

// Função para invalidar cache de user específico
export const clearUserCache = (userId?: string) => {
  if (userId) {
    mutate(getUserPATH(userId));
    mutate([getUserPATH(userId), "*"]);
  }
  mutate((key) => {
    if (Array.isArray(key) && typeof key[0] === "string") {
      return key[0].startsWith("/auth/users/");
    }
    if (typeof key === "string") {
      return key.startsWith("/auth/users/");
    }
    return false;
  });
};
