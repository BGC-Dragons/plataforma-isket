import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyOwner } from "./get-property-owner-finder-by-address.service";

export interface IGetPropertyOwnerFinderByDetailsResponse {
  status: number;
  data: IPropertyOwner[];
  message: string;
}

export interface IGetPropertyOwnerFinderByDetailsParams {
  name?: string;
  phone?: string;
  email?: string;
  postalCode?: string;
  street?: string;
  streetNumber?: number;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export const getPropertyOwnerFinderByDetailsPATH =
  "/property-owner-finder/find-by-details";

/**
 * Busca proprietários e residentes por detalhes (nome, telefone, email, endereço, etc)
 * O accountId e userId são automaticamente extraídos do token de autenticação
 * Este endpoint consome créditos do tipo RESIDENT_SEARCH
 * Pelo menos um dos parâmetros deve ser fornecido
 */
export const getPropertyOwnerFinderByDetails = (
  params: IGetPropertyOwnerFinderByDetailsParams,
  token: string
): Promise<AxiosResponse<IGetPropertyOwnerFinderByDetailsResponse>> => {
  return isketApiClient.get<IGetPropertyOwnerFinderByDetailsResponse>(
    getPropertyOwnerFinderByDetailsPATH,
    {
      params,
      headers: getHeader({ token }),
    }
  );
};

