import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IUserCreditLimit {
  id: string;
  accountId: string;
  userId: string;
  unitType: "PROPERTY_VALUATION" | "RESIDENT_SEARCH" | "RADARS";
  limitAmount: number;
  totalConsumed: number;
  remaining: number;
}

export const getUserCreditLimitsPATH = "/payments/purchases/user-credit-limits";

export const getUserCreditLimits = (
  token: string,
  userId?: string
): Promise<AxiosResponse<IUserCreditLimit[]>> => {
  const params = userId ? `?userId=${userId}` : "";
  return isketApiClient.get<IUserCreditLimit[]>(
    `${getUserCreditLimitsPATH}${params}`,
    { headers: getHeader({ token }) }
  );
};

export const useAuthedGetUserCreditLimits = (userId?: string) => {
  const auth = useAuth();
  const fn = useCallback(
    () => getUserCreditLimits(auth.store.token as string, userId),
    [auth, userId]
  );
  return fn;
};

export const useGetUserCreditLimits = (userId?: string) => {
  const fetcher = useAuthedGetUserCreditLimits(userId);
  const auth = useAuth();
  const cacheKey = auth.store.user?.id
    ? [getUserCreditLimitsPATH, userId || "all", auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

export const clearUserCreditLimitsCache = () => {
  mutate(getUserCreditLimitsPATH);
  mutate((key) => Array.isArray(key) && key[0] === getUserCreditLimitsPATH);
};
