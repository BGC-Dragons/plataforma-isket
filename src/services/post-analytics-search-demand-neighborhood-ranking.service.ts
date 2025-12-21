import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type {
  IPostPropertyAdSearchRequest,
  BusinessModel,
  PropertyPurpose,
} from "./post-property-ad-search.service";

export interface ISearchDemandNeighborhoodRankingRequest
  extends Partial<IPostPropertyAdSearchRequest> {
  startDate: string; // ISO string
  endDate: string; // ISO string
  refAuthType: "PUBLIC" | "PRIVATE" | "ACCOUNT" | "USER";
}

export interface ISearchDemandNeighborhoodRankingItem {
  neighborhood: string;
  count: number;
}

export interface ISearchDemandNeighborhoodRankingResponse {
  status: 200;
  data: ISearchDemandNeighborhoodRankingItem[];
}

export const postAnalyticsSearchDemandNeighborhoodRankingPATH =
  "/analytics/prop-search-demand/neighborhood-ranking";

export const postAnalyticsSearchDemandNeighborhoodRanking = (
  params: ISearchDemandNeighborhoodRankingRequest,
  token?: string
): Promise<AxiosResponse<ISearchDemandNeighborhoodRankingResponse>> => {
  return isketApiClient.post<ISearchDemandNeighborhoodRankingResponse>(
    postAnalyticsSearchDemandNeighborhoodRankingPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};

