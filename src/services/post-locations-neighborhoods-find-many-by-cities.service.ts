import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface INeighborhoodCity {
  name: string;
  cityStateCode: string;
}

export interface INeighborhood {
  id: string;
  name: string;
  name2: string;
  city: INeighborhoodCity;
}

export const postNeighborhoodsFindManyByCitiesPATH =
  "/locations/neighborhoods/find-many-by-cities";

export interface IPostNeighborhoodsFindManyByCitiesRequest {
  cityStateCodes: string[];
}

export const postNeighborhoodsFindManyByCities = (
  payload: IPostNeighborhoodsFindManyByCitiesRequest,
  token?: string
): Promise<AxiosResponse<INeighborhood[]>> => {
  const config = token ? { headers: getHeader({ token }) } : undefined;
  return isketApiClient.post<INeighborhood[]>(
    postNeighborhoodsFindManyByCitiesPATH,
    payload,
    config
  );
};
