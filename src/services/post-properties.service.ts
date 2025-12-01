import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

// Tipos de propriedade da API
export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "LAND"
  | "TOWNHOUSE"
  | "COMMERCIAL_OFFICE"
  | "PENTHOUSE"
  | "RANCH"
  | "WAREHOUSE"
  | "COMMERCIAL_POINT"
  | "BUILDING"
  | "STORE"
  | "FARM"
  | "COTTAGE"
  | "FLAT"
  | "COMPLEX"
  | "KITNET"
  | "STUDIO"
  | "GARAGE"
  | "FLOOR"
  | "GARDEN"
  | "LOFT"
  | "INDUSTRIAL"
  | "FARMHOUSE"
  | "DUPLEX"
  | "SEMIDETACHED"
  | "HARAS"
  | "CLINIC"
  | "INN"
  | "OVERSTORE"
  | "CHALET"
  | "ROOM"
  | "RESORT"
  | "COMMERCIAL"
  | "TRIPLEX"
  | "STUDENT_HOUSING"
  | "COWORKING"
  | "BOX"
  | "EDICULA"
  | "LISTED"
  | "COMMERCIAL_HOUSE"
  | "OTHERS";

export type AcquisitionStatus = "IN_ACQUISITION" | "DECLINED" | "ACQUIRED";

export type AreaType = "TOTAL" | "USABLE" | "EXTERNAL" | "BUILT" | "PRIVATE" | "COMMON";

export type AreaUnit = "METER_SQUARED" | "HECTARE";

export interface IArea {
  value: number;
  unit: AreaUnit;
  areaType: AreaType;
}

export interface IStreetGeo {
  lat: number;
  lon: number;
}

export interface ICondo {
  name: string;
  floors?: number;
  features?: string[];
}

export interface IBuilder {
  name: string;
  site?: string;
  phones?: string[];
  emails?: string[];
}

export interface IPostPropertiesRequest {
  // Endereço
  formattedAddress?: string;
  postalCode?: number;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cityStateCode?: string;
  stateAcronym?: string;
  streetNumber: number;
  streetGeo?: IStreetGeo;
  addressComplementId?: string;

  // Propriedade
  description?: string;
  type: PropertyType;
  area?: IArea[];
  rooms?: number;
  suites?: number;
  parking?: number;
  floor?: number;
  countryRegistry?: string;
  urlImages?: string[];
  urlVideos?: string[];
  features?: string[];
  condoBlock?: number;
  condo?: ICondo;
  buildingYear?: string; // ISO 8601
  builder?: IBuilder;
  acquisitionStatus?: AcquisitionStatus;
}

export interface IPostPropertiesResponse {
  id: string;
  formattedAddress?: string;
  description?: string;
  type: PropertyType;
  area?: IArea[];
  rooms?: number;
  suites?: number;
  parking?: number;
  floor?: number;
  condo?: {
    id: string;
    name: string;
    floors?: number;
    features?: string[];
  };
  builder?: {
    id: string;
    name: string;
    site?: string;
  };
  address?: {
    street?: string;
    number: {
      id: string;
      number: number;
    };
  };
  number?: {
    id: string;
    number: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const postPropertiesPATH = "/properties";

/**
 * Cria uma nova propriedade
 * O accountId é automaticamente extraído do token de autenticação
 */
export const postProperties = (
  token: string,
  data: IPostPropertiesRequest
): Promise<AxiosResponse<IPostPropertiesResponse>> => {
  return isketApiClient.post<IPostPropertiesResponse>(
    postPropertiesPATH,
    data,
    {
      headers: getHeader({ token }),
    }
  );
};


