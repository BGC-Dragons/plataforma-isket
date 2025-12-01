import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IStreetGeo {
  lat: number;
  lon: number;
}

export interface IPropertyOwnerEmail {
  email: string;
}

export interface IPropertyOwnerPhone {
  formattedNumber: string;
  regionCode?: string;
}

export interface IPropertyOwnerProperty {
  id: string;
  formattedAddress: string;
  description?: string;
  type: string;
  addressNumberId: string;
  addressComplementId?: string;
  rooms?: number;
  suites?: number;
  parking?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPropertyOwner {
  id?: string;
  firstName: string;
  lastName: string;
  emails: IPropertyOwnerEmail[];
  phones: IPropertyOwnerPhone[];
  nationalId: string;
  propertyAsOwner?: IPropertyOwnerProperty | null;
  propertyAsResident?: IPropertyOwnerProperty | null;
  addressHistory?: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface IGetPropertyOwnerFinderByAddressResponse {
  data: IPropertyOwner[];
  message: string;
}

export interface IGetPropertyOwnerFinderByAddressError {
  status: number;
  error: string;
  message: string;
}

export const getPropertyOwnerFinderByAddressPATH =
  "/property-owner-finder/find-by-address";

export interface IGetPropertyOwnerFinderByAddressParams {
  formattedAddress: string;
  streetNumber: number;
  propertyComplement?: string | null;
  streetGeo?: IStreetGeo;
}

/**
 * Busca proprietários e residentes por endereço
 * O accountId e userId são automaticamente extraídos do token de autenticação
 * Este endpoint consome créditos do tipo RESIDENT_SEARCH
 */
export const getPropertyOwnerFinderByAddress = (
  params: IGetPropertyOwnerFinderByAddressParams,
  token: string
): Promise<AxiosResponse<IGetPropertyOwnerFinderByAddressResponse>> => {
  // Construir query params
  const queryParams: Record<string, string> = {
    formattedAddress: params.formattedAddress,
    streetNumber: params.streetNumber.toString(),
  };
  
  if (params.propertyComplement !== undefined && params.propertyComplement !== null) {
    queryParams.propertyComplement = params.propertyComplement || "null";
  }
  
  // streetGeo será enviado como objeto, o axios serializa automaticamente
  // Mas como a documentação não especifica o formato exato, vamos usar query params simples
  // Se a API esperar objeto aninhado, pode ser necessário ajustar

  return isketApiClient.get<IGetPropertyOwnerFinderByAddressResponse>(
    getPropertyOwnerFinderByAddressPATH,
    {
      params: params.streetGeo
        ? {
            ...queryParams,
            "streetGeo[lat]": params.streetGeo.lat.toString(),
            "streetGeo[lon]": params.streetGeo.lon.toString(),
          }
        : queryParams,
      headers: getHeader({ token }),
    }
  );
};

