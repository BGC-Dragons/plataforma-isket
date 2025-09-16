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
  type: "YEARLY" | "MONTHLY";
  id: string;
  link: string | null;
}

export interface IProductUnit {
  type: ProductUnitType;
  priceType: "UNIT";
  limit: number;
}

export interface IProduct {
  id: string;
  title: string;
  description: string;
  productType: ProductType;
  accountType: AccountType;
  value: number;
  recommended: boolean;
  gatewayPrices: IGatewayPrice[];
  units: IProductUnit[];
  createdAt: string;
  updatedAt: string;
  deleted: string | null;
}

export interface IGetPurchasesResponseSuccess {
  id: string;
  accountId: string;
  quantity: number;
  contractUrl: string | null;
  defaultCityStateCode: string;
  chosenCityCodes: string[];
  stripeId: string | null;
  ivaId: string | null;
  planPeriodEnd: number;
  lastCityUpdate: string | null;
  price: number | null;
  productId: string;
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
