import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type {
  IPropertyListingAcquisition,
  CaptureType,
  IAddressGeo,
} from "./get-property-listing-acquisitions.service";

export interface IPostPropertyListingAcquisitionRequest {
  title: string;
  description?: string;
  addressNumberId?: string;
  addressNumber?: number;
  addressComplement?: string;
  addressGeo?: IAddressGeo;
  formattedAddress: string;
  propertyId?: string;
  propertyOwnerId?: string;
  adIds?: string[];
  stageId: string;
  captureType: CaptureType;
  ownerId?: string;
}

export const postPropertyListingAcquisitionPATH =
  "/property-listing-acquisitions/acquisitions";

/**
 * Cria uma nova captação de imóvel
 * O accountId é automaticamente extraído do token de autenticação
 * O ownerId é automaticamente definido como o ID do usuário autenticado se não fornecido
 */
export const postPropertyListingAcquisition = (
  token: string,
  data: IPostPropertyListingAcquisitionRequest
): Promise<AxiosResponse<IPropertyListingAcquisition>> => {
  return isketApiClient.post<IPropertyListingAcquisition>(
    postPropertyListingAcquisitionPATH,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

