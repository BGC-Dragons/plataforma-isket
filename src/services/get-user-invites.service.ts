import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IUserInviteResponse {
  id: string;
  email: string;
  token: string;
  accountId: string;
  inviterId: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getUserInvitesPATH = "/auth/users/invites";

export const getUserInvites = (
  token: string
): Promise<AxiosResponse<IUserInviteResponse[]>> => {
  return isketApiClient.get<IUserInviteResponse[]>(getUserInvitesPATH, {
    headers: getHeader({ token }),
  });
};

export const useAuthedGetUserInvites = () => {
  const auth = useAuth();
  const fn = useCallback(
    () => getUserInvites(auth.store.token as string),
    [auth]
  );
  return fn;
};

export const useGetUserInvites = () => {
  const fetcher = useAuthedGetUserInvites();
  const auth = useAuth();
  const cacheKey = auth.store.user?.id
    ? [getUserInvitesPATH, auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

export const clearUserInvitesCache = () => {
  mutate(getUserInvitesPATH);
  mutate((key) => Array.isArray(key) && key[0] === getUserInvitesPATH);
};
