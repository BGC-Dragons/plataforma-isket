import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";
import { IGetUsersResponseSuccess } from "./get-users.service";

export const getUserURL = (id: string) => `${endpoints.api}/auth/users/${id}`;

export const getUser = (
  token: string,
  id: string
): Promise<AxiosResponse<IGetUsersResponseSuccess>> => {
  return axios.get<IGetUsersResponseSuccess>(getUserURL(id), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
