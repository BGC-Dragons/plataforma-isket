import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

export type ContactRelationship =
  | "owner"
  | "related"
  | "family"
  | "business"
  | "friend"
  | "neighbor"
  | "other";

export interface IPostPropertyListingAcquisitionContactRequest {
  name: string;
  cpf: string;
  emails?: string[]; // API espera array de emails
  phones?: string[]; // API espera array de phones
  email?: string; // Mantido para compatibilidade
  phone?: string; // Mantido para compatibilidade
  relationship: ContactRelationship;
}

export interface IPropertyListingAcquisitionContact {
  id: string;
  acquisitionId: string; // API retorna acquisitionId, não acquisitionProcessId
  name: string;
  cpf: string;
  emails?: string[]; // API retorna array de emails
  phones?: string[]; // API retorna array de phones
  email?: string; // Mantido para compatibilidade
  phone?: string; // Mantido para compatibilidade
  relationship: ContactRelationship | "family"; // API pode retornar "family"
  isPrimary?: boolean; // Campo adicional da API
  createdAt: string;
  updatedAt: string;
}

export const postPropertyListingAcquisitionContactPATH = (
  acquisitionProcessId: string
) => `/property-listing-acquisitions/acquisitions/${acquisitionProcessId}/contacts`;

/**
 * Cria um novo contato para uma captação
 * O accountId e userId são automaticamente extraídos do token de autenticação
 */
export const postPropertyListingAcquisitionContact = (
  acquisitionProcessId: string,
  data: IPostPropertyListingAcquisitionContactRequest,
  token: string
): Promise<AxiosResponse<IPropertyListingAcquisitionContact>> => {
  return isketApiClient.post<IPropertyListingAcquisitionContact>(
    postPropertyListingAcquisitionContactPATH(acquisitionProcessId),
    data,
    {
      headers: getHeader({ token }),
    }
  );
};

