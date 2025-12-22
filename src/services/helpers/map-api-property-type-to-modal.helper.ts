/**
 * Mapeia o tipo de imóvel da API para o formato do modal
 */
export function mapApiPropertyTypeToModalType(apiPropertyType: string): string {
  if (!apiPropertyType) return "";

  const typeUpper = apiPropertyType.toUpperCase();

  // Mapeamento direto
  const typeMap: Record<string, string> = {
    APARTMENT: "Apartamento",
    APARTAMENTO: "Apartamento",
    HOUSE: "Casa",
    CASA: "Casa",
    LAND: "Terreno",
    TERRENO: "Terreno",
    TOWNHOUSE: "Sobrado",
    SOBRADO: "Sobrado",
    COMMERCIAL_OFFICE: "Sala",
    SALA: "Sala",
    PENTHOUSE: "Cobertura",
    COBERTURA: "Cobertura",
    FARM: "Chácara",
    CHACARA: "Chácara",
    CHÁCARA: "Chácara",
    RANCH: "Chácara",
    WAREHOUSE: "Galpão",
    GALPAO: "Galpão",
    GALPÃO: "Galpão",
    COMMERCIAL_POINT: "Ponto",
    PONTO: "Ponto",
    BUILDING: "Predio",
    PREDIO: "Predio",
    PRÉDIO: "Predio",
    STORE: "Loja",
    LOJA: "Loja",
    FARMHOUSE: "Fazenda",
    FAZENDA: "Fazenda",
    RURAL_PROPERTY: "Sitio",
    COTTAGE: "Sitio",
    SITIO: "Sitio",
    SÍTIO: "Sitio",
    FLAT: "Flat",
    CONDOMINIUM: "Conjunto",
    COMPLEX: "Conjunto",
    CONJUNTO: "Conjunto",
    KITNET: "Kitnet",
    STUDIO: "Studio",
    GARAGE: "Garagem",
    GARAGEM: "Garagem",
    FLOOR: "Andar",
    ANDAR: "Andar",
    GARDEN: "Garden",
    LOFT: "Loft",
    INDUSTRIAL: "Industrial",
    GRANJA: "Granja",
    DUPLEX: "Duplex",
    DÚPLEX: "Duplex",
    TWIN_HOUSE: "Geminado",
    SEMIDETACHED: "Geminado",
    GEMINADO: "Geminado",
    STABLE: "Haras",
    HARAS: "Haras",
    CLINIC: "Clinica",
    CLINICA: "Clinica",
    CLÍNICA: "Clinica",
    INN: "Pousada",
    POUSADA: "Pousada",
    GROUND_FLOOR: "Sobreloja",
    OVERSTORE: "Sobreloja",
    SOBRELOJA: "Sobreloja",
    CABIN: "Chale",
    CHALET: "Chale",
    CHALE: "Chale",
    CHALÉ: "Chale",
    ROOM: "Quarto",
    QUARTO: "Quarto",
    RESORT: "Resort",
    COMMERCIAL: "Comercial",
    TRIPLEX: "Triplex",
    TRÍPLEX: "Triplex",
    SHARED_HOUSE: "Republica",
    STUDENT_HOUSING: "Republica",
    REPUBLICA: "Republica",
    REPÚBLICA: "Republica",
    COWORKING: "Coworking",
    BOX: "Box",
    OUTBUILDING: "Edicula",
    EDICULA: "Edicula",
    EDÍCULA: "Edicula",
    LISTED: "Tombado",
    TOMBADO: "Tombado",
    COMMERCIAL_HOUSE: "Casa Comercial",
    CASA_COMERCIAL: "Casa Comercial",
    OTHERS: "Outros",
  };

  // Buscar mapeamento direto
  if (typeMap[typeUpper]) {
    return typeMap[typeUpper];
  }

  // Buscar por substring (caso contenha o tipo)
  for (const [key, value] of Object.entries(typeMap)) {
    if (typeUpper.includes(key) || key.includes(typeUpper)) {
      return value;
    }
  }

  // Se não encontrar, retornar vazio (usuário pode selecionar manualmente)
  return "";
}

