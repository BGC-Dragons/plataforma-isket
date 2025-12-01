import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export type AcquisitionStatus = "IN_ACQUISITION" | "DECLINED" | "ACQUIRED";
export type CaptureType = "property" | "contact";

export interface IAddressGeo {
  lat: number;
  lon: number;
}

export interface IAcquisitionStage {
  id: string;
  title: string;
  order: number;
}

export interface IPropertyListingAcquisition {
  id: string;
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
  stage?: IAcquisitionStage;
  status: AcquisitionStatus;
  captureType: CaptureType;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export const getPropertyListingAcquisitionsPATH =
  "/property-listing-acquisitions/acquisitions";

/**
 * Lista todas as captações de imóveis
 * O accountId é automaticamente extraído do token de autenticação
 * Nota: A API usa POST com body vazio para listar
 */
export const getPropertyListingAcquisitions = (
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisition[]>> => {
  return isketApiClient.post<IPropertyListingAcquisition[]>(
    getPropertyListingAcquisitionsPATH,
    {},
    {
      headers: getHeader({ token }),
    }
  );
};

