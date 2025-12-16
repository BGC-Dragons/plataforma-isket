import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { IPropertyAd } from "../../../services/post-property-ad-search.service";
import {
  getTotalPrice,
  getAreaValue,
  getPricePerSquareMeter,
  translatePropertyType,
  mapCalculationCriterionToAreaType,
} from "./evaluation-helpers";
import { ReportTemplate } from "./report-template";

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
 * Cria dados iniciais completos do relatório
 */
export function createInitialReportData(
  properties: IPropertyAd[],
  areaType: "USABLE" | "TOTAL" | "BUILT" = "TOTAL"
): ReportData {
  const reportProperties = initializeReportData(properties, areaType);
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
  };
}

/**
 * Gera análises iniciais automaticamente baseado nos dados dos imóveis
 */
export function generateInitialAnalysis(
  reportData: ReportData,
  areaType: "USABLE" | "TOTAL" | "BUILT" = "TOTAL"
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
  const marketOverview = `Este relatório analisa ${includedProperties.length} imóveis selecionados, com preços variando entre ${formatCurrency(reportData.summary.priceRange.min)} e ${formatCurrency(reportData.summary.priceRange.max)}.`;

  // Análise de preços
  const priceAnalysis = `O preço médio dos imóveis analisados é de ${formatCurrency(reportData.summary.averagePrice)}, com preço por metro quadrado médio de ${formatCurrency(reportData.summary.averagePricePerM2)}.`;

  // Análise de localização
  const neighborhoods = [
    ...new Set(
      includedProperties.map((p) => p.address.neighborhood).filter(Boolean)
    ),
  ];
  const locationAnalysis =
    neighborhoods.length > 0
      ? `Os imóveis estão distribuídos em ${neighborhoods.length} bairro(s): ${neighborhoods.join(", ")}.`
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
 * Converte cor hex para RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 38, g: 35, b: 83 };
}

/**
 * Gera o PDF do relatório renderizando o componente React
 */
