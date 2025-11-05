import type { IPropertyAd } from "../post-property-ad-search.service";

// Interface local de PropertyDetailsData
export interface IPropertyDetailsData {
  id: string;
  title: string;
  status: "VENDA" | "ALUGUEL";
  price: number;
  pricePerSquareMeter: number;
  address: string;
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  totalArea: number;
  usableArea?: number;
  images: string[];
  characteristics?: string[];
  description?: string;
  realEstateName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Mapeia a resposta da API (IPropertyAd) para o formato local PropertyDetailsData
 */
export const mapApiToPropertyDetails = (propertyAd: IPropertyAd): IPropertyDetailsData => {
  // Extrair preço principal (primeiro modelo de negócio disponível)
  const mainPrice = propertyAd.prices?.[0];
  const price = mainPrice?.total?.value || 0;

  // Extrair área total e área útil
  const totalAreaObj = propertyAd.area?.find((a) => a.areaType === "TOTAL") || 
                       propertyAd.area?.find((a) => a.areaType === "BUILT") ||
                       propertyAd.area?.find((a) => a.areaType === "LAND") ||
                       propertyAd.area?.[0];
  const totalArea = totalAreaObj?.value || 0;

  const usableAreaObj = propertyAd.area?.find((a) => a.areaType === "BUILT") || 
                        propertyAd.area?.find((a) => a.areaType === "PRIVATE");
  const usableArea = usableAreaObj?.value;

  // Calcular preço por m²
  let pricePerSquareMeter = 0;
  if (mainPrice?.pricePerSquareMeter?.value) {
    pricePerSquareMeter = mainPrice.pricePerSquareMeter.value;
  } else if (totalArea > 0 && price > 0) {
    pricePerSquareMeter = price / totalArea;
  }

  // Determinar status (VENDA ou ALUGUEL) baseado no businessModel
  let status: "VENDA" | "ALUGUEL" = "VENDA";
  if (mainPrice?.businessModel === "RENTAL" || propertyAd.businessModels?.includes("RENTAL")) {
    status = "ALUGUEL";
  } else if (mainPrice?.businessModel === "SALE" || propertyAd.businessModels?.includes("SALE")) {
    status = "VENDA";
  }

  // Determinar tipo de propriedade
  let propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO" = "RESIDENCIAL";
  if (propertyAd.propertyPurpose?.includes("COMMERCIAL")) {
    propertyType = "COMERCIAL";
  } else if (propertyAd.propertyPurpose?.includes("AGRICULTURAL")) {
    propertyType = "TERRENO";
  } else if (propertyAd.propertyPurpose?.includes("RESIDENTIAL")) {
    propertyType = "RESIDENCIAL";
  } else {
    // Fallback baseado no propertyType
    const pt = propertyAd.propertyType?.toUpperCase() || "";
    if (pt.includes("COMMERCIAL") || pt.includes("COMERCIAL")) {
      propertyType = "COMERCIAL";
    } else if (pt.includes("LAND") || pt.includes("TERRENO") || pt.includes("FARM")) {
      propertyType = "TERRENO";
    }
  }

  // Extrair coordenadas
  const coordinates = propertyAd.address?.geo?.coordinates &&
    propertyAd.address.geo.coordinates.length >= 2
    ? {
        lat: propertyAd.address.geo.coordinates[1],
        lng: propertyAd.address.geo.coordinates[0],
      }
    : undefined;

  // Endereço completo
  const address = propertyAd.formattedAddress ||
    (propertyAd.address
      ? `${propertyAd.address.street || ""}${propertyAd.address.streetNumber ? `, ${propertyAd.address.streetNumber}` : ""}${propertyAd.address.neighborhood ? `, ${propertyAd.address.neighborhood}` : ""}`
      : "");

  // Cidade e estado
  const city = propertyAd.address?.city || "";
  const state = propertyAd.address?.stateAcronym || propertyAd.address?.state || "";

  // Nome da imobiliária
  const realEstateName = propertyAd.advertiser?.name;

  // Título (usar title ou criar baseado no tipo)
  const title = propertyAd.title || 
    `${propertyAd.propertyType || "Propriedade"}${propertyAd.rooms ? ` - ${propertyAd.rooms} quartos` : ""}`;

  // Características (features)
  const characteristics = propertyAd.features || [];

  return {
    id: propertyAd.id,
    title: title.trim() || "Propriedade",
    status,
    price,
    pricePerSquareMeter,
    address: address.trim(),
    city,
    state,
    propertyType,
    bedrooms: propertyAd.rooms,
    bathrooms: propertyAd.bathrooms,
    totalArea,
    usableArea,
    images: propertyAd.urlImages || [],
    characteristics,
    description: propertyAd.description,
    realEstateName,
    coordinates,
  };
};

