import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPostPropertyAdSearchRequest } from "./post-property-ad-search.service";

export interface ISupplyHeatMapRequest
  extends Partial<IPostPropertyAdSearchRequest> {
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface ISupplyHeatMapResponse {
  status: 200;
  data: number[][]; // Array de [longitude, latitude]
}

export const postAnalyticsSupplyHeatMapPATH =
  "/analytics/prop-supply/heat-map";

export const postAnalyticsSupplyHeatMap = (
  params: ISupplyHeatMapRequest,
  token?: string
): Promise<AxiosResponse<ISupplyHeatMapResponse>> => {
  return isketApiClient.post<ISupplyHeatMapResponse>(
    postAnalyticsSupplyHeatMapPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};

