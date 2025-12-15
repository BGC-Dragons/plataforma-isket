import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { IPropertyAd } from "../../../services/post-property-ad-search.service";
import {
  getTotalPrice,
  getAreaValue,
  getPricePerSquareMeter,
  translatePropertyType,
  mapCalculationCriterionToAreaType,
} from "./evaluation-helpers";

export interface ReportProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  pricePerM2Usable: number;
  pricePerM2Total: number;
  usableArea: number;
  totalArea: number;
  rooms: number;
  bathrooms: number;
  parking: number;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
  };
  propertyType: string;
  features: string[];
  images: string[];
  includeInReport: boolean;
  customNotes: string;
}

export interface ReportSummary {
  totalProperties: number;
  averagePrice: number;
  averagePricePerM2: number;
  averageUsableArea: number;
  averageTotalArea: number;
  priceRange: { min: number; max: number };
  areaRange: { min: number; max: number };
}

export interface ReportData {
  title: string;
  subtitle: string;
  description: string;
  author: string;
  date: string;
  properties: ReportProperty[];
  summary: ReportSummary;
}

/**
 * Formata valor monetário
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
 * Inicializa os dados do relatório a partir dos imóveis selecionados
 */
export function initializeReportData(
  properties: IPropertyAd[],
  areaType: "USABLE" | "TOTAL" | "BUILT"
): ReportProperty[] {
  return properties.map((ad) => {
    return {
      id: ad.id,
      title: ad.address?.street || `Imóvel ${ad.id}`,
      description: ad.description || "",
      price: getTotalPrice(ad),
      pricePerM2Usable: getPricePerSquareMeter(ad, "USABLE"),
      pricePerM2Total: getPricePerSquareMeter(ad, "TOTAL"),
      usableArea: getAreaValue(ad, "USABLE"),
      totalArea: getAreaValue(ad, "TOTAL"),
      rooms: ad.rooms || 0,
      bathrooms: ad.bathrooms || 0,
      parking: ad.parking || 0,
      address: {
        street: ad.address?.street || "",
        neighborhood: ad.address?.neighborhood || "",
        city: ad.address?.city || "",
        state: ad.address?.stateAcronym || ad.address?.state || "",
        postalCode: ad.address?.postalCode || "",
      },
      propertyType: translatePropertyType(ad.propertyType) || ad.propertyType,
      features: ad.features || [],
      images: ad.urlImages || [],
      includeInReport: true,
      customNotes: "",
    };
  });
}

/**
 * Calcula o resumo do relatório
 */
export function calculateSummary(
  properties: ReportProperty[],
  areaType: "USABLE" | "TOTAL" | "BUILT"
): ReportSummary {
  const includedProperties = properties.filter((p) => p.includeInReport);

  if (includedProperties.length === 0) {
    return {
      totalProperties: 0,
      averagePrice: 0,
      averagePricePerM2: 0,
      averageUsableArea: 0,
      averageTotalArea: 0,
      priceRange: { min: 0, max: 0 },
      areaRange: { min: 0, max: 0 },
    };
  }

  const prices = includedProperties.map((p) => p.price).filter((p) => p > 0);
  const pricesPerM2 = includedProperties
    .map((p) => (areaType === "USABLE" ? p.pricePerM2Usable : p.pricePerM2Total))
    .filter((p) => p > 0);
  const usableAreas = includedProperties
    .map((p) => p.usableArea)
    .filter((a) => a > 0);
  const totalAreas = includedProperties
    .map((p) => p.totalArea)
    .filter((a) => a > 0);

  const areas = areaType === "USABLE" ? usableAreas : totalAreas;

  return {
    totalProperties: includedProperties.length,
    averagePrice:
      prices.length > 0
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : 0,
    averagePricePerM2:
      pricesPerM2.length > 0
        ? Math.round(
            pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length
          )
        : 0,
    averageUsableArea:
      usableAreas.length > 0
        ? Math.round(
            usableAreas.reduce((a, b) => a + b, 0) / usableAreas.length
          )
        : 0,
    averageTotalArea:
      totalAreas.length > 0
        ? Math.round(totalAreas.reduce((a, b) => a + b, 0) / totalAreas.length)
        : 0,
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    },
    areaRange: {
      min: areas.length > 0 ? Math.min(...areas) : 0,
      max: areas.length > 0 ? Math.max(...areas) : 0,
    },
  };
}

/**
 * Gera o PDF do relatório
 */
export function generatePDF(reportData: ReportData, filename: string): void {
  const doc = new jsPDF();
  let yPosition = 20;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(reportData.title || "Relatório de Avaliação Imobiliária", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(
    reportData.subtitle || "Análise Comparativa de Mercado",
    20,
    yPosition
  );
  yPosition += 10;

  // Informações do relatório
  doc.setFontSize(10);
  doc.text(`Autor: ${reportData.author || "Autor"}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Data: ${reportData.date}`, 20, yPosition);
  yPosition += 10;

  // Descrição
  if (reportData.description) {
    doc.setFontSize(12);
    doc.text("Descrição", 20, yPosition);
    yPosition += 5;
    doc.setFontSize(10);
    const descriptionLines = doc.splitTextToSize(
      reportData.description,
      170
    );
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 5 + 10;
  }

  // Resumo Executivo
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Executivo", 20, yPosition);
  yPosition += 10;

  // Box de valor de avaliação
  doc.setFillColor(25, 118, 210);
  doc.roundedRect(20, yPosition, 170, 30, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(
    formatCurrency(reportData.summary.averagePrice),
    105,
    yPosition + 12,
    { align: "center" }
  );
  doc.setFontSize(12);
  doc.text("VALOR DE AVALIAÇÃO", 105, yPosition + 20, { align: "center" });
  doc.setFontSize(10);
  const areaTypeLabel =
    reportData.summary.averagePricePerM2 > 0
      ? `Estimativa baseada em ${formatCurrency(reportData.summary.averagePricePerM2)}/m²`
      : "Estimativa baseada em área";
  doc.text(areaTypeLabel, 105, yPosition + 26, { align: "center" });
  yPosition += 40;

  doc.setTextColor(0, 0, 0);

  // Métricas
  const metrics = [
    {
      label: "Imóveis avaliados",
      value: reportData.summary.totalProperties.toString(),
    },
    {
      label: "Preço médio/m²",
      value: formatCurrency(reportData.summary.averagePricePerM2),
    },
    {
      label: "Faixa de área",
      value: `${reportData.summary.areaRange.min}m² - ${reportData.summary.areaRange.max}m²`,
    },
  ];

  doc.setFontSize(10);
  metrics.forEach((metric, index) => {
    const x = 20 + index * 57;
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x, yPosition, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(metric.label, x, yPosition + 5, { align: "center" });
  });
  yPosition += 20;

  // Tabela de imóveis
  const includedProperties = reportData.properties.filter(
    (p) => p.includeInReport
  );

  if (includedProperties.length > 0) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Imóveis Avaliados", 20, yPosition);
    yPosition += 10;

    const tableData = includedProperties.map((prop) => [
      prop.title.substring(0, 30),
      prop.address.neighborhood || "",
      formatCurrency(prop.price),
      `${prop.totalArea}m²`,
      formatCurrency(prop.pricePerM2Total),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Endereço", "Bairro", "Preço", "Área", "Preço/m²"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [25, 118, 210] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
      },
    });
  }

  // Salva o PDF
  doc.save(filename);
}

