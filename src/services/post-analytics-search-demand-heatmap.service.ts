import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type {
  IPostPropertyAdSearchRequest,
} from "./post-property-ad-search.service";

export interface ISearchDemandHeatMapRequest
  extends Partial<IPostPropertyAdSearchRequest> {
  startDate: string; // ISO string
  endDate: string; // ISO string
  refAuthType: "PUBLIC" | "PRIVATE" | "ACCOUNT" | "USER";
}

export interface ISearchDemandHeatMapResponse {
  status: 200;
  data: number[][]; // Array de [longitude, latitude]
}

export const postAnalyticsSearchDemandHeatMapPATH =
  "/analytics/prop-search-demand/heat-map";

export const postAnalyticsSearchDemandHeatMap = (
  params: ISearchDemandHeatMapRequest,
  token?: string
): Promise<AxiosResponse<ISearchDemandHeatMapResponse>> => {
  return isketApiClient.post<ISearchDemandHeatMapResponse>(
    postAnalyticsSearchDemandHeatMapPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};

