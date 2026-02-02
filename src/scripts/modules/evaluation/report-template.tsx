import { Box, Typography, Paper, Chip, useTheme } from "@mui/material";
import {
  LocationOn,
  Phone,
  Email,
  Language,
  Bed,
  Bathtub,
  DirectionsCar,
  SquareFoot,
  Business,
  TrendingUp,
  AttachMoney,
  Lightbulb,
  CheckCircle,
} from "@mui/icons-material";
import type { ReportData } from "./report-generator";
import { formatCurrency, formatDate } from "./report-generator";

interface ReportTemplateProps {
  reportData: ReportData;
}

export function ReportTemplate({ reportData }: ReportTemplateProps) {
  const theme = useTheme();
  const includedProperties = reportData.properties.filter(
    (p) => p.includeInReport
  );

  const fontFamily = reportData.styling.fontFamily;
  const areaType = reportData.areaType ?? "TOTAL";
  const isUsableArea = areaType === "USABLE";
  const areaLabel = isUsableArea ? "Área Útil" : "Área Total";
  const averageAreaValue = isUsableArea
    ? reportData.summary.averageUsableArea
    : reportData.summary.averageTotalArea;

  return (
    <Box
      sx={{
        maxWidth: "896px",
        width: "100%",
        backgroundColor: "#ffffff",
        fontFamily,
        color: "#000000",
        p: 4,
        boxShadow: theme.shadows[4],
        "& *, & *::before, & *::after": {
          fontFamily: "inherit",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          borderBottom: `3px solid ${reportData.styling.primaryColor}`,
          pb: 3,
          mb: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              reportData.styling.logoPosition === "center"
                ? "center"
                : "space-between",
            flexDirection:
              reportData.styling.logoPosition === "center" ? "column" : "row",
            gap: 2,
            mb: 2,
          }}
        >
          {reportData.styling.logoPosition !== "right" &&
            reportData.company.logo && (
              <Box
                component="img"
                src={reportData.company.logo}
                alt={reportData.company.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                sx={{
                  height: 64,
                  maxWidth: 200,
                  objectFit: "contain",
                }}
              />
            )}

          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: reportData.styling.primaryColor,
                mb: 1,
              }}
            >
              {reportData.title || "Relatório de Avaliação Imobiliária"}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 400,
              }}
            >
              {reportData.subtitle || "Análise Comparativa de Mercado"}
            </Typography>
          </Box>

          {reportData.styling.logoPosition === "right" &&
            reportData.company.logo && (
              <Box
                component="img"
                src={reportData.company.logo}
                alt={reportData.company.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                sx={{
                  height: 64,
                  maxWidth: 200,
                  objectFit: "contain",
                }}
              />
            )}
        </Box>

        {/* Informações da empresa */}
        {reportData.styling.showCompanyInfo && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${reportData.styling.secondaryColor}`,
            }}
          >
            {reportData.company.address && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationOn
                  sx={{ fontSize: 16, color: reportData.styling.primaryColor }}
                />
                <Typography variant="body2">
                  {reportData.company.address}
                </Typography>
              </Box>
            )}
            {reportData.company.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Phone
                  sx={{ fontSize: 16, color: reportData.styling.primaryColor }}
                />
                <Typography variant="body2">
                  {reportData.company.phone}
                </Typography>
              </Box>
            )}
            {reportData.company.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Email
                  sx={{ fontSize: 16, color: reportData.styling.primaryColor }}
                />
                <Typography variant="body2">
                  {reportData.company.email}
                </Typography>
              </Box>
            )}
            {reportData.company.website && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Language
                  sx={{ fontSize: 16, color: reportData.styling.primaryColor }}
                />
                <Typography variant="body2">
                  {reportData.company.website}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Autor e Data */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${reportData.styling.secondaryColor}`,
          }}
        >
          {reportData.author && (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Autor: {reportData.author}
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Data: {formatDate(reportData.date)}
          </Typography>
        </Box>
      </Box>

      {/* Descrição */}
      {reportData.description && (
        <Paper
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: theme.palette.grey[50],
            borderLeft: `4px solid ${reportData.styling.primaryColor}`,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Descrição do Relatório
          </Typography>
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
          >
            {reportData.description}
          </Typography>
        </Paper>
      )}

      {/* Resumo Executivo */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          Resumo Executivo
        </Typography>

        {/* Box de valor de avaliação */}
        <Paper
          sx={{
            p: 4,
            mb: 3,
            backgroundColor: reportData.styling.primaryColor,
            color: "#ffffff",
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {formatCurrency(reportData.summary.averagePrice)}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            VALOR DE AVALIAÇÃO
          </Typography>
          <Typography variant="body1">
            Estimativa baseada em{" "}
            {formatCurrency(reportData.summary.averagePricePerM2)}/m² (
            {areaLabel})
          </Typography>
        </Paper>

        {/* Grid de métricas */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            mb: 3,
          }}
        >
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {reportData.summary.totalProperties}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Imóveis analisados
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {formatCurrency(reportData.summary.averagePricePerM2)}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Preço/m² médio ({areaLabel})
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {Math.round(averageAreaValue)}m²
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {areaLabel} média
            </Typography>
          </Paper>
        </Box>

        {/* Faixas de valores */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Faixa de Preços
            </Typography>
            <Typography variant="body2">
              Menor: {formatCurrency(reportData.summary.priceRange.min)}
            </Typography>
            <Typography variant="body2">
              Maior: {formatCurrency(reportData.summary.priceRange.max)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              Variação:{" "}
              {reportData.summary.priceRange.max -
                reportData.summary.priceRange.min >
              0
                ? formatCurrency(
                    reportData.summary.priceRange.max -
                      reportData.summary.priceRange.min
                  )
                : "R$ 0,00"}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Faixa de {areaLabel}
            </Typography>
            <Typography variant="body2">
              Menor: {reportData.summary.areaRange.min}m²
            </Typography>
            <Typography variant="body2">
              Maior: {reportData.summary.areaRange.max}m²
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              Variação:{" "}
              {reportData.summary.areaRange.max -
                reportData.summary.areaRange.min}
              m²
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Detalhes dos Imóveis */}
      {includedProperties.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Detalhes dos Imóveis
          </Typography>

          {includedProperties.map((property) => (
            <Paper
              key={property.id}
              sx={{
                p: 3,
                mb: 3,
                border: `1px solid ${reportData.styling.secondaryColor}`,
                borderRadius: 2,
              }}
            >
              {/* Header do imóvel */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {property.title}
                    </Typography>
                    <Chip
                      label={property.propertyType}
                      size="small"
                      sx={{
                        backgroundColor: reportData.styling.primaryColor,
                        color: "#ffffff",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "text.secondary",
                    }}
                  >
                    <LocationOn sx={{ fontSize: 16 }} />
                    <Typography variant="body2">
                      {property.address.neighborhood}, {property.address.city}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: reportData.styling.primaryColor,
                  }}
                >
                  {formatCurrency(property.price)}
                </Typography>
              </Box>

              {/* Descrição */}
              {property.description && (
                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: "text.secondary" }}
                >
                  {property.description}
                </Typography>
              )}

              {/* Grid de características */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 2,
                  mb: 2,
                  p: 2,
                  backgroundColor: theme.palette.grey[50],
                  borderRadius: 1,
                }}
              >
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                    }}
                  >
                    <Bed
                      sx={{
                        fontSize: 16,
                        color: reportData.styling.primaryColor,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Quartos
                    </Typography>
                  </Box>
                  <Typography variant="h6">{property.rooms}</Typography>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                    }}
                  >
                    <Bathtub
                      sx={{
                        fontSize: 16,
                        color: reportData.styling.primaryColor,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Banheiros
                    </Typography>
                  </Box>
                  <Typography variant="h6">{property.bathrooms}</Typography>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                    }}
                  >
                    <DirectionsCar
                      sx={{
                        fontSize: 16,
                        color: reportData.styling.primaryColor,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Vagas
                    </Typography>
                  </Box>
                  <Typography variant="h6">{property.parking}</Typography>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                    }}
                  >
                    <SquareFoot
                      sx={{
                        fontSize: 16,
                        color: reportData.styling.primaryColor,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Área Útil
                    </Typography>
                  </Box>
                  <Typography variant="h6">{property.usableArea}m²</Typography>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.5,
                    }}
                  >
                    <SquareFoot
                      sx={{
                        fontSize: 16,
                        color: reportData.styling.primaryColor,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Área Total
                    </Typography>
                  </Box>
                  <Typography variant="h6">{property.totalArea}m²</Typography>
                </Box>
              </Box>

              {/* Preços por m² */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, color: "text.secondary" }}
                  >
                    Preço/m² Útil
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(property.pricePerM2Usable)}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, color: "text.secondary" }}
                  >
                    Preço/m² Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {formatCurrency(property.pricePerM2Total)}
                  </Typography>
                </Paper>
              </Box>

              {/* Endereço completo */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Endereço Completo
                </Typography>
                <Typography variant="body2">
                  {property.address.street}
                  {property.address.neighborhood &&
                    `, ${property.address.neighborhood}`}
                  {property.address.city && `, ${property.address.city}`}
                  {property.address.state && ` - ${property.address.state}`}
                  {property.address.postalCode &&
                    `, CEP: ${property.address.postalCode}`}
                </Typography>
              </Box>

              {/* Características */}
              {property.features && property.features.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Características
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {property.features.map((feature, idx) => (
                      <Chip
                        key={idx}
                        label={feature}
                        size="small"
                        sx={{
                          backgroundColor: reportData.styling.secondaryColor,
                          border: `1px solid ${reportData.styling.primaryColor}`,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Observações personalizadas */}
              {property.customNotes && (
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "#e3f2fd",
                    borderLeft: `4px solid ${reportData.styling.primaryColor}`,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Business
                      sx={{
                        fontSize: 16,
                        color: reportData.styling.primaryColor,
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Observações Específicas
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
                  >
                    {property.customNotes}
                  </Typography>
                </Paper>
              )}

              {/* Imagens */}
              {property.images && property.images.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Imagens
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 1,
                    }}
                  >
                    {property.images.slice(0, 4).map((image, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={image}
                        alt={`${property.title} - Imagem ${idx + 1}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                        sx={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: `1px solid ${reportData.styling.secondaryColor}`,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      {/* Análise de Mercado */}
      {reportData.styling.showAnalysis && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Análise de Mercado
          </Typography>

          {/* Visão Geral */}
          {reportData.analysis.marketOverview && (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <TrendingUp
                  sx={{ fontSize: 24, color: reportData.styling.primaryColor }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Visão Geral do Mercado
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
              >
                {reportData.analysis.marketOverview}
              </Typography>
            </Paper>
          )}

          {/* Análise de Preços */}
          {reportData.analysis.priceAnalysis && (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <AttachMoney
                  sx={{ fontSize: 24, color: reportData.styling.primaryColor }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Análise de Preços
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
              >
                {reportData.analysis.priceAnalysis}
              </Typography>
            </Paper>
          )}

          {/* Análise de Localização */}
          {reportData.analysis.locationAnalysis && (
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <LocationOn
                  sx={{ fontSize: 24, color: reportData.styling.primaryColor }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Análise de Localização
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
              >
                {reportData.analysis.locationAnalysis}
              </Typography>
            </Paper>
          )}

          {/* Recomendações */}
          {reportData.analysis.recommendations && (
            <Paper
              sx={{
                p: 3,
                mb: 2,
                backgroundColor: "#e8f5e9",
                borderLeft: `4px solid #4caf50`,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Lightbulb sx={{ fontSize: 24, color: "#4caf50" }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recomendações
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
              >
                {reportData.analysis.recommendations}
              </Typography>
            </Paper>
          )}

          {/* Conclusão */}
          {reportData.analysis.conclusion && (
            <Paper
              sx={{
                p: 3,
                backgroundColor: "#e3f2fd",
                borderLeft: `4px solid ${reportData.styling.primaryColor}`,
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <CheckCircle
                  sx={{ fontSize: 24, color: reportData.styling.primaryColor }}
                />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Conclusão
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-line", lineHeight: 1.8 }}
              >
                {reportData.analysis.conclusion}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Footer */}
      <Box
        sx={{
          mt: 4,
          pt: 3,
          borderTop: `2px solid ${reportData.styling.secondaryColor}`,
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Relatório gerado em {formatDate(new Date().toISOString())}
        </Typography>
        {reportData.company.name && (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {reportData.company.name}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
