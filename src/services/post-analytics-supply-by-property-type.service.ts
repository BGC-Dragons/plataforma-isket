import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPostPropertyAdSearchRequest } from "./post-property-ad-search.service";

export interface ISupplyByPropertyTypeRequest
  extends Partial<IPostPropertyAdSearchRequest> {
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface ISupplyByPropertyTypeItem {
  propertyType: string;
  count: number;
}

export interface ISupplyByPropertyTypeResponse {
  status: 200;
  data: ISupplyByPropertyTypeItem[];
}

export const postAnalyticsSupplyByPropertyTypePATH =
  "/analytics/prop-supply/by-property-type";

export const postAnalyticsSupplyByPropertyType = (
  params: ISupplyByPropertyTypeRequest,
  token?: string
): Promise<AxiosResponse<ISupplyByPropertyTypeResponse>> => {
  return isketApiClient.post<ISupplyByPropertyTypeResponse>(
    postAnalyticsSupplyByPropertyTypePATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};

