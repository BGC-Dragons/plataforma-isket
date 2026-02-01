import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import type { IPostPropertyAdSearchRequest } from "./post-property-ad-search.service";

// Interfaces
export interface IPropertyFeature {
  key: string;
  count: number;
}

export interface IGetPropertyAdFeaturesResponse {
  data: IPropertyFeature[];
}

// Constantes
export const postPropertyAdFeaturesPATH = "/property-ad/features";

// Função principal do service
export const postPropertyAdFeatures = (
  filters?: Partial<IPostPropertyAdSearchRequest>
): Promise<AxiosResponse<IGetPropertyAdFeaturesResponse>> => {
  return isketApiClient.post<IGetPropertyAdFeaturesResponse>(
    postPropertyAdFeaturesPATH,
    filters ?? {}
  );
};
