import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";
import type { INeighborhoodFull } from "./get-locations-neighborhoods.service";

export const getNeighborhoodByNamePATH = "/locations/neighborhoods/findByName";

/**
 * Busca um bairro específico por nome e código da cidade
 * Retorna dados completos incluindo coordenadas geoespaciais
 */
export const getNeighborhoodByName = (
  cityStateCode: string,
  name: string,
  token?: string
): Promise<AxiosResponse<INeighborhoodFull>> => {
  const config = token ? { headers: getHeader({ token }) } : undefined;
  
  const params = new URLSearchParams();
  params.append("cityStateCode", cityStateCode);
  params.append("name", name);

  const url = `${getNeighborhoodByNamePATH}?${params.toString()}`;

  return isketApiClient.get<INeighborhoodFull>(url, config);
};

