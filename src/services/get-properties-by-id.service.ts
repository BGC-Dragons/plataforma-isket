import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { PropertyType, AcquisitionStatus, IArea } from "./post-properties.service";

export interface IGetPropertiesByIdResponse {
  id: string;
  formattedAddress?: string;
  description?: string;
  countryRegistry?: string;
  addressComplementId?: string;
  addressNumberId: string;
  type: PropertyType;
  area?: IArea[];
  rooms?: number;
  suites?: number;
  parking?: number;
  floor?: number;
  urlImages?: string[];
  urlVideos?: string[];
  features?: string[];
  condoBlock?: number;
  condo?: {
    id: string;
    name: string;
    floors?: number;
    features?: string[];
  };
  buildingYear?: string;
  builder?: {
    id: string;
    name: string;
    site?: string;
    phones?: string[];
    emails?: string[];
  };
  acquisitionStatus?: AcquisitionStatus;
  currentOwners?: unknown[];
  currentResidents?: unknown[];
  personHistory?: unknown[];
  createdAt: string;
  updatedAt: string;
}

export const getPropertiesByIdPATH = (id: string) => `/properties/${id}`;

/**
 * Busca uma propriedade por ID
 * O accountId é automaticamente extraído do token de autenticação
 */
export const getPropertiesById = (
  id: string,
  token: string
): Promise<AxiosResponse<IGetPropertiesByIdResponse>> => {
  return isketApiClient.get<IGetPropertiesByIdResponse>(
    getPropertiesByIdPATH(id),
    {
      headers: getHeader({ token }),
    }
  );
};


