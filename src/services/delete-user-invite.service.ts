import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export const deleteUserInvite = (
  token: string,
  inviteId: string
): Promise<AxiosResponse<void>> => {
  return isketApiClient.delete<void>(`/auth/users/invites/${inviteId}`, {
    headers: getHeader({ token }),
  });
};
