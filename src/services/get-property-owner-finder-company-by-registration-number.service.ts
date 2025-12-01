import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { ICompany } from "./get-property-owner-finder-companies-by-address.service";

export interface IGetPropertyOwnerFinderCompanyByRegistrationNumberResponse {
  status: number;
  data: ICompany;
  message: string;
}

export const getPropertyOwnerFinderCompanyByRegistrationNumberPATH =
  "/property-owner-finder/find-company-by-registration-number";

/**
 * Busca empresa por CNPJ (Registration Number)
 * O accountId e userId são automaticamente extraídos do token de autenticação
 * Este endpoint consome créditos do tipo RESIDENT_SEARCH
 * O companyRegistrationNumber deve conter apenas números (sem pontos, traços ou barras)
 */
export const getPropertyOwnerFinderCompanyByRegistrationNumber = (
  companyRegistrationNumber: string,
  token: string
): Promise<AxiosResponse<IGetPropertyOwnerFinderCompanyByRegistrationNumberResponse>> => {
  // Remover formatação do CNPJ (apenas números)
  const cleanRegistrationNumber = companyRegistrationNumber.replace(/\D/g, "");

  return isketApiClient.get<IGetPropertyOwnerFinderCompanyByRegistrationNumberResponse>(
    getPropertyOwnerFinderCompanyByRegistrationNumberPATH,
    {
      params: {
        companyRegistrationNumber: cleanRegistrationNumber,
      },
      headers: getHeader({ token }),
    }
  );
};

