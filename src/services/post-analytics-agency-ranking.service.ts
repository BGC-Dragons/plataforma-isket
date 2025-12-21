import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPostPropertyAdSearchRequest } from "./post-property-ad-search.service";

export interface IAgencyRankingRequest
  extends Partial<IPostPropertyAdSearchRequest> {
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface IAgencyNeighborhoodData {
  neighborhood: string;
  venda: number;
  aluguel: number;
  total: number;
}

export interface IAgencyRankingItem {
  agencyId: string;
  agencyName: string;
  neighborhoods: IAgencyNeighborhoodData[];
  totalVenda: number;
  totalAluguel: number;
  totalGeral: number;
  totalStockValue?: number; // Valor total de estoque em R$
}

export interface IAgencyRankingResponse {
  status: 200;
  data: IAgencyRankingItem[];
}

export const postAnalyticsAgencyRankingPATH =
  "/analytics/prop-supply/agency-ranking";

export const postAnalyticsAgencyRanking = (
  params: IAgencyRankingRequest,
  token?: string
): Promise<AxiosResponse<IAgencyRankingResponse>> => {
  return isketApiClient.post<IAgencyRankingResponse>(
    postAnalyticsAgencyRankingPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};

