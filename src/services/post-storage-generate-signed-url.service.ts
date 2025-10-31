import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";

export type TypeUpload = "USER_PROFILE_IMG" | "COMPANY_PROFILE_IMG";

export interface IGenerateSignedUrlRequest {
  filename: string;
  typeUpload: TypeUpload;
  contentType: string;
}

export interface IGenerateSignedUrlResponseSuccess {
  signedUrl: string;
  publicUrl: string;
}

export const postStorageGenerateSignedUrlURL = `${endpoints.api}/storage/generate-signed-url`;

export const postStorageGenerateSignedUrl = (
  token: string,
  data: IGenerateSignedUrlRequest
): Promise<AxiosResponse<IGenerateSignedUrlResponseSuccess>> => {
  return isketApiClient.post<IGenerateSignedUrlResponseSuccess>(
    postStorageGenerateSignedUrlURL,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPostStorageGenerateSignedUrl = () => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IGenerateSignedUrlRequest) =>
      postStorageGenerateSignedUrl(auth.store.token as string, data),
    [auth]
  );
  return fn;
};
