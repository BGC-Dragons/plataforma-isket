import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type {
  IPropertyListingAcquisitionContactHistory,
  ContactStatus,
} from "./get-property-listing-acquisitions-contact-history.service";

export interface IPatchPropertyListingAcquisitionContactHistoryRequest {
  contactName?: string;
  contactDetails?: string;
  contactId?: string;
  emails?: string[];
  phones?: string[];
  contactDate?: string; // ISO 8601
  contactNotes?: string | Array<{ id?: string; content: string; createdAt?: string; updatedAt?: string }>;
  status?: ContactStatus;
}

export const patchPropertyListingAcquisitionContactHistoryPATH = (
  id: string
) => `/property-listing-acquisitions/contact-history/${id}`;

/**
 * Atualiza um histórico de contato
 * O accountId e userId são automaticamente extraídos do token de autenticação
 */
export const patchPropertyListingAcquisitionContactHistory = (
  id: string,
  data: IPatchPropertyListingAcquisitionContactHistoryRequest,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContactHistory>> => {
  return isketApiClient.patch<IPropertyListingAcquisitionContactHistory>(
    patchPropertyListingAcquisitionContactHistoryPATH(id),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

