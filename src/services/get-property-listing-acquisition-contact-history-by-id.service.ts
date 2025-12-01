import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyListingAcquisitionContactHistory } from "./get-property-listing-acquisitions-contact-history.service";

export const getPropertyListingAcquisitionContactHistoryByIdPATH = (
  id: string
) => `/property-listing-acquisitions/contact-history/${id}`;

/**
 * Busca um histórico de contato por ID
 * O accountId é automaticamente extraído do token de autenticação
 */
export const getPropertyListingAcquisitionContactHistoryById = (
  id: string,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContactHistory>> => {
  return isketApiClient.get<IPropertyListingAcquisitionContactHistory>(
    getPropertyListingAcquisitionContactHistoryByIdPATH(id),
    {
      headers: getHeader({ token }),
    }
  );
};

