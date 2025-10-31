import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { getHeader } from "./helpers/get-header-function";

export interface IPostUsersInviteRequest {
  emails: string[];
}

export interface IUserInvite {
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

export const postUsersInviteURL = `${endpoints.api}/auth/users/invite`;

export const postUsersInvite = (
  token: string,
  data: IPostUsersInviteRequest
): Promise<AxiosResponse<IUserInvite[]>> => {
  return isketApiClient.post<IUserInvite[]>(postUsersInviteURL, data, {
    headers: getHeader({ token }),
  });
};

export const useAuthedPostUsersInvite = () => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IPostUsersInviteRequest) =>
      postUsersInvite(auth.store.token as string, data),
    [auth]
  );
  return fn;
};
