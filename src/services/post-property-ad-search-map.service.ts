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
  zoom?: number; // Zoom do mapa quando há busca por endereço
  center?: {
    lat: number;
    lng: number;
  };
  markerPosition?: {
    lat: number;
    lng: number;
  };

  // Localização
  cityStateCodes?: string[];
  neighborhoods?: string[];
  formattedAddress?: string; // Endereço completo formatado
  address?: {
    postalCode?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    stateAcronym?: string;
    countryAcronym?: string;
  };
  geometry?: Array<{
    type: "Point" | "circle" | "Polygon";
    coordinates: [number, number] | [[number, number]] | number[][][]; // [longitude, latitude] ou [[longitude, latitude]] ou [[[lng, lat], ...]]
    radius?: string; // e.g., "5km" ou "1000"
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

  // Outros
  requireAreaInfo?: boolean;
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
  // Informações de localização quando há busca por endereço
  center?: {
    lat: number;
    lng: number;
  };
  markerPosition?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  geometry?: Array<{
    type: "Point" | "circle" | "Polygon";
    coordinates: [number, number] | [[number, number]] | number[][][];
    radius?: string;
  }>;
  formattedAddress?: string;
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
