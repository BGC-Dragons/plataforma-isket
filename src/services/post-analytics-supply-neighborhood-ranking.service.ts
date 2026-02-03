import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPostPropertyAdSearchRequest } from "./post-property-ad-search.service";

export interface ISupplyNeighborhoodRankingRequest
  extends Partial<IPostPropertyAdSearchRequest> {
  startDate?: string;
  endDate?: string;
}

export interface ISupplyNeighborhoodRankingItem {
  neighborhood: string;
  count: number;
}

export interface ISupplyNeighborhoodRankingResponse {
  status: 200;
  data: ISupplyNeighborhoodRankingItem[];
}

export const postAnalyticsSupplyNeighborhoodRankingPATH =
  "/analytics/prop-supply/neighborhood-ranking";

export const postAnalyticsSupplyNeighborhoodRanking = (
  params: ISupplyNeighborhoodRankingRequest,
  token?: string
): Promise<AxiosResponse<ISupplyNeighborhoodRankingResponse>> => {
  return isketApiClient.post<ISupplyNeighborhoodRankingResponse>(
    postAnalyticsSupplyNeighborhoodRankingPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};
