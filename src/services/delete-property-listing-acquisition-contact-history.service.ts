import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IDeletedPropertyListingAcquisitionContactHistory {
  id: string;
  acquisitionProcessId: string;
  contactName?: string;
  contactDate: string;
  status: "NOT_THE_OWNER" | "OWNER" | "TENANT" | "UNDEFINED";
  createdAt: string;
  updatedAt: string;
}

export const deletePropertyListingAcquisitionContactHistoryPATH = (
  id: string
) => `/property-listing-acquisitions/contact-history/${id}`;

/**
 * Deleta um histórico de contato
 * O accountId é automaticamente extraído do token de autenticação
 */
export const deletePropertyListingAcquisitionContactHistory = (
  id: string,
  token: string
): Promise<AxiosResponse<IDeletedPropertyListingAcquisitionContactHistory>> => {
  return isketApiClient.delete<IDeletedPropertyListingAcquisitionContactHistory>(
    deletePropertyListingAcquisitionContactHistoryPATH(id),
    {
      headers: getHeader({ token }),
    }
  );
};

