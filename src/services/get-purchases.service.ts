import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

export type ProductUnitType =
  | "USERS"
  | "CITIES"
  | "PROPERTY_VALUATION"
  | "RESIDENT_SEARCH"
  | "RADARS";

export type ProductType =
  | "FIXED_PLAN"
  | "CUSTOM_PLAN"
  | "TRIAL_PLAN"
  | "CREDIT_PACKAGE";

export type AccountType = "INDEPENDENT" | "BUSINESS";

export interface IRemainingUnit {
  type: ProductUnitType;
  unitsRemaining: number;
}

export interface IGatewayPrice {
  type: "YEARLY" | "MONTHLY" | "PACKAGE" | "UNIT";
  id: string;
  link?: string;
}

export interface IProductUnit {
  type: ProductUnitType;
  priceType: "YEARLY" | "MONTHLY" | "PACKAGE" | "UNIT";
  limit: number;
}

export interface IProduct {
  id: string;
  title: string;
  description: string;
  productType: ProductType;
  accountType: AccountType;
  value: number;
  recommended?: boolean;
  units: IProductUnit[];
  gatewayPrices: IGatewayPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface IPrice {
  type: "YEARLY" | "MONTHLY" | "PACKAGE" | "UNIT";
  id: string;
  link?: string;
}

export interface IGetPurchasesResponseSuccess {
  id: string;
  accountId: string;
  quantity: number;
  contractUrl?: string;
  defaultCityStateCode: string;
  price?: IPrice;
  chosenCityCodes: string[];
  stripeId?: string;
  ivaId?: string;
  planPeriodEnd: number;
  lastCityUpdate?: string;
  purchasedAt: string;
  remainingUnits: IRemainingUnit[];
  product: IProduct;
}

export const getPurchasesURL = `${endpoints.api}/payments/purchases`;

export const getPurchases = (
  token: string
): Promise<AxiosResponse<IGetPurchasesResponseSuccess[]>> => {
  return axios.get<IGetPurchasesResponseSuccess[]>(getPurchasesURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
