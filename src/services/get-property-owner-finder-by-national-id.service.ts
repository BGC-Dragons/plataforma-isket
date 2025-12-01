import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyOwner } from "./get-property-owner-finder-by-address.service";

export interface IGetPropertyOwnerFinderByNationalIdResponse extends IPropertyOwner {}

export const getPropertyOwnerFinderByNationalIdPATH =
  "/property-owner-finder/find-by-nationalId";

/**
 * Busca pessoa por CPF/CNPJ (National ID)
 * O accountId e userId são automaticamente extraídos do token de autenticação
 * Este endpoint consome créditos do tipo RESIDENT_SEARCH
 * O nationalId deve conter apenas números (sem pontos, traços ou barras)
 */
export const getPropertyOwnerFinderByNationalId = (
  nationalId: string,
  token: string
): Promise<AxiosResponse<IGetPropertyOwnerFinderByNationalIdResponse>> => {
  // Remover formatação do CPF/CNPJ (apenas números)
  const cleanNationalId = nationalId.replace(/\D/g, "");

  return isketApiClient.get<IGetPropertyOwnerFinderByNationalIdResponse>(
    getPropertyOwnerFinderByNationalIdPATH,
    {
      params: {
        nationalId: cleanNationalId,
      },
      headers: getHeader({ token }),
    }
  );
};

