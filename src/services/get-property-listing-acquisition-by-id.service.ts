import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyListingAcquisition } from "./get-property-listing-acquisitions.service";

export const getPropertyListingAcquisitionByIdPATH = (id: string) =>
  `/property-listing-acquisitions/acquisitions/${id}`;

/**
 * Busca uma captação por ID
 * O accountId é automaticamente extraído do token de autenticação
 */
export const getPropertyListingAcquisitionById = (
  id: string,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisition>> => {
  return isketApiClient.get<IPropertyListingAcquisition>(
    getPropertyListingAcquisitionByIdPATH(id),
    {
      headers: getHeader({ token }),
    }
  );
};

