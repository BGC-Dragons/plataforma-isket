import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { ICityFull } from "./get-locations-cities.service";

export const getCityByCodePATH = "/locations/cities";

/**
 * Busca uma cidade específica por código
 * Retorna dados completos incluindo coordenadas geoespaciais (se disponível)
 */
export const getCityByCode = (
  cityStateCode: string,
  token?: string
): Promise<AxiosResponse<ICityFull>> => {
  const config = token ? { headers: getHeader({ token }) } : undefined;
  
  const url = `${getCityByCodePATH}/${cityStateCode}`;

  return isketApiClient.get<ICityFull>(url, config);
};

