import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";

export interface IMakeObjectPublicRequest {
  filePath: string;
}

export interface IMakeObjectPublicResponseSuccess {
  message: string;
}

export const postStorageMakeObjectPublicURL = `${endpoints.api}/storage/make-object-public`;

export const postStorageMakeObjectPublic = (
  token: string,
  data: IMakeObjectPublicRequest
): Promise<AxiosResponse<IMakeObjectPublicResponseSuccess>> => {
  return isketApiClient.post<IMakeObjectPublicResponseSuccess>(
    postStorageMakeObjectPublicURL,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPostStorageMakeObjectPublic = () => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IMakeObjectPublicRequest) =>
      postStorageMakeObjectPublic(auth.store.token as string, data),
    [auth]
  );
  return fn;
};
