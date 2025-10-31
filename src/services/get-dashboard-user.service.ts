import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IDashboardUserPlan {
  name: string;
  type: string;
}

export interface IDashboardUserRemainingUnit {
  type: string;
  unitsRemaining: number;
}

export interface IDashboardUserPurchaseHistoryItem {
  id: string;
  productTitle: string | null;
  productType: string | null;
  purchasedAt: string; // ISO-8601
  planPeriodEnd: number; // seconds since epoch
  defaultCity: string | null;
  chosenCities: string[];
  remainingUnits: IDashboardUserRemainingUnit[];
}

export interface IGetDashboardUserResponseSuccess {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  role: "Dono" | "Membro";
  plan: IDashboardUserPlan | null;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  credits: Record<string, number>;
  accountStatus: "active" | "expired";
  account: {
    id: string | null;
    company: {
      name: string | null;
      document: string | null;
      phone: string | null;
      email: string | null;
    };
  };
  purchaseHistory: IDashboardUserPurchaseHistoryItem[];
}

export const getDashboardUserPATH = (userId: string) =>
  `/dashboard/users/${userId}`;

export const getDashboardUser = (
  token: string,
  userId: string
): Promise<AxiosResponse<IGetDashboardUserResponseSuccess>> => {
  return isketApiClient.get<IGetDashboardUserResponseSuccess>(
    getDashboardUserPATH(userId),
    { headers: getHeader({ token }) }
  );
};

export const useAuthedGetDashboardUser = (userId: string) => {
  const auth = useAuth();
  const fn = useCallback(
    () => getDashboardUser(auth.store.token as string, userId),
    [auth, userId]
  );
  return fn;
};

export const useGetDashboardUser = (userId: string) => {
  const fetcher = useAuthedGetDashboardUser(userId);
  const auth = useAuth();
  // Incluir userId na chave para isolamento entre usuários
  const cacheKey = auth.store.user?.id
    ? [getDashboardUserPATH(userId), auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

// Função para invalidar cache de dashboard user
export const clearDashboardUserCache = (userId?: string) => {
  if (userId) {
    mutate(getDashboardUserPATH(userId));
  }
  mutate((key) => Array.isArray(key) && typeof key[0] === "string" && key[0].startsWith("/dashboard/users/"));
};
