import * as XLSX from "xlsx";
import type { IPropertyAd } from "../../../services/post-property-ad-search.service";
import {
  getTotalPrice,
  getAreaValue,
  getPricePerSquareMeter,
  translatePropertyType,
  mapCalculationCriterionToAreaType,
} from "./evaluation-helpers";

/**
 * Formata valor monetário para exibição
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Prepara os dados para exportação em Excel
 */
export function prepareExportData(
  properties: IPropertyAd[],
  calculationCriterion: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const areaType = mapCalculationCriterionToAreaType(calculationCriterion);

  return properties.map((property) => {
    const totalPrice = getTotalPrice(property);
    const areaValue = getAreaValue(property, areaType);
    const pricePerM2 = areaValue > 0 ? totalPrice / areaValue : 0;
    const usableArea = getAreaValue(property, "USABLE");
    const totalArea = getAreaValue(property, "TOTAL");

    return {
      ID: property.id,
      Título: property.title || "",
      Tipo:
        translatePropertyType(property.propertyType) || property.propertyType,
      Endereço: property.formattedAddress || "",
      Bairro: property.address?.neighborhood || "",
      Cidade: property.address?.city || "",
      Estado: property.address?.state || property.address?.stateAcronym || "",
      CEP: property.address?.postalCode || "",

      // Preços
      "Preço Total": totalPrice,
      "Preço Formatado": formatCurrency(totalPrice),

      // Áreas (sempre exporta ambas)
      "Área Útil (m²)": usableArea,
      "Área Total (m²)": totalArea,

      // Preço por m² (ambas as áreas)
      "Preço por m² (Útil)": getPricePerSquareMeter(property, "USABLE"),
      "Preço por m² (Total)": getPricePerSquareMeter(property, "TOTAL"),
      "Preço por m² Selecionado": pricePerM2,
      "Preço por m² Formatado": formatCurrency(pricePerM2),
      "Tipo de Área Usado":
        areaType === "USABLE"
          ? "Área Útil"
          : areaType === "BUILT"
          ? "Área Construída"
          : "Área Total",

      // Características
      Quartos: property.rooms || 0,
      Suítes: property.suites || 0,
      Banheiros: property.bathrooms || 0,
      Vagas: property.parking || 0,
      Andar: property.address?.streetNumber || "",
      "Ano de Construção": property.buildingYear
        ? new Date(property.buildingYear).getFullYear()
        : "",
      Código: property.code || "",
      "Status do Imóvel": property.propertyStatus || "",
      "Status do Anúncio": property.status || "",
      Descrição: property.description || "",
      URL: property.url || "",
      "Data de Criação": property.advertisingAt
        ? new Date(property.advertisingAt).toLocaleDateString("pt-BR")
        : "",
      "Data de Atualização": property.advertisingAt
        ? new Date(property.advertisingAt).toLocaleDateString("pt-BR")
        : "",
    };
  });
}

/**
 * Faz download do arquivo Excel
 */
export function downloadXLSX(
  properties: IPropertyAd[],
  calculationCriterion: string
): void {
  if (properties.length === 0) {
    console.warn("Nenhum imóvel selecionado para download");
    return;
  }

  // Prepara os dados
  const exportData = prepareExportData(properties, calculationCriterion);

  // Cria worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Define larguras das colunas
  const colWidths = [
    { wch: 15 }, // ID
    { wch: 30 }, // Título
    { wch: 15 }, // Tipo
    { wch: 40 }, // Endereço
    { wch: 20 }, // Bairro
    { wch: 20 }, // Cidade
    { wch: 10 }, // Estado
    { wch: 12 }, // CEP
    { wch: 15 }, // Preço Total
    { wch: 20 }, // Preço Formatado
    { wch: 12 }, // Área Útil
    { wch: 12 }, // Área Total
    { wch: 15 }, // Preço por m² (Útil)
    { wch: 15 }, // Preço por m² (Total)
    { wch: 20 }, // Preço por m² Selecionado
    { wch: 20 }, // Preço por m² Formatado
    { wch: 18 }, // Tipo de Área Usado
    { wch: 8 }, // Quartos
    { wch: 8 }, // Suítes
    { wch: 10 }, // Banheiros
    { wch: 8 }, // Vagas
    { wch: 10 }, // Andar
    { wch: 15 }, // Ano de Construção
    { wch: 15 }, // Código
    { wch: 15 }, // Status do Imóvel
    { wch: 15 }, // Status do Anúncio
    { wch: 50 }, // Descrição
    { wch: 40 }, // URL
    { wch: 15 }, // Data de Criação
    { wch: 15 }, // Data de Atualização
  ];

  ws["!cols"] = colWidths;

  // Cria workbook
  const wb = XLSX.utils.book_new();

  // Adiciona worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, "Imóveis Selecionados");

  // Gera nome do arquivo
  const fileName = `imoveis_selecionados_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;

  // Faz download
  XLSX.writeFile(wb, fileName);

  const areaType = mapCalculationCriterionToAreaType(calculationCriterion);
  console.log(
    `XLSX gerado com ${exportData.length} imóveis usando ${
      areaType === "USABLE"
        ? "Área Útil"
        : areaType === "BUILT"
        ? "Área Construída"
        : "Área Total"
    }`
  );
}
