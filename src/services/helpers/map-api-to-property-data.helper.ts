import type { IPropertyAd } from "../post-property-ad-search.service";

// Interface local de PropertyData
export interface IPropertyData {
  id: string;
  title?: string;
  price: number;
  pricePerSquareMeter: number;
  address: string; // Rua com número
  neighborhood?: string; // Bairro
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  images: string[];
  isFavorite?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Mapeia a resposta da API para o formato local PropertyData
 */
export const mapApiToPropertyData = (propertyAd: IPropertyAd): IPropertyData => {
  // Extrair preço principal (primeiro modelo de negócio disponível)
  // Priorizar preço total (total.value), se não houver, usar pricePerSquareMeter
  const mainPrice = propertyAd.prices?.[0];
  const price = mainPrice?.total?.value || 0;

  // Extrair área total (priorizar areaType === "TOTAL")
  const totalAreaObj = propertyAd.area?.find((a) => a.areaType === "TOTAL") || 
                       propertyAd.area?.find((a) => a.areaType === "BUILT") ||
                       propertyAd.area?.find((a) => a.areaType === "LAND") ||
                       propertyAd.area?.[0];
  const totalArea = totalAreaObj?.value || 0;

  // Extrair área total para exibição
  const area = totalArea;

  // Calcular preço por m²
  // Se a API já retornou pricePerSquareMeter, usar esse valor
  // Caso contrário, calcular dividindo o preço total pela área
  let pricePerSquareMeter = 0;
  if (mainPrice?.pricePerSquareMeter?.value) {
    // Usar o valor direto da API se disponível
    pricePerSquareMeter = mainPrice.pricePerSquareMeter.value;
  } else if (totalArea > 0 && price > 0) {
    // Calcular dividindo preço total pela área
    pricePerSquareMeter = price / totalArea;
  }

  // Determinar tipo de propriedade baseado em propertyPurpose ou propertyType
  let propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO" = "RESIDENCIAL";
  if (propertyAd.propertyPurpose?.includes("COMMERCIAL")) {
    propertyType = "COMERCIAL";
  } else if (propertyAd.propertyPurpose?.includes("AGRICULTURAL")) {
    propertyType = "TERRENO";
  } else if (propertyAd.propertyPurpose?.includes("RESIDENTIAL")) {
    propertyType = "RESIDENCIAL";
  } else {
    // Fallback baseado no propertyType se propertyPurpose não estiver disponível
    const pt = propertyAd.propertyType?.toUpperCase() || "";
    if (pt.includes("COMMERCIAL") || pt.includes("COMERCIAL")) {
      propertyType = "COMERCIAL";
    } else if (
      pt.includes("LAND") ||
      pt.includes("TERRENO") ||
      pt.includes("FARM")
    ) {
      propertyType = "TERRENO";
    }
  }

  // Extrair coordenadas (a API usa [longitude, latitude])
  const coordinates = propertyAd.address?.geo?.coordinates &&
    propertyAd.address.geo.coordinates.length >= 2
    ? {
        lng: propertyAd.address.geo.coordinates[0],
        lat: propertyAd.address.geo.coordinates[1],
      }
    : undefined;

  // Endereço (rua com número) - apenas street e streetNumber
  const address = propertyAd.address
    ? `${propertyAd.address.street || ""}${propertyAd.address.streetNumber ? `, ${propertyAd.address.streetNumber}` : ""}`.trim()
    : propertyAd.formattedAddress?.split(",")[0] || ""; // Se formattedAddress, pegar primeira parte

  // Bairro - tentar extrair do address.neighborhood ou do formattedAddress
  let neighborhood = propertyAd.address?.neighborhood || "";
  
  // Se não houver neighborhood no address, tentar extrair do formattedAddress
  if (!neighborhood && propertyAd.formattedAddress) {
    const parts = propertyAd.formattedAddress.split(",");
    // Normalmente o formato é: "Rua, Número, Bairro, Cidade, Estado"
    // Tentar pegar a parte que pode ser o bairro (geralmente após a rua e número)
    if (parts.length >= 3) {
      neighborhood = parts[2]?.trim() || "";
    } else if (parts.length === 2) {
      // Se só tem 2 partes, a segunda pode ser bairro ou cidade
      neighborhood = parts[1]?.trim() || "";
    }
  }

  // Cidade e estado
  const city = propertyAd.address?.city || "";
  const state = propertyAd.address?.stateAcronym || propertyAd.address?.state || "";

  return {
    id: propertyAd.id,
    title: propertyAd.title,
    price,
    pricePerSquareMeter,
    address,
    neighborhood,
    city,
    state,
    propertyType,
    bedrooms: propertyAd.rooms,
    bathrooms: propertyAd.bathrooms,
    area,
    images: propertyAd.urlImages || [],
    isFavorite: false, // Inicialmente sempre false, pode ser gerenciado por estado separado
    coordinates,
  };
};

/**
 * Mapeia um array de propriedades da API para o formato local
 */
export const mapApiToPropertyDataArray = (
  propertyAds: IPropertyAd[]
): IPropertyData[] => {
  return propertyAds.map(mapApiToPropertyData);
};

