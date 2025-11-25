import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyListingAcquisitionStage } from "./get-property-listing-acquisitions-stages.service";

export const getPropertyListingAcquisitionsStageByIdPATH = (
  id: string
) => `/property-listing-acquisitions/stages/${id}`;

/**
 * Busca um estágio de captação de imóveis por ID
 * O accountId é automaticamente extraído do token de autenticação
 */
export const getPropertyListingAcquisitionsStageById = (
  token: string,
  id: string
): Promise<AxiosResponse<IPropertyListingAcquisitionStage>> => {
  return isketApiClient.get<IPropertyListingAcquisitionStage>(
    getPropertyListingAcquisitionsStageByIdPATH(id),
    {
      headers: getHeader({ token }),
    }
  );
};

