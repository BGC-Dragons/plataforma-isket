import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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
  return axios.put<IUpdateCityResponseSuccess>(
    putPurchasesUpdateCityURL(id),
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
