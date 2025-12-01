import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyListingAcquisitionContactHistory } from "./get-property-listing-acquisitions-contact-history.service";

export const deletePropertyListingAcquisitionContactHistoryNotePATH = (
  id: string,
  noteId: string
) => `/property-listing-acquisitions/contact-history/${id}/notes/${noteId}`;

/**
 * Deleta uma nota do histórico de contato
 * O accountId é automaticamente extraído do token de autenticação
 */
export const deletePropertyListingAcquisitionContactHistoryNote = (
  id: string,
  noteId: string,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContactHistory>> => {
  return isketApiClient.delete<IPropertyListingAcquisitionContactHistory>(
    deletePropertyListingAcquisitionContactHistoryNotePATH(id, noteId),
    {
      headers: getHeader({ token }),
    }
  );
};

