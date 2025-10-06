import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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
  return axios.post<IUserInvite[]>(postUsersInviteURL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
