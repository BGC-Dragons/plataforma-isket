import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface ICityState {
  name: string;
  acronym: string;
  country?: {
    acronym: string;
  };
}

export interface ICityGeo {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][]; // Polygon: [[[lon, lat], ...]], MultiPolygon: [[[[lon, lat], ...]]]
  };
  properties?: {
    NM_MUNICIP?: string;
    CD_GEOCMU?: string;
  };
}

export interface ICityFull {
  id: string;
  name: string;
  ibgeId?: string;
  cityStateCode: string;
  state: ICityState;
  geo?: ICityGeo;
}

export const getCitiesPATH = "/locations/cities";

/**
 * Busca todas as cidades ou filtra por país
 * Retorna dados completos incluindo coordenadas geoespaciais (se disponível)
 */
export const getCities = (
  country?: string,
  token?: string
): Promise<AxiosResponse<ICityFull[]>> => {
  const config = token ? { headers: getHeader({ token }) } : undefined;
  
  // Construir query params
  const params = new URLSearchParams();
  if (country) {
    params.append("country", country);
  }

  const queryString = params.toString();
  const url = queryString
    ? `${getCitiesPATH}?${queryString}`
    : getCitiesPATH;

  return isketApiClient.get<ICityFull[]>(url, config);
};

