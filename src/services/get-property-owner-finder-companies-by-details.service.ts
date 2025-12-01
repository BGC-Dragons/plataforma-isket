import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { ICompany } from "./get-property-owner-finder-companies-by-address.service";

export interface IGetPropertyOwnerFinderCompaniesByDetailsResponse {
  status: number;
  data: ICompany[];
  message: string;
}

export interface IGetPropertyOwnerFinderCompaniesByDetailsParams {
  companyName?: string;
  areaCode?: string;
  phoneNumber?: string;
  industryClassificationCode?: string;
  legalNatureCode?: string;
  state?: string;
  city?: string;
}

export const getPropertyOwnerFinderCompaniesByDetailsPATH =
  "/property-owner-finder/find-companies-by-details";

/**
 * Busca empresas por detalhes (nome, telefone, CNAE, etc)
 * O accountId e userId são automaticamente extraídos do token de autenticação
 * Este endpoint consome créditos do tipo RESIDENT_SEARCH
 * Pelo menos um dos parâmetros deve ser fornecido
 */
export const getPropertyOwnerFinderCompaniesByDetails = (
  params: IGetPropertyOwnerFinderCompaniesByDetailsParams,
  token: string
): Promise<AxiosResponse<IGetPropertyOwnerFinderCompaniesByDetailsResponse>> => {
  return isketApiClient.get<IGetPropertyOwnerFinderCompaniesByDetailsResponse>(
    getPropertyOwnerFinderCompaniesByDetailsPATH,
    {
      params,
      headers: getHeader({ token }),
    }
  );
};

