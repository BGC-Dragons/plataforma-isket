import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type {
  IPropertyListingAcquisitionContactHistory,
  ContactStatus,
  IContactNote,
} from "./get-property-listing-acquisitions-contact-history.service";

export interface IPostPropertyListingAcquisitionContactHistoryRequest {
  acquisitionProcessId: string;
  contactName?: string;
  contactDetails?: string;
  contactId?: string;
  emails?: string[];
  phones?: string[];
  contactDate: string; // ISO 8601
  contactNotes?: string | Array<{ content: string; id?: string; createdAt?: string; updatedAt?: string }>;
  status?: ContactStatus;
}

export const postPropertyListingAcquisitionContactHistoryPATH =
  "/property-listing-acquisitions/contact-history";

/**
 * Cria um novo histórico de contato
 * O accountId e userId são automaticamente extraídos do token de autenticação
 * Se contactNotes for string, será convertido para array automaticamente
 */
export const postPropertyListingAcquisitionContactHistory = (
  data: IPostPropertyListingAcquisitionContactHistoryRequest,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContactHistory>> => {
  return isketApiClient.post<IPropertyListingAcquisitionContactHistory>(
    postPropertyListingAcquisitionContactHistoryPATH,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

