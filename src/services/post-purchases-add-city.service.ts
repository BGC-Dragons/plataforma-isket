import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import { endpoints } from "./helpers/endpoint.constant";
import { isketApiClient } from "./clients/isket-api.client";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { getHeader } from "./helpers/get-header-function";

export type ProductUnitType =
  | "USERS"
  | "CITIES"
  | "PROPERTY_VALUATION"
  | "RESIDENT_SEARCH"
  | "RADARS";

export interface IRemainingUnit {
  type: ProductUnitType;
  unitsRemaining: number;
}

export interface IAddCityRequest {
  cityCode: string;
}

export interface IAddCityResponseData {
  purchasedId: string;
  cityCode: string;
  chosenCityCodes: string[];
  remainingUnits: IRemainingUnit[];
}

export interface IAddCityResponseSuccess {
  success: boolean;
  message?: string;
  data?: IAddCityResponseData;
}

export const postPurchasesAddCityURL = (id: string) =>
  `${endpoints.api}/payments/purchases/add-city/${id}`;

export const postPurchasesAddCity = (
  id: string,
  cityCode: string,
  token: string
): Promise<AxiosResponse<IAddCityResponseSuccess>> => {
  return isketApiClient.post<IAddCityResponseSuccess>(
    `/payments/purchases/add-city/${id}`,
    { cityCode },
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedPostPurchasesAddCity = (id: string) => {
  const auth = useAuth();
  const fn = useCallback(
    (cityCode: string) =>
      postPurchasesAddCity(id, cityCode, auth.store.token as string),
    [auth, id]
  );
  return fn;
};
