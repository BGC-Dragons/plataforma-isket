import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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
  return axios.post<IMakeObjectPublicResponseSuccess>(
    postStorageMakeObjectPublicURL,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
