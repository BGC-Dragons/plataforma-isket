import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { IPostPropertyAdSearchRequest } from "./post-property-ad-search.service";

/**
 * Resposta do endpoint de estatísticas de anúncios.
 * Retorna médias dos anúncios que batem com os mesmos filtros da listagem.
 * Valores podem ser null quando não houver dados.
 */
export interface IPostPropertyAdSearchStatisticsResponse {
  avgPrice: number | null;
  avgTotalArea: number | null;
  avgUsableArea: number | null;
  avgTotalPricePerArea: number | null;
  avgUsablePricePerArea: number | null;
}

/** Path do endpoint */
export const postPropertyAdSearchStatisticsPATH = "/property-ad/search-statistics";

/**
 * Busca estatísticas (médias) dos anúncios que batem com os mesmos filtros da listagem.
 * Deve ser chamado com os mesmos filtros usados na listagem para refletir o mesmo conjunto de imóveis.
 *
 * @param params - Mesmo DTO da listagem (FindAllAdvertisingDto). Todos os campos opcionais; {} retorna estatísticas sobre todos os anúncios ativos.
 * @param token - Token de autenticação (Bearer).
 */
export const postPropertyAdSearchStatistics = (
  params: IPostPropertyAdSearchRequest | Record<string, unknown> = {},
  token?: string
): Promise<AxiosResponse<IPostPropertyAdSearchStatisticsResponse>> => {
  return isketApiClient.post<IPostPropertyAdSearchStatisticsResponse>(
    postPropertyAdSearchStatisticsPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};
