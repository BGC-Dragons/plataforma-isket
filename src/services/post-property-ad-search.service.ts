import { type AxiosResponse, type AxiosInstance } from "axios";
import axios from "axios";

// Enums
export type BusinessModel =
  | "SALE"
  | "RENTAL"
  | "EXCHANGE"
  | "LEASE"
  | "SUBLEASE"
  | "LEASE_WITH_OPTION_TO_BUY"
  | "RENT_TO_OWN"
  | "TIMESHARE"
  | "AUCTION";

export type PropertyPurpose =
  | "RESIDENTIAL"
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "AGRICULTURAL"
  | "MIXED_USE"
  | "INVESTMENT"
  | "VACATION"
  | "RETAIL"
  | "OFFICE"
  | "OTHERS";

export type AdStatus =
  | "PUBLISHED"
  | "PENDING"
  | "WITHDRAWN"
  | "EXPIRED"
  | "COMING_SOON"
  | "PRICE_REDUCED"
  | "NEW_LISTING";

export type PropertyStatus =
  | "AVAILABLE"
  | "SOLD"
  | "UNDER_CONTRACT"
  | "OFF_MARKET";

export type AdvertiserType = "REAL_ESTATE" | "INDIVIDUAL" | "PORTAL";

export type AreaType = "TOTAL" | "BUILT" | "LAND";

export type SortBy = "area" | "price" | "pricePerSquareMeter";

export type SortOrder = "asc" | "desc";

// Interfaces de Request
export interface IAreaFilter {
  type: AreaType;
  min: number;
  max: number;
}

export interface IPriceFilter {
  businessModel: BusinessModel;
  type: "total" | "pricePerSquareMeter";
  min: number;
  max: number;
}

export interface IAddressFilter {
  postalCode?: string;
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  stateAcronym?: string;
  country?: string;
  countryAcronym?: string;
}

export interface IGeometryFilter {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  radius?: string; // e.g., "5km"
}

export interface IPostPropertyAdSearchRequest {
  // Paginação e Ordenação
  page?: number;
  size?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  sortType?: AreaType;

  // Localização
  cityStateCodes?: string[];
  neighborhoods?: string[];
  formattedAddress?: string;
  address?: IAddressFilter;
  bbox?: [number, number, number, number]; // [lat_min, lon_min, lat_max, lon_max]
  geometry?: IGeometryFilter[];
  radius?: number; // em metros

  // Filtros de Propriedade
  businessModels?: BusinessModel[];
  propertyPurposes?: PropertyPurpose[];
  propertyTypes?: string[];
  rooms?: number[];
  suites?: number[];
  bathrooms?: number[];
  parking?: number[];
  area?: IAreaFilter[];
  prices?: IPriceFilter[];
  status?: AdStatus[];
  propertyStatus?: PropertyStatus[];

  // Filtros de Anunciante
  advertiserIds?: string[];
  advertiserTypes?: AdvertiserType[];

  // Outros
  requireAreaInfo?: boolean;
  requireCoordinates?: boolean;
}

// Interfaces de Response
export interface IPropertyArea {
  value: number;
  unit: string; // e.g., "METER_SQUARED"
  areaType: string; // e.g., "TOTAL", "PRIVATE", "BUILT", "LAND"
}

export interface IPropertyPrice {
  businessModel: BusinessModel;
  total?: {
    value: number;
    currency: string;
    priceFrequency: string;
  };
  pricePerSquareMeter?: {
    value: number;
    currency: string;
  };
}

export interface IPropertyGeo {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IPropertyAddress {
  postalCode?: string;
  street?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  cityStateCode?: string;
  state?: string;
  stateAcronym?: string;
  country?: string;
  countryAcronym?: string;
  geo?: IPropertyGeo;
}

export interface IPropertyAdvertiser {
  id: string;
  name: string;
  type: AdvertiserType;
}

export interface IPropertyBroker {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface IPropertyCondo {
  name?: string;
}

export interface IPropertyAd {
  id: string;
  propertyType: string;
  rooms?: number;
  suites?: number;
  bathrooms?: number;
  parking?: number;
  area?: IPropertyArea[];
  prices?: IPropertyPrice[];
  url?: string;
  status: AdStatus;
  propertyStatus: PropertyStatus;
  title?: string;
  description?: string;
  code?: string;
  businessModels?: BusinessModel[];
  propertyPurpose?: PropertyPurpose[];
  urlImages?: string[];
  urlVideos?: string[];
  formattedAddress?: string;
  address?: IPropertyAddress;
  advertiser?: IPropertyAdvertiser;
  brokers?: IPropertyBroker[];
  features?: string[];
  condo?: IPropertyCondo;
  buildingYear?: string;
  advertisingAt?: string;
}

export interface ISearchMeta {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
}

export interface IPostPropertyAdSearchResponse {
  data: IPropertyAd[];
  meta: ISearchMeta;
}

// Constantes
export const postPropertyAdSearchPATH = "/property-ad/search";

// TEMPORÁRIO: Token para testes
const TEMP_TEST_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3Mzc3OTQwZmY2M2I5MWFiZGQ2OWJiYiIsImFjY291bnRJZCI6IjY3Mzc3OTQwZmY2M2I5MWFiZGQ2OWJhZSIsImlhdCI6MTc2MjI1NjgyNywiZXhwIjoxNzYyMjYwNDI3fQ.5CaJj15c39iEBU08yEqma3Ryuzs_sshUU-pmMDb-caM";
// TEMPORÁRIO: Instância do axios sem interceptors para evitar conflito com interceptor global
const testAxiosInstance: AxiosInstance = axios.create();

// Função principal do service
export const postPropertyAdSearch = (
  params: IPostPropertyAdSearchRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _token?: string
): Promise<AxiosResponse<IPostPropertyAdSearchResponse>> => {
  // TEMPORÁRIO: Usar URL completa e token fixo para testes
  const testUrl = "https://api.isket.com.br/property-ad/search";
  const testToken = TEMP_TEST_TOKEN;

  const config = {
    headers: {
      Authorization: `Bearer ${testToken}`,
      "Content-Type": "application/json",
    },
  };

  // TEMPORÁRIO: Usar instância separada do axios sem interceptors para garantir que o token fixo seja usado
  return testAxiosInstance.post<IPostPropertyAdSearchResponse>(
    testUrl,
    params,
    config
  );
};
