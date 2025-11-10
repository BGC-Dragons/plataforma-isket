import { type AxiosResponse } from "axios";
import { isketApiClient } from "./clients/isket-api.client";
import { getHeader } from "./helpers/get-header-function";

// Re-exportar tipos do post-property-ad-search.service.ts
export type {
  BusinessModel,
  PropertyPurpose,
  AdStatus,
  PropertyStatus,
  AdvertiserType,
  AreaType,
  IAreaFilter,
  IPriceFilter,
  IAddressFilter,
  IGeometryFilter,
} from "./post-property-ad-search.service";

// Interface de Request para busca de mapas
export interface IPostPropertyAdSearchMapRequest {
  // Geográficos (Importantes para Mapas)
  bbox?: [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max]
  zoomLevel?: number; // Nível de zoom do mapa para clustering (padrão: 8, máximo: 22)
  radius?: number; // Raio em pixels para clustering de pontos (padrão: 200)

  // Localização
  cityStateCodes?: string[];
  neighborhoods?: string[];
  address?: {
    postalCode?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    stateAcronym?: string;
    countryAcronym?: string;
  };
  geometry?: Array<{
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
    radius?: string; // e.g., "5km"
  }>;

  // Filtros de Propriedade
  businessModels?: string[];
  propertyPurposes?: string[];
  propertyTypes?: string[];
  rooms?: number[];
  suites?: number[];
  bathrooms?: number[];
  parking?: number[];
  area?: Array<{
    type: "TOTAL" | "BUILT" | "LAND";
    min: number;
    max: number;
  }>;
  prices?: Array<{
    businessModel: string;
    type: "total" | "pricePerSquareMeter";
    min: number;
    max: number;
  }>;
  status?: string[];
  propertyStatus?: string[];

  // Filtros de Anunciante
  advertiserIds?: string[];
  advertiserTypes?: string[];
}

// Interface de Response - Cluster
export interface IMapCluster {
  clusterId: number;
  count: number;
  coordinates: [number, number]; // [longitude, latitude]
}

// Interface de Response - Point
export interface IMapPoint {
  id: string;
  url?: string;
  firstImageUrl?: string | null;
  rooms?: number | null;
  bathrooms?: number | null;
  suites?: number | null;
  parking?: number | null;
  areaTotal?: number | null;
  areaUsable?: number | null;
  price?: number | null;
  coordinates: [number, number]; // [longitude, latitude]
}

// Interface de Response completa
export interface IPostPropertyAdSearchMapResponse {
  clusters: IMapCluster[];
  points: IMapPoint[];
}

// Constante do endpoint
export const postPropertyAdSearchMapPATH = "/property-ad/search-map";

// Função principal do service
export const postPropertyAdSearchMap = (
  params: IPostPropertyAdSearchMapRequest,
  token?: string
): Promise<AxiosResponse<IPostPropertyAdSearchMapResponse>> => {
  return isketApiClient.post<IPostPropertyAdSearchMapResponse>(
    postPropertyAdSearchMapPATH,
    params,
    {
      headers: getHeader(token ? { token } : {}),
    }
  );
};