export async function generatePDF(
  reportData: ReportData,
  filename: string
): Promise<void> {
  // Criar tema MUI padrão
  const theme = createTheme();

  // Criar elemento temporário para renderizar o componente
  const tempDiv = document.createElement("div");
  tempDiv.id = "pdf-export-temp";
  tempDiv.style.position = "fixed";
  tempDiv.style.left = "0";
  tempDiv.style.top = "0";
  tempDiv.style.width = "896px";
  tempDiv.style.minHeight = "100px";
  tempDiv.style.backgroundColor = "#ffffff";
  tempDiv.style.zIndex = "99999";
  tempDiv.style.overflow = "visible";
  tempDiv.style.pointerEvents = "none";
  document.body.appendChild(tempDiv);

  let root: Root | null = null;

  try {
    // Renderizar o componente React com ThemeProvider
    root = createRoot(tempDiv);
    root.render(
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(ReportTemplate, { reportData })
      )
    );

    // Aguardar renderização usando requestAnimationFrame para garantir que o DOM foi atualizado
    const waitForRender = async (maxAttempts = 20) => {
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        
        // Verificar se há conteúdo renderizado
        const hasContent = tempDiv.children.length > 0 || tempDiv.querySelector("div") !== null;
        if (hasContent) {
          // Verificar se o elemento tem dimensões válidas
          const firstChild = tempDiv.firstElementChild as HTMLElement;
          const elementToCheck = firstChild || tempDiv;
          const hasDimensions = 
            (elementToCheck.scrollHeight > 0 || elementToCheck.offsetHeight > 0) &&
            (elementToCheck.scrollWidth > 0 || elementToCheck.offsetWidth > 0);
          
          if (hasDimensions) {
            console.log(`Renderização confirmada após ${i + 1} tentativas`);
            return true;
          }
        }
        
        // Aguardar um pouco entre tentativas
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return false;
    };

    const isRendered = await waitForRender();
    if (!isRendered) {
      console.error("Elemento temporário:", tempDiv);
      console.error("HTML:", tempDiv.innerHTML);
      console.error("Children:", tempDiv.children.length);
      throw new Error("Componente não foi renderizado corretamente após múltiplas tentativas");
    }

    // Aguardar todas as imagens carregarem
    const images = tempDiv.querySelectorAll("img");
    if (images.length > 0) {
      console.log(`Aguardando carregamento de ${images.length} imagem(ns)...`);
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalHeight > 0) {
                resolve();
              } else {
                const timeout = setTimeout(() => {
                  console.warn("Timeout ao carregar imagem:", img.src);
                  resolve();
                }, 5000); // Timeout de 5s
                img.onload = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                img.onerror = () => {
                  clearTimeout(timeout);
                  console.warn("Erro ao carregar imagem:", img.src);
                  resolve(); // Continuar mesmo se a imagem falhar
                };
              }
            })
        )
      );
      console.log("Todas as imagens processadas");
    }

    // Aguardar mais um pouco para garantir que tudo está estável
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Determinar o elemento correto para capturar
    // O React 18 com createRoot renderiza diretamente no elemento, então usamos tempDiv
    // Mas verificamos se há um primeiro filho com conteúdo significativo
    let elementToCapture: HTMLElement = tempDiv;
    
    if (tempDiv.firstElementChild) {
      const firstChild = tempDiv.firstElementChild as HTMLElement;
      // Se o primeiro filho tem dimensões significativas, usamos ele
      if (firstChild.scrollHeight > 100 || firstChild.offsetHeight > 100) {
        elementToCapture = firstChild;
        console.log("Usando firstElementChild para captura");
      } else {
        console.log("Usando tempDiv para captura (firstElementChild muito pequeno)");
      }
    } else {
      console.log("Usando tempDiv para captura (sem firstElementChild)");
    }
    
    // Verificar dimensões finais
    const elementWidth = elementToCapture.scrollWidth || elementToCapture.offsetWidth || 896;
    const elementHeight = elementToCapture.scrollHeight || elementToCapture.offsetHeight || 1000;
    
    if (elementWidth === 0 || elementHeight === 0) {
      throw new Error(`Elemento tem dimensões inválidas: ${elementWidth}x${elementHeight}`);
    }
    
    console.log("Capturando elemento:", {
      element: elementToCapture.tagName,
      width: elementWidth,
      height: elementHeight,
      scrollWidth: elementToCapture.scrollWidth,
      scrollHeight: elementToCapture.scrollHeight,
      offsetWidth: elementToCapture.offsetWidth,
      offsetHeight: elementToCapture.offsetHeight,
    });

    // Capturar o elemento com html2canvas
    const canvas = await html2canvas(elementToCapture, {
      scale: 2, // Maior qualidade
      useCORS: true,
      logging: false, // Desabilitar logs em produção (pode ser true para debug)
      backgroundColor: "#ffffff",
      width: elementWidth,
      height: elementHeight,
      windowWidth: elementWidth,
      windowHeight: elementHeight,
      allowTaint: true,
      removeContainer: false,
      onclone: (clonedDoc) => {
        // Garantir que o elemento clonado tenha as mesmas dimensões
        const clonedElement = clonedDoc.getElementById("pdf-export-temp");
        if (clonedElement) {
          (clonedElement as HTMLElement).style.width = `${elementWidth}px`;
          (clonedElement as HTMLElement).style.height = `${elementHeight}px`;
        }
      },
    });
    
    console.log("Canvas gerado:", {
      width: canvas.width,
      height: canvas.height,
    });

    // Verificar se o canvas tem conteúdo
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas está vazio");
    }

    // Converter canvas para PDF
    const imgData = canvas.toDataURL("image/png", 1.0);
    
    // Verificar se a imagem foi gerada
    if (!imgData || imgData === "data:,") {
      throw new Error("Falha ao gerar imagem do canvas");
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Converter pixels do canvas para mm
    // html2canvas com scale: 2 significa que cada pixel CSS = 2 pixels no canvas
    // 1 pixel CSS a 96 DPI = 0.264583 mm
    // Então: canvas pixels / 2 * 0.264583 = mm
    const pxToMm = 0.264583;
    const imgWidthMm = (canvas.width / 2) * pxToMm;
    const imgHeightMm = (canvas.height / 2) * pxToMm;
    
    // Calcular escala para caber na largura da página A4 (mantendo proporção)
    const scale = pdfWidth / imgWidthMm;
    const scaledWidth = pdfWidth;
    const scaledHeight = imgHeightMm * scale;

    // Adicionar primeira página
    pdf.addImage(imgData, "PNG", 0, 0, scaledWidth, scaledHeight, undefined, "FAST");
    
    // Adicionar páginas adicionais se necessário
    let heightLeft = scaledHeight - pdfHeight;
    while (heightLeft > 0) {
      pdf.addPage();
      const yPosition = -(scaledHeight - heightLeft);
      pdf.addImage(
        imgData,
        "PNG",
        0,
        yPosition,
        scaledWidth,
        scaledHeight,
        undefined,
        "FAST"
      );
      heightLeft -= pdfHeight;
    }

    // Salvar o PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    // Mostrar erro mais detalhado
    if (error instanceof Error) {
      console.error("Detalhes do erro:", error.message);
      console.error("Stack:", error.stack);
    }
    throw error;
  } finally {
    // Limpar
    if (root) {
      root.unmount();
    }
    if (tempDiv.parentNode) {
      document.body.removeChild(tempDiv);
    }
  }
}

