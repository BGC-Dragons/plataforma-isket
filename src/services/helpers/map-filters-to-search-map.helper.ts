import type { IPostPropertyAdSearchMapRequest } from "../post-property-ad-search-map.service";
import type { ILocalFilterState } from "./map-filters-to-api.helper";

// Re-exportar tipos
export type { ILocalFilterState } from "./map-filters-to-api.helper";

// Mapeamento de tipos de propriedade locais para API (mesmo do map-filters-to-api.helper.ts)
const PROPERTY_TYPE_MAP: Record<string, string> = {
  apartamento_padrao: "APARTMENT",
  apartamento_flat: "FLAT",
  apartamento_loft: "LOFT",
  apartamento_studio: "STUDIO",
  apartamento_duplex: "DUPLEX",
  apartamento_triplex: "TRIPLEX",
  apartamento_cobertura: "PENTHOUSE",
  comercial_sala: "COMMERCIAL_ROOM",
  comercial_casa: "COMMERCIAL_HOUSE",
  comercial_ponto: "COMMERCIAL_POINT",
  comercial_galpao: "WAREHOUSE",
  comercial_loja: "STORE",
  comercial_predio: "COMMERCIAL_BUILDING",
  comercial_clinica: "CLINIC",
  comercial_coworking: "COWORKING",
  comercial_sobreloja: "TOP_FLOOR",
  casa_casa: "HOUSE",
  casa_sobrado: "TOWNHOUSE",
  casa_sitio: "COUNTRY_HOUSE",
  casa_chale: "CABIN",
  casa_chacara: "FARMHOUSE",
  casa_edicula: "GRANNY_FLAT",
  terreno_terreno: "LAND",
  terreno_fazenda: "FARM",
  outros_garagem: "PARKING_SPACE",
  outros_quarto: "ROOM",
  outros_resort: "RESORT",
  outros_republica: "BOARDING_HOUSE",
  outros_box: "BOX",
  outros_tombado: "LISTED_BUILDING",
  outros_granja: "RANCH",
  outros_haras: "STABLE",
  outros_outros: "OTHERS",
};

/**
 * Mapeia os filtros locais para o formato da API de busca de mapas
 */
