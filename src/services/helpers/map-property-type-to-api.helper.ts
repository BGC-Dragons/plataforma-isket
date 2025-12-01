import type { PropertyType } from "../post-properties.service";

/**
 * Mapeia o tipo de imóvel do formulário para o formato da API
 */
export const mapPropertyTypeToApi = (propertyType: string): PropertyType => {
  const typeMap: Record<string, PropertyType> = {
    Apartamento: "APARTMENT",
    Casa: "HOUSE",
    Terreno: "LAND",
    Sobrado: "TOWNHOUSE",
    Sala: "COMMERCIAL_OFFICE",
    Cobertura: "PENTHOUSE",
    Chácara: "RANCH",
    Galpão: "WAREHOUSE",
    Ponto: "COMMERCIAL_POINT",
    Predio: "BUILDING",
    Loja: "STORE",
    Fazenda: "FARM",
    Sitio: "COTTAGE",
    Flat: "FLAT",
    Conjunto: "COMPLEX",
    Kitnet: "KITNET",
    Studio: "STUDIO",
    Garagem: "GARAGE",
    Andar: "FLOOR",
    Garden: "GARDEN",
    Loft: "LOFT",
    Industrial: "INDUSTRIAL",
    Granja: "FARMHOUSE",
    Duplex: "DUPLEX",
    Geminado: "SEMIDETACHED",
    Haras: "HARAS",
    Clinica: "CLINIC",
    Pousada: "INN",
    Sobreloja: "OVERSTORE",
    Chale: "CHALET",
    Quarto: "ROOM",
    Resort: "RESORT",
    Comercial: "COMMERCIAL",
    Triplex: "TRIPLEX",
    Republica: "STUDENT_HOUSING",
    Coworking: "COWORKING",
    Box: "BOX",
    Edicula: "EDICULA",
    Tombado: "LISTED",
    "Casa Comercial": "COMMERCIAL_HOUSE",
    Outros: "OTHERS",
  };

  return typeMap[propertyType] || "OTHERS";
};


