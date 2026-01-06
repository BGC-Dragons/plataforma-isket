import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  useTheme,
  Drawer,
} from "@mui/material";
import { ArrowBack, PhotoLibrary, Share, Business } from "@mui/icons-material";
import { PropertyGallery } from "./property-gallery";
import { PropertyInformation } from "./property-information";
import { PropertyLocalization } from "./property-localization";
import { FullscreenGallery } from "./fullscreen-gallery";
import { getPropertyAdView } from "../../../../services/get-property-ad-view.service";
import {
  mapApiToPropertyDetails,
  type IPropertyDetailsData,
} from "../../../../services/helpers/map-api-to-property-details.helper";
import { useAuth } from "../../access-manager/auth.hook";
import type { IPropertyAd } from "../../../../services/post-property-ad-search.service";
import { mapApiPropertyTypeToModalType } from "../../../../services/helpers/map-api-property-type-to-modal.helper";

// Reexportar a interface do helper
type PropertyDetailsData = IPropertyDetailsData;

interface PropertyDetailsProps {
  open: boolean;
  onClose: () => void;
  propertyId?: string;
}

export function PropertyDetails({
  open,
  onClose,
  propertyId,
}: PropertyDetailsProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = useAuth();
  const [property, setProperty] = useState<PropertyDetailsData | null>(null);
  const [propertyRaw, setPropertyRaw] = useState<IPropertyAd | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluationEmails, setEvaluationEmails] = useState<string[]>([]);
  const [evaluationCredits] = useState(3); // Mock - virá da API
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // TODO: Integrar com API para buscar créditos de avaliação do perfil
  // useEffect(() => {
  //   // Buscar créditos do usuário logado
  //   // getEvaluationCredits().then(setEvaluationCredits);
  // }, []);

  // Carregar dados da propriedade
  useEffect(() => {
    if (propertyId && open) {
      setLoading(true);
      setError(null);
      setProperty(null);
      setPropertyRaw(null);

      const fetchPropertyDetails = async () => {
        try {
          // Preparar headers opcionais para log (se usuário estiver logado)
          // Nota: accountId não está disponível diretamente no auth.store.user
          // Se necessário, pode ser obtido via getAuthMe, mas por enquanto não é enviado
          const headers = {
            ref: window.location.href,
            userId: auth.store.user?.id,
            // accountId não está disponível no IAuthUser, deixar como undefined
          };

          // Buscar anúncio da API
          const response = await getPropertyAdView(
            propertyId,
            auth.store.token as string | undefined,
            headers
          );

          // O primeiro elemento é o anúncio solicitado
          if (response.data && response.data.length > 0) {
            const propertyAd = response.data[0];
            const propertyData = mapApiToPropertyDetails(propertyAd);
            setProperty(propertyData);
            setPropertyRaw(propertyAd); // Armazenar dados brutos da API
          } else {
            setError("Propriedade não encontrada");
          }
        } catch (err) {
          console.error("Erro ao buscar detalhes da propriedade:", err);
          setError("Erro ao carregar propriedade. Tente novamente.");
        } finally {
          setLoading(false);
        }
      };

      fetchPropertyDetails();
    }
  }, [propertyId, open, auth.store.user?.id, auth.store.token]);

  // Função para voltar
  const handleBack = () => {
    navigate("/pesquisar-anuncios");
    onClose();
  };

  // Função para mostrar todas as fotos
  const handleShowAllPhotos = () => {
    if (property && property.images.length > 0) {
      setGalleryInitialIndex(0);
      setGalleryOpen(true);
    }
  };

  // Função para compartilhar
  const handleShare = () => {
    console.log("Compartilhando propriedade:", propertyId);
    const shareUrl = `${window.location.origin}/pesquisar-anuncios/${propertyId}`;

    if (navigator.share) {
      navigator.share({
        title: property?.title || "Propriedade",
        text: `Confira este imóvel: ${property?.title || "Propriedade"}`,
        url: shareUrl,
      });
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Mostrar notificação de sucesso (opcional)
        console.log("Link copiado para a área de transferência:", shareUrl);
      });
    }
  };

  // Função para clicar na imobiliária
  const handleRealEstateClick = () => {
    if (property?.url) {
      window.open(property.url, "_blank", "noopener,noreferrer");
    }
  };

  // Função para clicar em uma imagem
  const handleImageClick = (index: number) => {
    if (property && property.images.length > 0) {
      setGalleryInitialIndex(index);
      setGalleryOpen(true);
    }
  };

  // Função para nova captação
  const handleNewCapture = () => {
    if (!property || !propertyRaw) {
      console.error("Dados da propriedade não disponíveis");
      return;
    }

    // Extrair endereço
    let address = propertyRaw.formattedAddress || property.address || "";
    let number = "";
    const complement = propertyRaw.address?.complement || "";

    // Extrair número do endereço
    if (propertyRaw.address?.streetNumber) {
      number = propertyRaw.address.streetNumber;
      // Se o endereço contém o número, remover do endereço
      if (address && address.includes(number)) {
        // Tentar remover o número do endereço para manter apenas a rua
        address = address
          .replace(new RegExp(`,\\s*${number}`, "g"), "")
          .replace(new RegExp(`\\s+${number}`, "g"), "")
          .trim();
      }
    } else if (address) {
      // Tentar extrair número do formattedAddress
      const numberMatch = address.match(/(\d+)/);
      if (numberMatch) {
        number = numberMatch[1];
        // Remover número do endereço
        address = address.replace(/\d+.*/, "").replace(/,\s*$/, "").trim();
      }
    }

    // Se não tiver endereço separado, usar o formattedAddress completo
    if (!address && propertyRaw.formattedAddress) {
      address = propertyRaw.formattedAddress;
    }

    // Mapear tipo de imóvel da API para o formato do modal
    const propertyType = mapApiPropertyTypeToModalType(
      propertyRaw.propertyType || ""
    );

    // Preparar dados para navegação
    const propertyData = {
      address: address,
      number: number,
      complement: complement,
      propertyType: propertyType,
      title: property.title || address || "Nova Captação",
      formattedAddress: propertyRaw.formattedAddress || address,
    };

    // Navegar para a página de captação com os dados
    navigate("/captacao", { state: { propertyData } });
  };

  // Função para enviar avaliação
  const handleSendEvaluation = () => {
    console.log(
      "Enviando avaliação para:",
      evaluationEmails.length > 0
        ? evaluationEmails.join(", ")
        : "email próprio"
    );
    console.log("Propriedade:", propertyId);
    // Implementar envio de avaliação
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: "80%", md: "70%", lg: "60%" },
          maxWidth: "1200px",
          backgroundColor: theme.palette.background.default,
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Header com botão voltar e ações */}
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {/* Botão Voltar */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                mr: 2,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                flex: 1,
                fontSize: "1.5rem",
              }}
            >
              {property?.title || "Carregando..."}
            </Typography>
          </Box>

          {/* Botões de Ação */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="contained"
              startIcon={<PhotoLibrary />}
              onClick={handleShowAllPhotos}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                borderRadius: 1.5,
                px: 2,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.8rem",
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
                // Apenas para telas menores que 750px
                "@media (max-width: 750px)": {
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.7rem",
                  minWidth: "auto",
                },
              }}
            >
              Mostrar todas as fotos
            </Button>
            <Button
              variant="contained"
              startIcon={<Share />}
              onClick={handleShare}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                borderRadius: 1.5,
                px: 2,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.8rem",
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
                // Apenas para telas menores que 750px
                "@media (max-width: 750px)": {
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.7rem",
                  minWidth: "auto",
                },
              }}
            >
              Compartilhar
            </Button>
            <Button
              variant="contained"
              startIcon={<Business />}
              onClick={handleRealEstateClick}
              disabled={!property?.url || property.url?.trim() === ""}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                borderRadius: 1.5,
                px: 2,
                py: 1,
                fontWeight: 500,
                textTransform: "none",
                fontSize: "0.8rem",
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
                "&:disabled": {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
                // Apenas para telas menores que 750px
                "@media (max-width: 750px)": {
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.7rem",
                  minWidth: "auto",
                },
              }}
            >
              {property?.realEstateName || "Imobiliária"}
            </Button>
          </Stack>
        </Box>

        {/* Conteúdo Principal */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 3,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: theme.palette.grey[200],
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.grey[400],
              borderRadius: 3,
              "&:hover": {
                backgroundColor: theme.palette.grey[600],
              },
            },
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Carregando propriedade...
              </Typography>
            </Box>
          ) : error ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "50vh",
                textAlign: "center",
              }}
            >
              <Typography variant="h5" color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Não foi possível carregar os detalhes da propriedade.
              </Typography>
              <Button
                variant="contained"
                onClick={handleBack}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Voltar
              </Button>
            </Box>
          ) : property ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                pb: { xs: 10, sm: 0 },
              }}
            >
              {/* Galeria de Fotos */}
              <PropertyGallery
                images={property.images}
                propertyTitle={property.title}
                onImageClick={handleImageClick}
              />

              {/* Informações da Propriedade */}
              <PropertyInformation
                status={property.status}
                price={property.price}
                pricePerSquareMeter={property.pricePerSquareMeter}
                address={property.address}
                city={property.city}
                state={property.state}
                totalArea={property.totalArea}
                usableArea={property.usableArea}
                characteristics={property.characteristics}
                description={property.description}
                evaluationEmails={evaluationEmails}
                evaluationCredits={evaluationCredits}
                onEvaluationEmailsChange={setEvaluationEmails}
                onNewCapture={handleNewCapture}
                onSendEvaluation={handleSendEvaluation}
              />

              {/* Seção de Localização */}
              <Box
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 3,
                  p: 3,
                  boxShadow: theme.shadows[1],
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                  }}
                >
                  Localização
                </Typography>
                <PropertyLocalization
                  property={{
                    id: property.id,
                    title: property.title,
                    address: property.address,
                    city: property.city,
                    state: property.state,
                    coordinates: property.coordinates,
                  }}
                  height={300}
                />
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "50vh",
                textAlign: "center",
              }}
            >
              <Typography variant="h5" color="text.primary" sx={{ mb: 2 }}>
                Propriedade não encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                A propriedade solicitada não foi encontrada ou não existe.
              </Typography>
              <Button
                variant="contained"
                onClick={handleBack}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Voltar
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Galeria em Tela Cheia */}
      {property && property.images.length > 0 && (
        <FullscreenGallery
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={property.images}
          initialIndex={galleryInitialIndex}
          propertyTitle={property.title}
        />
      )}
    </Drawer>
  );
}
