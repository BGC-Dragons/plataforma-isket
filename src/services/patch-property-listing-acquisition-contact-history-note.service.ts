import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyListingAcquisitionContactHistory } from "./get-property-listing-acquisitions-contact-history.service";

export interface IPatchPropertyListingAcquisitionContactHistoryNoteRequest {
  content: string;
}

export const patchPropertyListingAcquisitionContactHistoryNotePATH = (
  id: string,
  noteId: string
) => `/property-listing-acquisitions/contact-history/${id}/notes/${noteId}`;

/**
 * Atualiza uma nota do histórico de contato
 * O accountId e userId são automaticamente extraídos do token de autenticação
 */
export const patchPropertyListingAcquisitionContactHistoryNote = (
  id: string,
  noteId: string,
  data: IPatchPropertyListingAcquisitionContactHistoryNoteRequest,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContactHistory>> => {
  return isketApiClient.patch<IPropertyListingAcquisitionContactHistory>(
    patchPropertyListingAcquisitionContactHistoryNotePATH(id, noteId),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

