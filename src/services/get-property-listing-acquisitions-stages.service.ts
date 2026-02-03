import { type AxiosResponse } from "axios";
import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useAuth } from "../scripts/modules/access-manager/auth.hook";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IPropertyListing {
  id: string;
  title: string;
  formattedAddress: string;
  status: string;
  captureType: "PROPERTY" | "CONTACT";
}

export interface IPropertyListingAcquisitionStage {
  id: string;
  title: string;
  order: number;
  color?: string | null;
  fontColor?: string | null;
  icon?: string | null;
  listings: IPropertyListing[];
  createdAt: string;
  updatedAt: string;
}

export const getPropertyListingAcquisitionsStagesPATH =
  "/property-listing-acquisitions/stages";

/**
 * Lista todos os estágios de captação de imóveis
 * O accountId é automaticamente extraído do token de autenticação
 */
export const getPropertyListingAcquisitionsStages = (
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionStage[]>> => {
  return isketApiClient.get<IPropertyListingAcquisitionStage[]>(
    getPropertyListingAcquisitionsStagesPATH,
    {
      headers: getHeader({ token }),
    }
  );
};

export const useAuthedGetPropertyListingAcquisitionsStages = () => {
  const auth = useAuth();
  const fn = useCallback(
    () => getPropertyListingAcquisitionsStages(auth.store.token as string),
    [auth]
  );
  return fn;
};

export const useGetPropertyListingAcquisitionsStages = () => {
  const fetcher = useAuthedGetPropertyListingAcquisitionsStages();
  const auth = useAuth();
  const cacheKey = auth.store.user?.id
    ? [getPropertyListingAcquisitionsStagesPATH, auth.store.user.id]
    : null;
  return useSWR(cacheKey, () => fetcher().then((r) => r.data), {
    revalidateOnMount: true,
  });
};

// Função para invalidar cache de stages
export const clearPropertyListingAcquisitionsStagesCache = () => {
  mutate(
    (key) =>
      Array.isArray(key) && key[0] === getPropertyListingAcquisitionsStagesPATH
  );
};
