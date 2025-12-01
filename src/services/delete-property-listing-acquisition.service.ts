import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IDeletedPropertyListingAcquisition {
  id: string;
  title: string;
  formattedAddress: string;
  status: "IN_ACQUISITION" | "DECLINED" | "ACQUIRED";
  captureType: "property" | "contact";
  createdAt: string;
  updatedAt: string;
}

export const deletePropertyListingAcquisitionPATH = (id: string) =>
  `/property-listing-acquisitions/acquisitions/${id}`;

/**
 * Deleta uma captação de imóvel
 * O accountId é automaticamente extraído do token de autenticação
 * Ao deletar, todos os registros relacionados são removidos automaticamente
 */
export const deletePropertyListingAcquisition = (
  id: string,
  token: string
): Promise<AxiosResponse<IDeletedPropertyListingAcquisition>> => {
  return isketApiClient.delete<IDeletedPropertyListingAcquisition>(
    deletePropertyListingAcquisitionPATH(id),
    {
      headers: getHeader({ token }),
    }
  );
};

