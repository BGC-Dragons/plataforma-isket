import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPropertyAd } from "./post-property-ad-search.service";

// Interface para headers opcionais de log
export interface IViewAdHeaders {
  ref?: string;
  userId?: string;
  accountId?: string;
}

// Constante para o path
export const getPropertyAdViewPATH = (id: string) =>
  `/property-ad/view-ad/${id}`;

/**
 * Busca um anúncio de propriedade por ID ou URL
 * Endpoint público - não requer autenticação obrigatória
 *
 * @param id - ID do anúncio ou URL do anúncio
 * @param token - Token de autenticação (opcional)
 * @param headers - Headers opcionais para log (ref, userId, accountId)
 * @returns Promise com array de anúncios (primeiro elemento é o anúncio solicitado, seguidos por anúncios relacionados)
 */
export const getPropertyAdView = (
  id: string,
  token?: string,
  headers?: IViewAdHeaders
): Promise<AxiosResponse<IPropertyAd[]>> => {
  const requestHeaders: Record<string, string> = {};

  // Adicionar headers opcionais se fornecidos
  if (headers?.ref) {
    requestHeaders.ref = headers.ref;
  }
  if (headers?.userId) {
    requestHeaders.userId = headers.userId;
  }
  if (headers?.accountId) {
    requestHeaders.accountId = headers.accountId;
  }

  return isketApiClient.get<IPropertyAd[]>(getPropertyAdViewPATH(id), {
    headers: getHeader(
      token ? { token, ...requestHeaders } : { ...requestHeaders }
    ),
  });
};