/**
 * Gera o PDF do relatório (versão antiga - mantida para compatibilidade)
 * @deprecated Use a nova versão assíncrona que renderiza o componente React
 */
function generatePDFLegacy(reportData: ReportData, filename: string): void {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Cores personalizadas
  const primaryRgb = hexToRgb(reportData.styling.primaryColor);
  const secondaryRgb = hexToRgb(reportData.styling.secondaryColor);

  // Função auxiliar para verificar se precisa de nova página
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header com logo
  let logoX = margin;
  if (reportData.company.logo && reportData.styling.logoPosition === "left") {
    try {
      // Tentar adicionar logo (pode falhar se URL não for acessível)
      // Por limitações do jsPDF, vamos apenas reservar espaço
      logoX = margin + 50;
    } catch (e) {
      // Logo não pôde ser carregado, continuar sem ele
    }
  }

  // Título e subtítulo
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text(
    reportData.title || "Relatório de Avaliação Imobiliária",
    logoX,
    yPosition,
    { maxWidth: contentWidth - (logoX - margin) }
  );
  yPosition += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(
    reportData.subtitle || "Análise Comparativa de Mercado",
    logoX,
    yPosition,
    { maxWidth: contentWidth - (logoX - margin) }
  );
  yPosition += 10;

  // Informações da empresa (se habilitado)
  if (reportData.styling.showCompanyInfo) {
    const companyInfo: string[] = [];
    if (reportData.company.address) {
      companyInfo.push(`Endereço: ${reportData.company.address}`);
    }
    if (reportData.company.phone) {
      companyInfo.push(`Telefone: ${reportData.company.phone}`);
    }
    if (reportData.company.email) {
      companyInfo.push(`E-mail: ${reportData.company.email}`);
    }
    if (reportData.company.website) {
      companyInfo.push(`Website: ${reportData.company.website}`);
    }

    if (companyInfo.length > 0) {
      doc.setFontSize(9);
      companyInfo.forEach((info) => {
        doc.text(info, margin, yPosition, { maxWidth: contentWidth });
        yPosition += 4;
      });
      yPosition += 5;
    }
  }

  // Autor e Data
  doc.setFontSize(10);
  const authorText = reportData.author
    ? `Autor: ${reportData.author}`
    : "Autor: Não informado";
  const dateText = `Data: ${formatDate(reportData.date)}`;
  doc.text(authorText, margin, yPosition);
  doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText), yPosition);
  yPosition += 10;

  // Linha divisória
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Descrição
  if (reportData.description) {
    checkNewPage(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Descrição do Relatório", margin, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const descriptionLines = doc.splitTextToSize(
      reportData.description,
      contentWidth
    );
    descriptionLines.forEach((line: string) => {
      checkNewPage(5);
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Resumo Executivo
  checkNewPage(60);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Executivo", margin, yPosition);
  yPosition += 10;

  // Box de valor de avaliação
  checkNewPage(35);
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.roundedRect(margin, yPosition, contentWidth, 30, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(
    formatCurrency(reportData.summary.averagePrice),
    pageWidth / 2,
    yPosition + 12,
    { align: "center" }
  );
  doc.setFontSize(12);
  doc.text("VALOR DE AVALIAÇÃO", pageWidth / 2, yPosition + 20, {
    align: "center",
  });
  doc.setFontSize(10);
  const areaTypeLabel =
    reportData.summary.averagePricePerM2 > 0
      ? `Estimativa baseada em ${formatCurrency(reportData.summary.averagePricePerM2)}/m²`
      : "Estimativa baseada em área";
  doc.text(areaTypeLabel, pageWidth / 2, yPosition + 26, { align: "center" });
  yPosition += 40;

  doc.setTextColor(0, 0, 0);

  // Métricas
  checkNewPage(20);
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
      label: "Área útil média",
      value: `${Math.round(reportData.summary.averageUsableArea)}m²`,
    },
  ];

  doc.setFontSize(10);
  const metricWidth = contentWidth / 3;
  metrics.forEach((metric, index) => {
    const x = margin + index * metricWidth;
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x + metricWidth / 2, yPosition, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    const labelLines = doc.splitTextToSize(metric.label, metricWidth - 10);
    labelLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, x + metricWidth / 2, yPosition + 5 + lineIndex * 4, {
        align: "center",
      });
    });
  });
  yPosition += 15;

  // Faixas de valores
  checkNewPage(25);
  const rangeWidth = contentWidth / 2;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Faixa de Preços", margin, yPosition);
  doc.text("Faixa de Área Útil", margin + rangeWidth, yPosition);
  yPosition += 5;
  doc.setFont("helvetica", "normal");
  doc.text(
    `Menor: ${formatCurrency(reportData.summary.priceRange.min)}`,
    margin,
    yPosition
  );
  doc.text(
    `Menor: ${reportData.summary.areaRange.min}m²`,
    margin + rangeWidth,
    yPosition
  );
  yPosition += 4;
  doc.text(
    `Maior: ${formatCurrency(reportData.summary.priceRange.max)}`,
    margin,
    yPosition
  );
  doc.text(
    `Maior: ${reportData.summary.areaRange.max}m²`,
    margin + rangeWidth,
    yPosition
  );
  yPosition += 10;

  // Detalhes dos Imóveis
  const includedProperties = reportData.properties.filter(
    (p) => p.includeInReport
  );

  if (includedProperties.length > 0) {
    checkNewPage(20);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhes dos Imóveis", margin, yPosition);
    yPosition += 10;

    includedProperties.forEach((prop, index) => {
      checkNewPage(80);
      if (index > 0) {
        yPosition += 5;
      }

      // Título do imóvel
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(prop.title.substring(0, 50), margin, yPosition);
      yPosition += 6;

      // Tipo e localização
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${prop.propertyType} - ${prop.address.neighborhood}, ${prop.address.city}`,
        margin,
        yPosition
      );
      yPosition += 6;

      // Preço
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text(formatCurrency(prop.price), margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 8;

      // Características
      doc.setFontSize(9);
      const characteristics = [
        `Quartos: ${prop.rooms}`,
        `Banheiros: ${prop.bathrooms}`,
        `Vagas: ${prop.parking}`,
        `Área Útil: ${prop.usableArea}m²`,
        `Área Total: ${prop.totalArea}m²`,
        `Preço/m² Útil: ${formatCurrency(prop.pricePerM2Usable)}`,
        `Preço/m² Total: ${formatCurrency(prop.pricePerM2Total)}`,
      ];
      characteristics.forEach((char) => {
        doc.text(char, margin, yPosition);
        yPosition += 4;
      });
      yPosition += 3;

      // Endereço completo
      const fullAddress = [
        prop.address.street,
        prop.address.neighborhood,
        prop.address.city,
        prop.address.state,
        prop.address.postalCode,
      ]
        .filter(Boolean)
        .join(", ");
      if (fullAddress) {
        doc.text(`Endereço: ${fullAddress}`, margin, yPosition, {
          maxWidth: contentWidth,
        });
        yPosition += 5;
      }

      // Características adicionais
      if (prop.features && prop.features.length > 0) {
        doc.text(
          `Características: ${prop.features.join(", ")}`,
          margin,
          yPosition,
          { maxWidth: contentWidth }
        );
        yPosition += 5;
      }

      // Observações
      if (prop.customNotes) {
        doc.setFont("helvetica", "italic");
        const notesLines = doc.splitTextToSize(prop.customNotes, contentWidth);
        notesLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 4;
        });
        doc.setFont("helvetica", "normal");
        yPosition += 3;
      }
    });
  }

  // Análise de Mercado
  if (reportData.styling.showAnalysis) {
    checkNewPage(30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Análise de Mercado", margin, yPosition);
    yPosition += 10;

    const analysisSections = [
      {
        title: "Visão Geral do Mercado",
        content: reportData.analysis.marketOverview,
      },
      {
        title: "Análise de Preços",
        content: reportData.analysis.priceAnalysis,
      },
      {
        title: "Análise de Localização",
        content: reportData.analysis.locationAnalysis,
      },
    ];

    analysisSections.forEach((section) => {
      if (section.content) {
        checkNewPage(20);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(section.title, margin, yPosition);
        yPosition += 6;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(section.content, contentWidth);
        lines.forEach((line: string) => {
          checkNewPage(5);
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }
    });

    // Recomendações
    if (reportData.analysis.recommendations) {
      checkNewPage(20);
      doc.setFillColor(232, 245, 233); // Verde claro
      doc.roundedRect(margin, yPosition, contentWidth, 0, 3, 3, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Recomendações", margin + 5, yPosition + 6);
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(
        reportData.analysis.recommendations,
        contentWidth - 10
      );
      lines.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Conclusão
    if (reportData.analysis.conclusion) {
      checkNewPage(20);
      doc.setFillColor(227, 242, 253); // Azul claro
      doc.roundedRect(margin, yPosition, contentWidth, 0, 3, 3, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Conclusão", margin + 5, yPosition + 6);
      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(
        reportData.analysis.conclusion,
        contentWidth - 10
      );
      lines.forEach((line: string) => {
        checkNewPage(5);
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Relatório gerado em ${formatDate(new Date().toISOString())}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
    if (reportData.company.name) {
      doc.text(
        reportData.company.name,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );
    }
  }

  // Salva o PDF
  doc.save(filename);
}

