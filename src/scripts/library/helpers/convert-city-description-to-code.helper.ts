/**
 * Converte a descrição da cidade do formato do Google Places API
 * para o formato de código usado pela API (cityStateCode).
 *
 * @example
 * convertCityDescriptionToCode("Curitiba, PR, Brasil") // "curitiba_pr"
 * convertCityDescriptionToCode("São Paulo, SP, Brasil") // "sao_paulo_sp"
 * convertCityDescriptionToCode("Flores da Cunha, RS, Brasil") // "flores_da_cunha_rs"
 *
 * @param cityDescription - Descrição da cidade no formato "Cidade, Estado, País"
 * @returns Código da cidade no formato "cidade_estado" ou a string original se não puder converter
 */
export const convertCityDescriptionToCode = (
  cityDescription: string
): string => {
  // Se já está no formato correto (contém underscore), retornar como está
  if (cityDescription.includes("_")) {
    return cityDescription;
  }

  // Converte "Curitiba, PR, Brasil" para "curitiba_pr"
  const parts = cityDescription.split(", ");
  if (parts.length < 2) return cityDescription;

  const cityName = parts[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "_"); // Substitui espaços por underscore

  const stateCode = parts[1].toLowerCase();

  return `${cityName}_${stateCode}`;
};
