import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

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

export const getPurchasesPATH = "/payments/purchases";

export const getPurchases = (
  token: string
): Promise<AxiosResponse<IGetPurchasesResponseSuccess[]>> => {
  return isketApiClient.get<IGetPurchasesResponseSuccess[]>(getPurchasesPATH, {
    headers: getHeader({ token }),
  });
};

export const useAuthedGetPurchases = () => {
  const auth = useAuth();
  const fn = useCallback(() => getPurchases(auth.store.token as string), [auth]);
  return fn;
};

export const useGetPurchases = () => {
  const fetcher = useAuthedGetPurchases();
  const auth = useAuth();
  // Incluir userId na chave para isolamento entre usuários
  const cacheKey = auth.store.user?.id
    ? [getPurchasesPATH, auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

// Função para invalidar cache de purchases
export const clearPurchasesCache = () => {
  mutate(getPurchasesPATH);
  mutate((key) => Array.isArray(key) && key[0] === getPurchasesPATH);
};
