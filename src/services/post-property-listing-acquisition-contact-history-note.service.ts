import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyListingAcquisitionContactHistory } from "./get-property-listing-acquisitions-contact-history.service";

export interface IPostPropertyListingAcquisitionContactHistoryNoteRequest {
  content: string;
}

export const postPropertyListingAcquisitionContactHistoryNotePATH = (
  id: string
) => `/property-listing-acquisitions/contact-history/${id}/notes`;

/**
 * Adiciona uma nota ao histórico de contato
 * O accountId e userId são automaticamente extraídos do token de autenticação
 */
export const postPropertyListingAcquisitionContactHistoryNote = (
  id: string,
  data: IPostPropertyListingAcquisitionContactHistoryNoteRequest,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContactHistory>> => {
  return isketApiClient.post<IPropertyListingAcquisitionContactHistory>(
    postPropertyListingAcquisitionContactHistoryNotePATH(id),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

