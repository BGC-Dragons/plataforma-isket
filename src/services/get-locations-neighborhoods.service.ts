import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface INeighborhoodGeo {
  type: "Polygon";
  coordinates: number[][][]; // [[[lon, lat], [lon, lat], ...]]
}

export interface INeighborhoodCity {
  name: string;
  cityStateCode: string;
}

export interface INeighborhoodFull {
  id: string;
  name: string;
  area?: number;
  population?: number;
  density?: number;
  households?: number;
  householdIncome?: number;
  perCapitaIncome?: number;
  city: INeighborhoodCity;
  geo: INeighborhoodGeo;
}

export const getNeighborhoodsPATH = "/locations/neighborhoods";

/**
 * Busca bairros por código(s) da(s) cidade(s)
 * Retorna dados completos incluindo coordenadas geoespaciais
 */
export const getNeighborhoods = (
  cityStateCode?: string | string[],
  token?: string
): Promise<AxiosResponse<INeighborhoodFull[]>> => {
  const config = token ? { headers: getHeader({ token }) } : undefined;
  
  // Construir query params
  const params = new URLSearchParams();
  if (cityStateCode) {
    if (Array.isArray(cityStateCode)) {
      cityStateCode.forEach((code) => params.append("cityStateCode", code));
    } else {
      params.append("cityStateCode", cityStateCode);
    }
  }

  const queryString = params.toString();
  const url = queryString
    ? `${getNeighborhoodsPATH}?${queryString}`
    : getNeighborhoodsPATH;

  return isketApiClient.get<INeighborhoodFull[]>(url, config);
};

