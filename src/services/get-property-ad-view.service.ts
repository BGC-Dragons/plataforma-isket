import { type AxiosResponse, type AxiosInstance } from "axios";
import axios from "axios";
import type { IPropertyAd } from "./post-property-ad-search.service";

// Interface para headers opcionais de log
export interface IViewAdHeaders {
  ref?: string;
  userId?: string;
  accountId?: string;
}

// Constante para o path
export const getPropertyAdViewPATH = (id: string) =>
  `/property-ad/view-ad/${id}`;

// TEMPORÁRIO: Token para testes
const TEMP_TEST_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3Mzc3OTQwZmY2M2I5MWFiZGQ2OWJiYiIsImFjY291bnRJZCI6IjY3Mzc3OTQwZmY2M2I5MWFiZGQ2OWJhZSIsImlhdCI6MTc2MjI1NjgyNywiZXhwIjoxNzYyMjYwNDI3fQ.5CaJj15c39iEBU08yEqma3Ryuzs_sshUU-pmMDb-caM";

// TEMPORÁRIO: Instância do axios sem interceptors para evitar conflito com interceptor global
const testAxiosInstance: AxiosInstance = axios.create();

/**
 * Busca um anúncio de propriedade por ID ou URL
 * Endpoint público - não requer autenticação obrigatória
 *
 * @param id - ID do anúncio ou URL do anúncio
 * @param headers - Headers opcionais para log (ref, userId, accountId)
 * @returns Promise com array de anúncios (primeiro elemento é o anúncio solicitado, seguidos por anúncios relacionados)
 */
export const getPropertyAdView = (
  id: string,
  headers?: IViewAdHeaders
): Promise<AxiosResponse<IPropertyAd[]>> => {
  // TEMPORÁRIO: Usar URL completa e token fixo para testes
  const testUrl = `https://api.isket.com.br/property-ad/view-ad/${id}`;
  const testToken = TEMP_TEST_TOKEN;

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${testToken}`,
    "Content-Type": "application/json",
  };

  // Adicionar headers opcionais se fornecidos
  if (headers?.ref) {
    requestHeaders.ref = headers.ref;
  }
  if (headers?.userId) {
    requestHeaders.userId = headers.userId;
  }
  if (headers?.accountId) {
    requestHeaders.accountId = headers.accountId;
  }

  // TEMPORÁRIO: Usar instância separada do axios sem interceptors para garantir que o token fixo seja usado
  return testAxiosInstance.get<IPropertyAd[]>(testUrl, {
    headers: requestHeaders,
  });
};
