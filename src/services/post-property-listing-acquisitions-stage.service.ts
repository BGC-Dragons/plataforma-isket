import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IPostPropertyListingAcquisitionStageRequest {
  title: string;
  order: number;
}

export interface IPostPropertyListingAcquisitionStageResponse {
  id: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const postPropertyListingAcquisitionStagePATH =
  "/property-listing-acquisitions/stages";

/**
 * Cria um novo estágio de captação de imóveis
 * O accountId é automaticamente extraído do token de autenticação
 */
export const postPropertyListingAcquisitionStage = (
  token: string,
  data: IPostPropertyListingAcquisitionStageRequest
): Promise<AxiosResponse<IPostPropertyListingAcquisitionStageResponse>> => {
  return isketApiClient.post<IPostPropertyListingAcquisitionStageResponse>(
    postPropertyListingAcquisitionStagePATH,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

