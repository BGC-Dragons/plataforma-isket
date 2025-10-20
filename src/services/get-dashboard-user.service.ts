import axios, { type AxiosResponse } from "axios";
import { endpoints } from "./helpers/endpoint.constant";

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

export const getDashboardUserURL = (userId: string) =>
  `${endpoints.api}/dashboard/users/${userId}`;

export const getDashboardUser = (
  userId: string
): Promise<AxiosResponse<IGetDashboardUserResponseSuccess>> => {
  return axios.get<IGetDashboardUserResponseSuccess>(
    getDashboardUserURL(userId)
  );
};
