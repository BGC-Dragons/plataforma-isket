import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IPatchProfileRequest {
  name?: string;
  profile?: {
    email?: string;
    phoneNumber?: string;
    formattedAddress?: string;
    imageURL?: string;
  };
}

export interface IPatchProfileResponseSuccess {
  id: string;
  name: string;
  personalId: string | null;
  profile: {
    formattedAddress: string | null;
    addressId: string | null;
    imageURL: string | null;
    phoneNumber: string | null;
    email: string;
    site: string | null;
    gender: string | null;
    birthday: string | null;
  };
  inactive: boolean;
  createdAt: string;
  updatedAt: string;
  accountId: string;
}

export const patchProfilePATH = "/auth/profile";

export const patchProfile = (
  token: string,
  data: IPatchProfileRequest
): Promise<AxiosResponse<IPatchProfileResponseSuccess>> => {
  return isketApiClient.patch<IPatchProfileResponseSuccess>(
    patchProfilePATH,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPatchProfile = () => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IPatchProfileRequest) =>
      patchProfile(auth.store.token as string, data),
    [auth]
  );
  return fn;
};
