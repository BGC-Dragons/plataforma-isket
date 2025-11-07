import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { ICityFull } from "./get-locations-cities.service";

export const postCitiesFindManyPATH = "/locations/cities/findMany";

export interface IPostCitiesFindManyRequest {
  cityStateCodes: string[];
}

/**
 * Busca múltiplas cidades por códigos
 * Retorna dados completos incluindo coordenadas geoespaciais (se disponível)
 */
export const postCitiesFindMany = (
  payload: IPostCitiesFindManyRequest,
  token?: string
): Promise<AxiosResponse<ICityFull[]>> => {
  const config = token ? { headers: getHeader({ token }) } : undefined;
  return isketApiClient.post<ICityFull[]>(
    postCitiesFindManyPATH,
    payload,
    config
  );
};
