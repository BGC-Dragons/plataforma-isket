import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export const deleteUserPATH = (id: string) => `/auth/users/${id}`;

export const deleteUser = (
  token: string,
  id: string
): Promise<AxiosResponse<void>> => {
  return isketApiClient.delete<void>(deleteUserPATH(id), {
    headers: getHeader({ token }),
  });
};