export const mapFiltersToSearchMap = (
  filters: ILocalFilterState | undefined,
  cityToCodeMap: Record<string, string>,
  bbox: [number, number, number, number], // [lon_min, lat_min, lon_max, lat_max]
  zoomLevel: number
): IPostPropertyAdSearchMapRequest => {
  // Calcular raio baseado no zoom para agrupar mais pontos quando zoom está baixo
  // Zoom baixo (< 10): raio muito maior para agrupar muito mais pontos
  // Zoom médio (10-14): raio maior
  // Zoom alto (> 14): raio médio para mostrar detalhes mas ainda agrupar
  let radius: number;
  if (zoomLevel < 10) {
    radius = 600; // Raio muito grande para agrupar muito quando zoom está longe
  } else if (zoomLevel < 12) {
    radius = 500; // Raio grande para zoom médio-baixo
  } else if (zoomLevel < 14) {
    radius = 400; // Raio médio-grande para zoom médio
  } else if (zoomLevel < 16) {
    radius = 300; // Raio médio para zoom médio-alto
  } else {
    radius = 250; // Raio menor mas ainda agrupa para zoom alto
  }

  const request: IPostPropertyAdSearchMapRequest = {
    bbox,
    zoomLevel: Math.min(Math.max(zoomLevel, 8), 22), // Clamp entre 8 e 22
    radius, // Raio dinâmico baseado no zoom
  };

  if (!filters) {
    return request;
  }

  // Busca textual - quando há coordenadas, usar formato completo com geometria
  if (filters.search) {
    if (filters.addressCoordinates) {
      // Quando há coordenadas do endereço, usar formato completo
      request.formattedAddress = filters.search;
      request.center = {
        lat: filters.addressCoordinates.lat,
        lng: filters.addressCoordinates.lng,
      };
      request.markerPosition = {
        lat: filters.addressCoordinates.lat,
        lng: filters.addressCoordinates.lng,
      };
      request.geometry = [
        {
          type: "circle",
          coordinates: [[filters.addressCoordinates.lng, filters.addressCoordinates.lat]],
          radius: "1000", // 1000 metros conforme exemplo do payload esperado
        },
      ];
      if (filters.addressZoom) {
        request.zoom = filters.addressZoom;
      }
    } else {
      // Fallback: quando não há coordenadas, usar apenas o campo address
      request.address = {
        street: filters.search,
      };
    }
  }

  // Cidades (convertendo para cityStateCodes)
  if (filters.cities.length > 0) {
    request.cityStateCodes = filters.cities
      .map((city) => cityToCodeMap[city])
      .filter((code): code is string => Boolean(code));
  }

  // Bairros
  if (filters.neighborhoods.length > 0) {
    request.neighborhoods = filters.neighborhoods;
  }

  // Business Models
  const businessModels: string[] = [];
  if (filters.venda) {
    businessModels.push("SALE");
  }
  if (filters.aluguel) {
    businessModels.push("RENTAL");
  }
  if (businessModels.length > 0) {
    request.businessModels = businessModels;
  }

  // Property Purposes
  const propertyPurposes: string[] = [];
  if (filters.residencial) {
    propertyPurposes.push("RESIDENTIAL");
  }
  if (filters.comercial) {
    propertyPurposes.push("COMMERCIAL");
  }
  if (filters.industrial) {
    propertyPurposes.push("INDUSTRIAL");
  }
  if (filters.agricultura) {
    propertyPurposes.push("AGRICULTURAL");
  }
  if (propertyPurposes.length > 0) {
    request.propertyPurposes = propertyPurposes;
  }

  // Property Types
  const propertyTypes: string[] = [];
  Object.entries(PROPERTY_TYPE_MAP).forEach(([localKey, apiType]) => {
    if (filters[localKey as keyof ILocalFilterState] === true) {
      propertyTypes.push(apiType);
    }
  });
  if (propertyTypes.length > 0) {
    request.propertyTypes = propertyTypes;
  }

  // Cômodos
  if (filters.quartos !== null) {
    request.rooms = [filters.quartos];
  }
  if (filters.suites !== null) {
    request.suites = [filters.suites];
  }
  if (filters.banheiros !== null) {
    request.bathrooms = [filters.banheiros];
  }
  if (filters.garagem !== null) {
    request.parking = [filters.garagem];
  }

  // Área
  if (filters.area_min > 0 || filters.area_max < 1000000) {
    request.area = [
      {
        type: "TOTAL",
        min: filters.area_min,
        max: filters.area_max,
      },
    ];
  }

  // Preços
  const prices = [];
  if (filters.venda && (filters.preco_min > 0 || filters.preco_max < 100000000)) {
    prices.push({
      businessModel: "SALE",
      type: "total" as const,
      min: filters.preco_min,
      max: filters.preco_max,
    });
  }
  if (filters.aluguel && (filters.preco_min > 0 || filters.preco_max < 100000000)) {
    prices.push({
      businessModel: "RENTAL",
      type: "total" as const,
      min: filters.preco_min,
      max: filters.preco_max,
    });
  }
  if (prices.length > 0) {
    request.prices = prices;
  }

  // Advertiser Types
  const advertiserTypes = [];
  if (filters.proprietario_direto) {
    advertiserTypes.push("INDIVIDUAL");
  }
  if (filters.imobiliaria) {
    advertiserTypes.push("REAL_ESTATE");
  }
  if (filters.portal) {
    advertiserTypes.push("PORTAL");
  }
  if (advertiserTypes.length > 0) {
    request.advertiserTypes = advertiserTypes;
  }

  // Status e propertyStatus não devem ser enviados automaticamente
  // Devem ser adicionados apenas quando explicitamente necessário

  return request;
};



