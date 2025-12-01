import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type {
  IPropertyListingAcquisition,
  CaptureType,
  IAddressGeo,
} from "./get-property-listing-acquisitions.service";

export interface IPatchPropertyListingAcquisitionRequest {
  title?: string;
  description?: string;
  addressNumberId?: string;
  addressNumber?: number;
  addressComplement?: string;
  addressGeo?: IAddressGeo;
  formattedAddress?: string;
  propertyId?: string;
  propertyOwnerId?: string;
  adIds?: string[];
  stageId?: string;
  captureType?: CaptureType;
  ownerId?: string;
}

export const patchPropertyListingAcquisitionPATH = (id: string) =>
  `/property-listing-acquisitions/acquisitions/${id}`;

/**
 * Atualiza uma captação de imóvel
 * O accountId é automaticamente extraído do token de autenticação
 */
export const patchPropertyListingAcquisition = (
  id: string,
  token: string,
  data: IPatchPropertyListingAcquisitionRequest
): Promise<AxiosResponse<IPropertyListingAcquisition>> => {
  return isketApiClient.patch<IPropertyListingAcquisition>(
    patchPropertyListingAcquisitionPATH(id),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

