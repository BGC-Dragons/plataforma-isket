import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export interface IRevealedProperty {
  id: string;
  acquisitionId: string;
  address: string;
  complement?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  neighborhood?: string;
  selectedRelation: string;
  captureCreated: boolean;
  captureId?: string;
  rawAddress?: {
    formattedAddress?: string;
    street?: string;
    number?: number;
  };
  revealedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGetRevealedPropertiesResponse {
  properties: IRevealedProperty[];
}

export interface IPostRevealedPropertyRequest {
  address: string;
  complement?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  neighborhood?: string;
  selectedRelation?: string;
  captureCreated?: boolean;
  captureId?: string;
  rawAddress?: {
    formattedAddress?: string;
    street?: string;
    number?: number;
  };
}

export interface IPostRevealedPropertiesMultipleRequest {
  cpf: string;
  properties: Array<{
    address: string;
    complement?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    neighborhood?: string;
    selectedRelation?: string;
  }>;
}

export interface IPostRevealedPropertyResponse extends IRevealedProperty {}

export interface IPostRevealedPropertiesMultipleResponse {
  cpf: string;
  properties: IRevealedProperty[];
  createdProperties?: IRevealedProperty[]; // Mantido para compatibilidade
  totalCreated?: number; // Mantido para compatibilidade
}

export interface IPutRevealedPropertyRequest {
  address?: string;
  complement?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  neighborhood?: string;
  selectedRelation?: string;
  captureCreated?: boolean;
  captureId?: string;
  rawAddress?: {
    formattedAddress?: string;
    street?: string;
    number?: number;
  };
}

export const getRevealedPropertiesPATH = (
  acquisitionId: string
) => `/property-listing-acquisitions/acquisitions/${acquisitionId}/revealed-properties`;

export const postRevealedPropertyPATH = (
  acquisitionId: string
) => `/property-listing-acquisitions/acquisitions/${acquisitionId}/revealed-properties`;

export const putRevealedPropertyPATH = (
  acquisitionId: string,
  propertyId: string
) => `/property-listing-acquisitions/acquisitions/${acquisitionId}/revealed-properties/${propertyId}`;

/**
 * Lista todas as propriedades reveladas de uma captação
 * O accountId é automaticamente extraído do token de autenticação
 */
export const getRevealedProperties = (
  acquisitionId: string,
  token: string
): Promise<AxiosResponse<IGetRevealedPropertiesResponse>> => {
  return isketApiClient.get<IGetRevealedPropertiesResponse>(
    getRevealedPropertiesPATH(acquisitionId),
    {
      headers: getHeader({ token }),
    }
  );
};

/**
 * Cria uma propriedade revelada (formato único)
 * O accountId é automaticamente extraído do token de autenticação
 */
export const postRevealedProperty = (
  acquisitionId: string,
  data: IPostRevealedPropertyRequest,
  token: string
): Promise<AxiosResponse<IPostRevealedPropertyResponse>> => {
  return isketApiClient.post<IPostRevealedPropertyResponse>(
    postRevealedPropertyPATH(acquisitionId),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

/**
 * Cria múltiplas propriedades reveladas (formato múltiplo com CPF)
 * O accountId é automaticamente extraído do token de autenticação
 */
export const postRevealedPropertiesMultiple = (
  acquisitionId: string,
  data: IPostRevealedPropertiesMultipleRequest,
  token: string
): Promise<AxiosResponse<IPostRevealedPropertiesMultipleResponse>> => {
  return isketApiClient.post<IPostRevealedPropertiesMultipleResponse>(
    postRevealedPropertyPATH(acquisitionId),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

/**
 * Atualiza uma propriedade revelada
 * O accountId é automaticamente extraído do token de autenticação
 */
export const putRevealedProperty = (
  acquisitionId: string,
  propertyId: string,
  data: IPutRevealedPropertyRequest,
  token: string
): Promise<AxiosResponse<IRevealedProperty>> => {
  return isketApiClient.put<IRevealedProperty>(
    putRevealedPropertyPATH(acquisitionId, propertyId),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

