import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { getHeader } from "./helpers/get-header-function";

export interface IUpdateCityRequest {
  oldCityCode: string;
  newCityCode: string;
}

export interface IUpdateCityResponseData {
  id: string;
  accountId: string;
  chosenCityCodes: string[];
  lastCityUpdate: string;
  productId: string;
  purchasedAt: string;
}

export interface IUpdateCityResponseSuccess {
  status: "SUCCESS";
  data: IUpdateCityResponseData;
  message: string;
}

export interface IUpdateCityResponseError {
  status: number;
  message: string;
  error?: string;
}

export const putPurchasesUpdateCityURL = (id: string) =>
  `${endpoints.api}/payments/purchases/update-city/${id}`;

export const putPurchasesUpdateCity = (
  id: string,
  data: IUpdateCityRequest,
  token: string
): Promise<AxiosResponse<IUpdateCityResponseSuccess>> => {
  return isketApiClient.put<IUpdateCityResponseSuccess>(
    `/payments/purchases/update-city/${id}`,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPutPurchasesUpdateCity = (id: string) => {
  const auth = useAuth();
  const fn = useCallback(
    (data: IUpdateCityRequest) =>
      putPurchasesUpdateCity(id, data, auth.store.token as string),
    [auth, id]
  );
  return fn;
};
