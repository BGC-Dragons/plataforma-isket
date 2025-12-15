import type { IPropertyAd } from "../../../services/post-property-ad-search.service";

/**
 * Extrai o preço total de venda de um imóvel
 */
export function getTotalPrice(ad: IPropertyAd): number {
  // Primeiro tenta encontrar preço de venda (SALE)
  const salePrice = ad.prices?.find(
    (price) => price.businessModel === "SALE"
  )?.total?.value;
  
  if (salePrice && salePrice > 0) {
    return salePrice;
  }
  
  // Se não encontrar, tenta qualquer preço disponível
  const anyPrice = ad.prices?.find(
    (price) => price.total?.value && price.total.value > 0
  )?.total?.value;
  
  return anyPrice ?? 0;
}

/**
 * Extrai o valor da área (útil ou total) de um imóvel
 */
export function getAreaValue(
  ad: IPropertyAd,
  areaType: "USABLE" | "TOTAL" | "BUILT"
): number {
  if (!ad.area || ad.area.length === 0) {
    return 0;
  }

  // Mapeia os tipos de área para os valores possíveis da API
  const areaTypeMap: Record<string, string[]> = {
    TOTAL: ["TOTAL", "LAND"], // Área total ou terreno
    USABLE: ["USABLE", "PRIVATE", "BUILT"], // Área útil, privada ou construída
    BUILT: ["BUILT", "USABLE", "PRIVATE"], // Área construída, útil ou privada
  };

  const possibleTypes = areaTypeMap[areaType] || [areaType];
  
  // Procura pelo tipo exato primeiro
  let area = ad.area.find((a) => a.areaType === areaType);
  
  // Se não encontrar, procura pelos tipos alternativos
  if (!area) {
    for (const type of possibleTypes) {
      area = ad.area.find((a) => a.areaType === type);
      if (area) break;
    }
  }

  // Se ainda não encontrou e estamos procurando TOTAL, tenta pegar a maior área disponível
  if (!area && areaType === "TOTAL") {
    const areas = ad.area.filter((a) => a.value > 0);
    if (areas.length > 0) {
      area = areas.reduce((max, current) => 
        current.value > max.value ? current : max
      );
    }
  }

  // Se ainda não encontrou e estamos procurando USABLE, tenta pegar qualquer área que não seja LAND
  if (!area && areaType === "USABLE") {
    area = ad.area.find((a) => a.value > 0 && a.areaType !== "LAND");
  }

  return area?.value ?? 0;
}

/**
 * Calcula o preço por metro quadrado usando a área especificada
 */
export function getPricePerSquareMeter(
  ad: IPropertyAd,
  areaType: "USABLE" | "TOTAL" | "BUILT"
): number {
  const areaValue = getAreaValue(ad, areaType);
  const totalPrice = getTotalPrice(ad);

  if (areaValue > 0 && totalPrice > 0) {
    return totalPrice / areaValue;
  }
  return 0;
}

/**
 * Traduz o tipo de propriedade da API para português
 */
export function translatePropertyType(type: string): string {
  const translations: Record<string, string> = {
    APARTMENT: "Apartamento",
    HOUSE: "Casa",
    LAND: "Terreno",
    TOWNHOUSE: "Sobrado",
    COMMERCIAL_OFFICE: "Sala Comercial",
    PENTHOUSE: "Cobertura",
    RANCH: "Chácara",
    WAREHOUSE: "Galpão",
    COMMERCIAL_POINT: "Ponto Comercial",
    BUILDING: "Prédio",
    STORE: "Loja",
    FARM: "Fazenda",
    COTTAGE: "Sítio",
    FLAT: "Flat",
    COMPLEX: "Conjunto",
    KITNET: "Kitnet",
    STUDIO: "Studio",
    GARAGE: "Garagem",
    FLOOR: "Andar",
    GARDEN: "Garden",
    LOFT: "Loft",
    INDUSTRIAL: "Industrial",
    FARMHOUSE: "Granja",
    DUPLEX: "Duplex",
    SEMIDETACHED: "Geminado",
    HARAS: "Haras",
    CLINIC: "Clínica",
    INN: "Pousada",
    OVERSTORE: "Sobreloja",
    CHALET: "Chalé",
    ROOM: "Quarto",
    RESORT: "Resort",
    COMMERCIAL: "Comercial",
    TRIPLEX: "Triplex",
    STUDENT_HOUSING: "República",
    COWORKING: "Coworking",
    BOX: "Box",
    EDICULA: "Edícula",
    LISTED: "Tombado",
    COMMERCIAL_HOUSE: "Casa Comercial",
    COMMERCIAL_ROOM: "Sala Comercial",
    COMMERCIAL_BUILDING: "Prédio Comercial",
    TOP_FLOOR: "Sobreloja",
    COUNTRY_HOUSE: "Casa de Campo",
    CABIN: "Chalé",
    GRANNY_FLAT: "Edícula",
    PARKING_SPACE: "Vaga de Garagem",
    BOARDING_HOUSE: "República",
    LISTED_BUILDING: "Tombado",
    STABLE: "Haras",
    OTHERS: "Outros",
  };

  return translations[type] || type;
}

/**
 * Mapeia o critério de cálculo do componente para o tipo de área da API
 */
export function mapCalculationCriterionToAreaType(
  criterion: string
): "USABLE" | "TOTAL" | "BUILT" {
  switch (criterion) {
    case "area-util":
      return "USABLE";
    case "area-construida":
      return "BUILT";
    case "area-total":
    default:
      return "TOTAL";
  }
}

