import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export type ContactStatus = "NOT_THE_OWNER" | "OWNER" | "TENANT" | "UNDEFINED";

export interface IContactNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface IPropertyListingAcquisitionContactHistory {
  id: string;
  acquisitionProcessId: string;
  contactName?: string;
  contactDetails?: string;
  contactId?: string;
  emails: string[];
  phones: string[];
  contactDate: string;
  contactNotes: IContactNote[];
  status: ContactStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const getPropertyListingAcquisitionsContactHistoryPATH =
  "/property-listing-acquisitions/contact-history";

/**
 * Lista históricos de contato de um processo de captação
 * O accountId é automaticamente extraído do token de autenticação
 */
export const getPropertyListingAcquisitionsContactHistory = (
  acquisitionProcessId: string,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContactHistory[]>> => {
  return isketApiClient.get<IPropertyListingAcquisitionContactHistory[]>(
    getPropertyListingAcquisitionsContactHistoryPATH,
    {
      params: {
        acquisitionProcessId,
      },
      headers: getHeader({ token }),
    }
  );
};

