import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";
import type { IGetUsersResponseSuccess } from "./get-users.service";

export interface IPatchUserRequest {
  name?: string;
  personalId?: string;
  inactive?: boolean;
  profile?: {
    profileImgURL?: string;
  };
}

export const patchUserURL = (id: string) => `${endpoints.api}/auth/users/${id}`;

export const patchUser = (
  token: string,
  id: string,
  data: IPatchUserRequest
): Promise<AxiosResponse<IGetUsersResponseSuccess>> => {
  return axios.patch<IGetUsersResponseSuccess>(patchUserURL(id), data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
