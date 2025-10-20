import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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
  return axios.post<IGenerateSignedUrlResponseSuccess>(
    postStorageGenerateSignedUrlURL,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
