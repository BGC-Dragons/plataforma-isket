import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IPatchMyCompanyRequest {
  name?: string;
  nationalId?: string;
  profile?: {
    formattedAddress?: string;
    addressId?: string;
    imageURL?: string;
    phoneNumber?: string;
    email?: string;
    site?: string;
    gender?: string;
    birthday?: string;
  };
}

export interface IPatchMyCompanyResponseSuccess {
  id: string;
  name: string;
  nationalId: string;
  accountId: string;
  profile?: {
    formattedAddress?: string;
    addressId?: string;
    imageURL?: string;
    phoneNumber?: string;
    email?: string;
    site?: string;
    gender?: string;
    birthday?: string;
  };
  parentCompany?: IPatchMyCompanyResponseSuccess | null;
  parentCompanyId?: string;
  franchisor?: IPatchMyCompanyResponseSuccess | null;
  franchisorId?: string;
  branches: IPatchMyCompanyResponseSuccess[];
  franchises: IPatchMyCompanyResponseSuccess[];
  createdAt: string;
  updatedAt: string;
}

export const patchMyCompanyPATH = "/auth/companies/my-company";

export const patchMyCompany = (
  token: string,
  data: IPatchMyCompanyRequest
): Promise<AxiosResponse<IPatchMyCompanyResponseSuccess>> => {
  return isketApiClient.patch<IPatchMyCompanyResponseSuccess>(
    patchMyCompanyPATH,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPatchMyCompany = () => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IPatchMyCompanyRequest) =>
      patchMyCompany(auth.store.token as string, data),
    [auth]
  );
  return fn;
};
