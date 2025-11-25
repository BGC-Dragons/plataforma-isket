import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IPatchPropertyListingAcquisitionStageRequest {
  title?: string;
  order?: number;
}

export interface IPatchPropertyListingAcquisitionStageResponse {
  id: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const patchPropertyListingAcquisitionStagePATH = (
  id: string
) => `/property-listing-acquisitions/stages/${id}`;

/**
 * Atualiza um estágio de captação de imóveis
 * O accountId é automaticamente extraído do token de autenticação
 */
export const patchPropertyListingAcquisitionStage = (
  token: string,
  id: string,
  data: IPatchPropertyListingAcquisitionStageRequest
): Promise<AxiosResponse<IPatchPropertyListingAcquisitionStageResponse>> => {
  return isketApiClient.patch<IPatchPropertyListingAcquisitionStageResponse>(
    patchPropertyListingAcquisitionStagePATH(id),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

