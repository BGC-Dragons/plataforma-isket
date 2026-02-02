import type { IPropertyAd } from "../../../services/post-property-ad-search.service";
import {
  getTotalPrice,
  getAreaValue,
  getPricePerSquareMeter,
  translatePropertyType,
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

export interface ReportCompany {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface ReportAnalysis {
  marketOverview: string;
  priceAnalysis: string;
  locationAnalysis: string;
  recommendations: string;
  conclusion: string;
}

export interface ReportStyling {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPosition: "left" | "center" | "right";
  showCompanyInfo: boolean;
  showAnalysis: boolean;
}

export interface ReportData {
  title: string;
  subtitle: string;
  description: string;
  author: string;
  date: string; // ISO format: YYYY-MM-DD
  company: ReportCompany;
  properties: ReportProperty[];
  summary: ReportSummary;
  analysis: ReportAnalysis;
  styling: ReportStyling;
  /** Base do resumo: "USABLE" (área útil) ou "TOTAL" (área total) */
  areaType?: "USABLE" | "TOTAL" | "BUILT";
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  if (!value || isNaN(value) || value === 0) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Inicializa os dados do relatório a partir dos imóveis selecionados
 */
export function initializeReportData(
  properties: IPropertyAd[]
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
 * Cria dados iniciais completos do relatório
 */
export function createInitialReportData(
  properties: IPropertyAd[],
  areaType: "USABLE" | "TOTAL" | "BUILT" = "TOTAL"
): ReportData {
  const reportProperties = initializeReportData(properties);
  const summary = calculateSummary(reportProperties, areaType);

  return {
    title: "Relatório de Avaliação Imobiliária",
    subtitle: "Análise Comparativa de Mercado",
    description: "",
    author: "",
    date: new Date().toISOString().split("T")[0],
    company: {
      name: "Sua Empresa",
      logo: "",
      address: "",
      phone: "",
      email: "",
      website: "",
    },
    properties: reportProperties,
    summary,
    analysis: {
      marketOverview: "",
      priceAnalysis: "",
      locationAnalysis: "",
      recommendations:
        "Baseado na análise dos dados coletados, recomenda-se uma avaliação mais detalhada considerando as particularidades de cada localização.",
      conclusion:
        "Este relatório fornece uma visão abrangente do mercado imobiliário com base nos imóveis selecionados.",
    },
    styling: {
      primaryColor: "#262353",
      secondaryColor: "#dee6e8",
      fontFamily: "Inter, sans-serif",
      logoPosition: "left",
      showCompanyInfo: true,
      showAnalysis: true,
    },
    areaType: areaType === "BUILT" ? "TOTAL" : areaType,
  };
}

/**
 * Gera análises iniciais automaticamente baseado nos dados dos imóveis
 */
export function generateInitialAnalysis(
  reportData: ReportData
): ReportAnalysis {
  const includedProperties = reportData.properties.filter(
    (p) => p.includeInReport
  );

  if (includedProperties.length === 0) {
    return {
      marketOverview: "",
      priceAnalysis: "",
      locationAnalysis: "",
      recommendations: reportData.analysis.recommendations,
      conclusion: reportData.analysis.conclusion,
    };
  }

  // Visão geral do mercado
  const marketOverview = `Este relatório analisa ${
    includedProperties.length
  } imóveis selecionados, com preços variando entre ${formatCurrency(
    reportData.summary.priceRange.min
  )} e ${formatCurrency(reportData.summary.priceRange.max)}.`;

  // Análise de preços
  const priceAnalysis = `O preço médio dos imóveis analisados é de ${formatCurrency(
    reportData.summary.averagePrice
  )}, com preço por metro quadrado médio de ${formatCurrency(
    reportData.summary.averagePricePerM2
  )}.`;

  // Análise de localização
  const neighborhoods = [
    ...new Set(
      includedProperties.map((p) => p.address.neighborhood).filter(Boolean)
    ),
  ];
  const locationAnalysis =
    neighborhoods.length > 0
      ? `Os imóveis estão distribuídos em ${
          neighborhoods.length
        } bairro(s): ${neighborhoods.join(", ")}.`
      : "Análise de localização baseada nos imóveis selecionados.";

  return {
    marketOverview,
    priceAnalysis,
    locationAnalysis,
    recommendations: reportData.analysis.recommendations,
    conclusion: reportData.analysis.conclusion,
  };
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
    .map((p) =>
      areaType === "USABLE" ? p.pricePerM2Usable : p.pricePerM2Total
    )
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
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Gera HTML completo do relatório para impressão
 */
function generatePrintableHTML(reportData: ReportData): string {
  const includedProperties = reportData.properties.filter(
    (p) => p.includeInReport
  );

  const areaType = reportData.areaType ?? "TOTAL";
  const isUsableArea = areaType === "USABLE";
  const areaLabel = isUsableArea ? "Área Útil" : "Área Total";
  const averageAreaValue = isUsableArea
    ? reportData.summary.averageUsableArea
    : reportData.summary.averageTotalArea;

  // CSS inline completo
  const css = `
    <style>
      @page {
        size: A4;
        margin: 15mm;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: ${reportData.styling.fontFamily};
        color: #000000;
        background-color: #ffffff;
        line-height: 1.6;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .container {
        max-width: 896px;
        width: 100%;
        margin: 0 auto;
        padding: 32px;
        background-color: #ffffff;
      }
      
      .header {
        border-bottom: 3px solid ${reportData.styling.primaryColor};
        padding-bottom: 24px;
        margin-bottom: 32px;
      }
      
      .header-content {
        display: flex;
        align-items: center;
        justify-content: ${
          reportData.styling.logoPosition === "center"
            ? "center"
            : "space-between"
        };
        flex-direction: ${
          reportData.styling.logoPosition === "center" ? "column" : "row"
        };
        gap: 16px;
        margin-bottom: 16px;
      }
      
      .logo {
        height: 64px;
        max-width: 200px;
        object-fit: contain;
      }
      
      .title-section {
        flex: 1;
        text-align: center;
      }
      
      .title {
        font-size: 32px;
        font-weight: 700;
        color: ${reportData.styling.primaryColor};
        margin-bottom: 8px;
      }
      
      .subtitle {
        font-size: 20px;
        color: #666666;
        font-weight: 400;
      }
      
      .company-info {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid ${reportData.styling.secondaryColor};
      }
      
      .company-info-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
      }
      
      .header-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid ${reportData.styling.secondaryColor};
      }
      
      .description-box {
        padding: 24px;
        margin-bottom: 32px;
        background-color: #f5f5f5;
        border-left: 4px solid ${reportData.styling.primaryColor};
      }
      
      .description-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .description-text {
        white-space: pre-line;
        line-height: 1.8;
      }
      
      .section-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 24px;
      }
      
      .evaluation-box {
        padding: 32px;
        margin-bottom: 24px;
        background-color: ${reportData.styling.primaryColor};
        color: #ffffff;
        text-align: center;
        border-radius: 8px;
      }
      
      .evaluation-value {
        font-size: 48px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .evaluation-label {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .metric-card {
        padding: 16px;
        text-align: center;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }
      
      .metric-value {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .metric-label {
        font-size: 14px;
        color: #666666;
      }
      
      .ranges-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      
      .range-card {
        padding: 16px;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }
      
      .range-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .property-card {
        padding: 24px;
        margin-bottom: 24px;
        border: 1px solid ${reportData.styling.secondaryColor};
        border-radius: 8px;
        page-break-inside: avoid;
      }
      
      .property-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      
      .property-title-section {
        flex: 1;
      }
      
      .property-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .property-title {
        font-size: 18px;
        font-weight: 600;
      }
      
      .property-type-chip {
        display: inline-block;
        padding: 4px 12px;
        background-color: ${reportData.styling.primaryColor};
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        border-radius: 16px;
      }
      
      .property-location {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #666666;
        font-size: 14px;
      }
      
      .property-price {
        font-size: 24px;
        font-weight: 700;
        color: ${reportData.styling.primaryColor};
      }
      
      .property-features-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin-bottom: 16px;
        padding: 16px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
      
      .property-feature {
        text-align: center;
      }
      
      .property-feature-label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        margin-bottom: 4px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .property-feature-value {
        font-size: 18px;
        font-weight: 600;
      }
      
      .property-prices-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }
      
      .property-price-card {
        padding: 16px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
      
      .property-price-label {
        font-size: 14px;
        margin-bottom: 4px;
        color: #666666;
      }
      
      .property-price-value {
        font-size: 18px;
        font-weight: 600;
      }
      
      .property-features-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .feature-chip {
        display: inline-block;
        padding: 4px 12px;
        background-color: ${reportData.styling.secondaryColor};
        border: 1px solid ${reportData.styling.primaryColor};
        font-size: 12px;
        border-radius: 16px;
      }
      
      .property-notes {
        padding: 16px;
        background-color: #e3f2fd;
        border-left: 4px solid ${reportData.styling.primaryColor};
        margin-bottom: 16px;
      }
      
      .property-notes-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .property-notes-text {
        white-space: pre-line;
        line-height: 1.8;
        font-size: 14px;
      }
      
      .property-images {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      
      .property-image {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid ${reportData.styling.secondaryColor};
      }
      
      .analysis-section {
        margin-bottom: 32px;
      }
      
      .analysis-card {
        padding: 24px;
        margin-bottom: 16px;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }
      
      .analysis-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .analysis-card-title {
        font-size: 18px;
        font-weight: 600;
      }
      
      .analysis-card-content {
        white-space: pre-line;
        line-height: 1.8;
      }
      
      .analysis-recommendations {
        background-color: #e8f5e9;
        border-left: 4px solid #4caf50;
      }
      
      .analysis-conclusion {
        background-color: #e3f2fd;
        border-left: 4px solid ${reportData.styling.primaryColor};
      }
      
      .footer {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 2px solid ${reportData.styling.secondaryColor};
        text-align: center;
      }
      
      .footer-text {
        font-size: 14px;
        color: #666666;
        margin-bottom: 8px;
      }
      
      .footer-company {
        font-size: 14px;
        font-weight: 600;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .avoid-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .property-card {
          page-break-inside: avoid;
        }
      }
    </style>
  `;

  // HTML do header
  const headerHtml = `
    <div class="header">
      <div class="header-content">
        ${
          reportData.styling.logoPosition !== "right" && reportData.company.logo
            ? `<img src="${escapeHtml(
                reportData.company.logo
              )}" alt="${escapeHtml(reportData.company.name)}" class="logo" />`
            : ""
        }
        <div class="title-section">
          <h1 class="title">${escapeHtml(
            reportData.title || "Relatório de Avaliação Imobiliária"
          )}</h1>
          <h2 class="subtitle">${escapeHtml(
            reportData.subtitle || "Análise Comparativa de Mercado"
          )}</h2>
        </div>
        ${
          reportData.styling.logoPosition === "right" && reportData.company.logo
            ? `<img src="${escapeHtml(
                reportData.company.logo
              )}" alt="${escapeHtml(reportData.company.name)}" class="logo" />`
            : ""
        }
      </div>
      ${
        reportData.styling.showCompanyInfo
          ? `
        <div class="company-info">
          ${
            reportData.company.address
              ? `<div class="company-info-item">📍 ${escapeHtml(
                  reportData.company.address
                )}</div>`
              : ""
          }
          ${
            reportData.company.phone
              ? `<div class="company-info-item">📞 ${escapeHtml(
                  reportData.company.phone
                )}</div>`
              : ""
          }
          ${
            reportData.company.email
              ? `<div class="company-info-item">✉️ ${escapeHtml(
                  reportData.company.email
                )}</div>`
              : ""
          }
          ${
            reportData.company.website
              ? `<div class="company-info-item">🌐 ${escapeHtml(
                  reportData.company.website
                )}</div>`
              : ""
          }
        </div>
        `
          : ""
      }
      <div class="header-footer">
        ${
          reportData.author
            ? `<div>Autor: ${escapeHtml(reportData.author)}</div>`
            : ""
        }
        <div>Data: ${formatDate(reportData.date)}</div>
      </div>
    </div>
  `;

  // HTML da descrição
  const descriptionHtml = reportData.description
    ? `
    <div class="description-box">
      <div class="description-title">Descrição do Relatório</div>
      <div class="description-text">${escapeHtml(reportData.description)}</div>
    </div>
  `
    : "";

  // HTML do resumo executivo
  const summaryHtml = `
    <div class="section-title">Resumo Executivo</div>
    <div class="evaluation-box">
      <div class="evaluation-value">${formatCurrency(
        reportData.summary.averagePrice
      )}</div>
      <div class="evaluation-label">VALOR DE AVALIAÇÃO</div>
      <div>Estimativa baseada em ${formatCurrency(
        reportData.summary.averagePricePerM2
      )}/m² (${areaLabel})</div>
    </div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${reportData.summary.totalProperties}</div>
        <div class="metric-label">Imóveis analisados</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(
          reportData.summary.averagePricePerM2
        )}</div>
        <div class="metric-label">Preço/m² médio (${areaLabel})</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${Math.round(averageAreaValue)}m²</div>
        <div class="metric-label">${areaLabel} média</div>
      </div>
    </div>
    <div class="ranges-grid">
      <div class="range-card">
        <div class="range-title">Faixa de Preços</div>
        <div>Menor: ${formatCurrency(reportData.summary.priceRange.min)}</div>
        <div>Maior: ${formatCurrency(reportData.summary.priceRange.max)}</div>
        <div style="margin-top: 8px; font-weight: 500;">
          Variação: ${formatCurrency(
            reportData.summary.priceRange.max -
              reportData.summary.priceRange.min
          )}
        </div>
      </div>
      <div class="range-card">
        <div class="range-title">Faixa de ${areaLabel}</div>
        <div>Menor: ${reportData.summary.areaRange.min}m²</div>
        <div>Maior: ${reportData.summary.areaRange.max}m²</div>
        <div style="margin-top: 8px; font-weight: 500;">
          Variação: ${
            reportData.summary.areaRange.max - reportData.summary.areaRange.min
          }m²
        </div>
      </div>
    </div>
  `;

  // HTML dos imóveis
  const propertiesHtml =
    includedProperties.length > 0
      ? `
    <div class="section-title">Detalhes dos Imóveis</div>
    ${includedProperties
      .map(
        (property) => `
      <div class="property-card avoid-break">
        <div class="property-header">
          <div class="property-title-section">
            <div class="property-title-row">
              <div class="property-title">${escapeHtml(property.title)}</div>
              <span class="property-type-chip">${escapeHtml(
                property.propertyType
              )}</span>
            </div>
            <div class="property-location">
              📍 ${escapeHtml(property.address.neighborhood)}, ${escapeHtml(
          property.address.city
        )}
            </div>
          </div>
          <div class="property-price">${formatCurrency(property.price)}</div>
        </div>
        ${
          property.description
            ? `<div style="margin-bottom: 16px; color: #666666; font-size: 14px;">${escapeHtml(
                property.description
              )}</div>`
            : ""
        }
        <div class="property-features-grid">
          <div class="property-feature">
            <div class="property-feature-label">🛏️ Quartos</div>
            <div class="property-feature-value">${property.rooms}</div>
          </div>
          <div class="property-feature">
            <div class="property-feature-label">🚿 Banheiros</div>
            <div class="property-feature-value">${property.bathrooms}</div>
          </div>
          <div class="property-feature">
            <div class="property-feature-label">🚗 Vagas</div>
            <div class="property-feature-value">${property.parking}</div>
          </div>
          <div class="property-feature">
            <div class="property-feature-label">📐 Área Útil</div>
            <div class="property-feature-value">${property.usableArea}m²</div>
          </div>
          <div class="property-feature">
            <div class="property-feature-label">📐 Área Total</div>
            <div class="property-feature-value">${property.totalArea}m²</div>
          </div>
        </div>
        <div class="property-prices-grid">
          <div class="property-price-card">
            <div class="property-price-label">Preço/m² Útil</div>
            <div class="property-price-value">${formatCurrency(
              property.pricePerM2Usable
            )}</div>
          </div>
          <div class="property-price-card">
            <div class="property-price-label">Preço/m² Total</div>
            <div class="property-price-value">${formatCurrency(
              property.pricePerM2Total
            )}</div>
          </div>
        </div>
        <div style="margin-bottom: 16px;">
          <div class="range-title">Endereço Completo</div>
          <div>${escapeHtml(
            [
              property.address.street,
              property.address.neighborhood,
              property.address.city,
              property.address.state,
              property.address.postalCode,
            ]
              .filter(Boolean)
              .join(", ")
          )}</div>
        </div>
        ${
          property.features && property.features.length > 0
            ? `
          <div style="margin-bottom: 16px;">
            <div class="range-title">Características</div>
            <div class="property-features-list">
              ${property.features
                .map(
                  (f) => `<span class="feature-chip">${escapeHtml(f)}</span>`
                )
                .join("")}
            </div>
          </div>
          `
            : ""
        }
        ${
          property.customNotes
            ? `
          <div class="property-notes">
            <div class="property-notes-title">🏢 Observações Específicas</div>
            <div class="property-notes-text">${escapeHtml(
              property.customNotes
            )}</div>
          </div>
          `
            : ""
        }
        ${
          property.images && property.images.length > 0
            ? `
          <div>
            <div class="range-title" style="margin-bottom: 8px;">Imagens</div>
            <div class="property-images">
              ${property.images
                .slice(0, 4)
                .map(
                  (img) =>
                    `<img src="${escapeHtml(img)}" alt="${escapeHtml(
                      property.title
                    )}" class="property-image" onerror="this.style.display='none'" />`
                )
                .join("")}
            </div>
          </div>
          `
            : ""
        }
      </div>
    `
      )
      .join("")}
  `
      : "";

  // HTML da análise
  const analysisHtml = reportData.styling.showAnalysis
    ? `
    <div class="section-title">Análise de Mercado</div>
    ${
      reportData.analysis.marketOverview
        ? `
      <div class="analysis-card">
        <div class="analysis-card-header">
          <span>📈</span>
          <div class="analysis-card-title">Visão Geral do Mercado</div>
        </div>
        <div class="analysis-card-content">${escapeHtml(
          reportData.analysis.marketOverview
        )}</div>
      </div>
      `
        : ""
    }
    ${
      reportData.analysis.priceAnalysis
        ? `
      <div class="analysis-card">
        <div class="analysis-card-header">
          <span>💰</span>
          <div class="analysis-card-title">Análise de Preços</div>
        </div>
        <div class="analysis-card-content">${escapeHtml(
          reportData.analysis.priceAnalysis
        )}</div>
      </div>
      `
        : ""
    }
    ${
      reportData.analysis.locationAnalysis
        ? `
      <div class="analysis-card">
        <div class="analysis-card-header">
          <span>📍</span>
          <div class="analysis-card-title">Análise de Localização</div>
        </div>
        <div class="analysis-card-content">${escapeHtml(
          reportData.analysis.locationAnalysis
        )}</div>
      </div>
      `
        : ""
    }
    ${
      reportData.analysis.recommendations
        ? `
      <div class="analysis-card analysis-recommendations">
        <div class="analysis-card-header">
          <span>💡</span>
          <div class="analysis-card-title">Recomendações</div>
        </div>
        <div class="analysis-card-content">${escapeHtml(
          reportData.analysis.recommendations
        )}</div>
      </div>
      `
        : ""
    }
    ${
      reportData.analysis.conclusion
        ? `
      <div class="analysis-card analysis-conclusion">
        <div class="analysis-card-header">
          <span>✅</span>
          <div class="analysis-card-title">Conclusão</div>
        </div>
        <div class="analysis-card-content">${escapeHtml(
          reportData.analysis.conclusion
        )}</div>
      </div>
      `
        : ""
    }
  `
    : "";

  // HTML do footer
  const footerHtml = `
    <div class="footer">
      <div class="footer-text">Relatório gerado em ${formatDate(
        new Date().toISOString()
      )}</div>
      ${
        reportData.company.name
          ? `<div class="footer-company">${escapeHtml(
              reportData.company.name
            )}</div>`
          : ""
      }
    </div>
  `;

  // HTML completo
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(
      reportData.title || "Relatório de Avaliação Imobiliária"
    )}</title>
    ${css}
  </head>
  <body>
    <div class="container">
      ${headerHtml}
      ${descriptionHtml}
      ${summaryHtml}
      ${propertiesHtml}
      ${analysisHtml}
      ${footerHtml}
    </div>
  </body>
</html>`;
}

/**
 * Gera o PDF do relatório usando window.print()
 */
export async function generatePDF(
  reportData: ReportData,
  filename?: string
): Promise<void> {
  try {
    console.log("Iniciando geração de PDF...");

    // 1. Criar nova janela para impressão
    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      throw new Error(
        "Popup bloqueado. Permita popups para gerar o relatório."
      );
    }

    // 2. Gerar conteúdo HTML completo
    const htmlContent = generatePrintableHTML(reportData);

    // 3. Escrever conteúdo na nova janela
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // 4. Aguardar carregamento básico e imprimir
    setTimeout(() => {
      // Configurar título do documento
      printWindow.document.title =
        filename ||
        `relatorio-avaliacao-${new Date().toISOString().split("T")[0]}`;

      console.log("Iniciando impressão...");

      // Disparar impressão
      printWindow.print();

      console.log("PDF aberto para impressão");
    }, 1500); // Aguarda 1.5 segundos apenas
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
}
