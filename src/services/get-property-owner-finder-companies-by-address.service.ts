import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IStreetGeo } from "./get-property-owner-finder-by-address.service";

export interface ICompanyAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ICompanyPartner {
  name: string;
  nationalId: string;
  qualification: string;
}

export interface ICompanyPhone {
  formattedNumber: string;
  regionCode?: string;
}

export interface ICompanyEmail {
  email: string;
}

export interface ICompany {
  companyRegistrationNumber: string;
  companyName: string;
  fantasyName?: string;
  openingDate?: string;
  industryClassificationCode?: string;
  industryClassificationDescription?: string;
  employeeRange?: string;
  cadastralStatus?: string;
  legalNatureCode?: string;
  legalNature?: string;
  companySize?: string;
  cadastralStatusReason?: string | null;
  specialStatusReason?: string | null;
  cadastralStatusDate?: string;
  specialStatusDate?: string | null;
  phones: ICompanyPhone[];
  emails: ICompanyEmail[];
  addresses: ICompanyAddress[];
  partners?: ICompanyPartner[];
}

export interface IGetPropertyOwnerFinderCompaniesByAddressResponse {
  data: ICompany[];
  message: string;
}

export interface IGetPropertyOwnerFinderCompaniesByAddressParams {
  formattedAddress: string;
  streetNumber: number;
  propertyComplement?: string | null;
  streetGeo?: IStreetGeo;
}

export const getPropertyOwnerFinderCompaniesByAddressPATH =
  "/property-owner-finder/find-companies-by-address";

/**
 * Busca empresas por endereço
 * O accountId e userId são automaticamente extraídos do token de autenticação
 * Este endpoint consome créditos do tipo RESIDENT_SEARCH
 */
export const getPropertyOwnerFinderCompaniesByAddress = (
  params: IGetPropertyOwnerFinderCompaniesByAddressParams,
  token: string
): Promise<AxiosResponse<IGetPropertyOwnerFinderCompaniesByAddressResponse>> => {
  const queryParams: Record<string, string> = {
    formattedAddress: params.formattedAddress,
    streetNumber: params.streetNumber.toString(),
  };

  if (params.propertyComplement !== undefined && params.propertyComplement !== null) {
    queryParams.propertyComplement = params.propertyComplement || "null";
  }

  return isketApiClient.get<IGetPropertyOwnerFinderCompaniesByAddressResponse>(
    getPropertyOwnerFinderCompaniesByAddressPATH,
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

