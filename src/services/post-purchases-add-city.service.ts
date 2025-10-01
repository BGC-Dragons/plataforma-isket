import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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
  return axios.post<IAddCityResponseSuccess>(
    postPurchasesAddCityURL(id),
    { cityCode },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
