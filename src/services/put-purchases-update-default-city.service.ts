import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { getHeader } from "./helpers/get-header-function";
import { type IGetPurchasesResponseSuccess } from "./get-purchases.service";

export interface IUpdateDefaultCityRequest {
  defaultCityStateCode: string;
}

export interface IUpdateDefaultCityResponseSuccess {
  status: "SUCCESS";
  data: IGetPurchasesResponseSuccess;
  message: string;
}

export const putPurchasesUpdateDefaultCityURL = (id: string) =>
  `${endpoints.api}/payments/purchases/update-default-city/${id}`;

export const putPurchasesUpdateDefaultCity = (
  id: string,
  data: IUpdateDefaultCityRequest,
  token: string
): Promise<AxiosResponse<IUpdateDefaultCityResponseSuccess>> => {
  return isketApiClient.put<IUpdateDefaultCityResponseSuccess>(
    `/payments/purchases/update-default-city/${id}`,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPutPurchasesUpdateDefaultCity = (id: string) => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IUpdateDefaultCityRequest) =>
      putPurchasesUpdateDefaultCity(id, data, auth.store.token as string),
    [auth, id]
  );
  return fn;
};
