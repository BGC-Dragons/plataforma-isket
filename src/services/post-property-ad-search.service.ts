import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

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
  type: "Point" | "circle" | "Polygon";
  coordinates: [number, number] | [[number, number]] | number[][][]; // [longitude, latitude] ou [[longitude, latitude]] ou [[[lng, lat], ...]]
  radius?: string; // e.g., "5km" ou "1000"
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
  center?: {
    lat: number;
    lng: number;
  };
  markerPosition?: {
    lat: number;
    lng: number;
  };
  zoom?: number;

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
  shape?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  point?: {
    lat: number;
    lon: number;
  };
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

// Função principal do service
export const postPropertyAdSearch = (
  params: IPostPropertyAdSearchRequest,
  token?: string
): Promise<AxiosResponse<IPostPropertyAdSearchResponse>> => {
  return isketApiClient.post<IPostPropertyAdSearchResponse>(
    postPropertyAdSearchPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};
