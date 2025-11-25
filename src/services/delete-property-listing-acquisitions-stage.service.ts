import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IDeletePropertyListingAcquisitionStageResponse {
  id: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const deletePropertyListingAcquisitionStagePATH = (
  id: string
) => `/property-listing-acquisitions/stages/${id}`;

/**
 * Deleta um estágio de captação de imóveis
 * O accountId é automaticamente extraído do token de autenticação
 */
export const deletePropertyListingAcquisitionStage = (
  token: string,
  id: string
): Promise<AxiosResponse<IDeletePropertyListingAcquisitionStageResponse>> => {
  return isketApiClient.delete<IDeletePropertyListingAcquisitionStageResponse>(
    deletePropertyListingAcquisitionStagePATH(id),
    {
      headers: getHeader({ token }),
    }
  );
};

