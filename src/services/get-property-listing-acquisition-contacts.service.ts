import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type {
  IPropertyListingAcquisitionContact,
} from "./post-property-listing-acquisition-contact.service";

export interface IGetPropertyListingAcquisitionContactsResponse {
  contacts: IPropertyListingAcquisitionContact[];
}

export const getPropertyListingAcquisitionContactsPATH = (
  acquisitionProcessId: string
) => `/property-listing-acquisitions/acquisitions/${acquisitionProcessId}/contacts`;

/**
 * Lista contatos de uma captação
 * O accountId é automaticamente extraído do token de autenticação
 * A resposta vem no formato { contacts: [...] }
 */
export const getPropertyListingAcquisitionContacts = (
  acquisitionProcessId: string,
  token: string
): Promise<AxiosResponse<IGetPropertyListingAcquisitionContactsResponse>> => {
  return isketApiClient.get<IGetPropertyListingAcquisitionContactsResponse>(
    getPropertyListingAcquisitionContactsPATH(acquisitionProcessId),
    {
      headers: getHeader({ token }),
    }
  );
};

