import type {
  IPostPropertyAdSearchRequest,
  BusinessModel,
  PropertyPurpose,
  SortBy,
  SortOrder,
  AreaType,
  AdvertiserType,
} from "../post-property-ad-search.service";

// Interface local de filtros (do FilterState)
export interface ILocalFilterState {
  search: string;
  cities: string[];
  neighborhoods: string[];
  // Coordenadas do endereço selecionado (quando há busca por endereço)
  addressCoordinates?: { lat: number; lng: number };
  addressZoom?: number;
  // Geometrias dos desenhos no mapa (quando há desenhos)
  drawingGeometries?: Array<
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "circle"; coordinates: [[number, number]]; radius: string }
  >;
  // Negócio
  venda: boolean;
  aluguel: boolean;
  // Finalidade
  residencial: boolean;
  comercial: boolean;
  industrial: boolean;
  agricultura: boolean;
  // Apartamentos
  apartamento_padrao: boolean;
  apartamento_flat: boolean;
  apartamento_loft: boolean;
  apartamento_studio: boolean;
  apartamento_duplex: boolean;
  apartamento_triplex: boolean;
  apartamento_cobertura: boolean;
  apartamento_garden: boolean;
  // Comerciais
  comercial_sala: boolean;
  comercial_casa: boolean;
  comercial_ponto: boolean;
  comercial_galpao: boolean;
  comercial_loja: boolean;
  comercial_predio: boolean;
  comercial_clinica: boolean;
  comercial_coworking: boolean;
  comercial_sobreloja: boolean;
  // Casas e Sítios
  casa_casa: boolean;
  casa_sobrado: boolean;
  casa_sitio: boolean;
  casa_chale: boolean;
  casa_chacara: boolean;
  casa_edicula: boolean;
  // Terrenos
  terreno_terreno: boolean;
  terreno_fazenda: boolean;
  // Outros
  outros_garagem: boolean;
  outros_quarto: boolean;
  outros_resort: boolean;
  outros_republica: boolean;
  outros_box: boolean;
  outros_tombado: boolean;
  outros_granja: boolean;
  outros_haras: boolean;
  outros_outros: boolean;
  // Cômodos
  quartos: number | null;
  banheiros: number | null;
  suites: number | null;
  garagem: number | null;
  // Sliders
  area_min: number;
  area_max: number;
  preco_min: number;
  preco_max: number;
  // Tipo de Anunciante
  proprietario_direto: boolean;
  imobiliaria: boolean;
  portal: boolean;
  // Opcionais
  lancamento: boolean;
  propertyFeatures: string[];
}

// Mapeamento de tipos de propriedade locais para API
const PROPERTY_TYPE_MAP: Record<string, string> = {
  apartamento_padrao: "APARTMENT",
  apartamento_flat: "FLAT",
  apartamento_loft: "LOFT",
  apartamento_studio: "STUDIO",
  apartamento_duplex: "DUPLEX",
  apartamento_triplex: "TRIPLEX",
  apartamento_cobertura: "PENTHOUSE",
  apartamento_garden: "GARDEN",
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
 * Mapeia os filtros locais para o formato da API
 */
export const mapFiltersToApi = (
  filters: ILocalFilterState,
  cityToCodeMap: Record<string, string>,
  page: number = 1,
  size: number = 20,
  sortBy?: SortBy,
  sortOrder?: SortOrder,
  sortType?: AreaType,
): IPostPropertyAdSearchRequest => {
  const request: IPostPropertyAdSearchRequest = {
    page,
    size,
  };

  // Ordenação
  if (sortBy) {
    request.sortBy = sortBy;
  }
  if (sortOrder) {
    request.sortOrder = sortOrder;
  }
  // sortType é obrigatório quando sortBy é "area" ou "pricePerSquareMeter"
  if (sortType) {
    request.sortType = sortType;
  } else if (sortBy === "area" || sortBy === "pricePerSquareMeter") {
    // Fallback: usar "BUILT" como padrão se sortType não foi fornecido (conforme documentação)
    request.sortType = "TOTAL" as AreaType;
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
          coordinates: [
            [filters.addressCoordinates.lng, filters.addressCoordinates.lat],
          ],
          radius: "1000", // 1000 metros conforme exemplo do payload esperado
        },
      ];
      if (filters.addressZoom) {
        request.zoom = filters.addressZoom;
      }
      // NÃO incluir cityStateCodes quando há busca por endereço específico
      // O endereço já contém a localização precisa
    } else {
      // Quando não há coordenadas, usar apenas formattedAddress
      request.formattedAddress = filters.search;
    }
  }

  // Cidades (convertendo para cityStateCodes) - apenas se não houver busca por endereço com coordenadas
  if (filters.cities.length > 0 && !filters.addressCoordinates) {
    request.cityStateCodes = filters.cities
      .map((city) => cityToCodeMap[city])
      .filter((code): code is string => Boolean(code));
  }

  // Bairros
  if (filters.neighborhoods.length > 0) {
    request.neighborhoods = filters.neighborhoods;
  }

  // Business Models
  const businessModels: BusinessModel[] = [];
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
  const propertyPurposes: PropertyPurpose[] = [];
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
        type: "TOTAL" as AreaType,
        min: filters.area_min,
        max: filters.area_max,
      },
    ];
  }

  // Preços
  const prices = [];
  if (
    filters.venda &&
    (filters.preco_min > 0 || filters.preco_max < 100000000)
  ) {
    prices.push({
      businessModel: "SALE" as BusinessModel,
      type: "total" as const,
      min: filters.preco_min,
      max: filters.preco_max,
    });
  }
  if (
    filters.aluguel &&
    (filters.preco_min > 0 || filters.preco_max < 100000000)
  ) {
    prices.push({
      businessModel: "RENTAL" as BusinessModel,
      type: "total" as const,
      min: filters.preco_min,
      max: filters.preco_max,
    });
  }
  if (prices.length > 0) {
    request.prices = prices;
  }

  // Advertiser Types
  const advertiserTypes: AdvertiserType[] = [];
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

  // Lançamento (status NEW_LISTING)
  if (filters.lancamento) {
    request.status = ["NEW_LISTING"];
  }

  // Geometrias dos desenhos (quando há desenhos no mapa)
  if (filters.drawingGeometries && filters.drawingGeometries.length > 0) {
    request.geometry = filters.drawingGeometries.map((geom) => {
      if (geom.type === "Polygon") {
        return {
          type: "Polygon" as const,
          coordinates: geom.coordinates,
        };
      } else if (geom.type === "circle") {
        return {
          type: "circle" as const,
          coordinates: geom.coordinates,
          radius: geom.radius,
        };
      }
      // Fallback (não deveria acontecer)
      // Type assertion necessário porque TypeScript não consegue inferir o tipo no else
      const fallbackGeom = geom as {
        type: "Polygon";
        coordinates: number[][][];
      };
      return {
        type: "Polygon" as const,
        coordinates: fallbackGeom.coordinates,
      };
    });
    request.requireAreaInfo = false;
  }

  // Opcionais (propertyFeatures)
  if (filters.propertyFeatures && filters.propertyFeatures.length > 0) {
    request.propertyFeatures = filters.propertyFeatures;
  }

  return request;
};
