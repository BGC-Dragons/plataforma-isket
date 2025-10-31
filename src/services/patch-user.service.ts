import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IGetUsersResponseSuccess } from "./get-users.service";

export interface IPatchUserRequest {
  name?: string;
  personalId?: string;
  inactive?: boolean;
  profile?: {
    profileImgURL?: string;
  };
}

export const patchUserPATH = (id: string) => `/auth/users/${id}`;

export const patchUser = (
  token: string,
  id: string,
  data: IPatchUserRequest
): Promise<AxiosResponse<IGetUsersResponseSuccess>> => {
  return isketApiClient.patch<IGetUsersResponseSuccess>(
    patchUserPATH(id),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPatchUser = (id: string) => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IPatchUserRequest) =>
      patchUser(auth.store.token as string, id, data),
    [auth, id]
  );
  return fn;
};
