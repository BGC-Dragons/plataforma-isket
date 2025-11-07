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
import { getPropertyAdView } from "../../../../services/get-property-ad-view.service";
import {
  mapApiToPropertyDetails,
  type IPropertyDetailsData,
} from "../../../../services/helpers/map-api-to-property-details.helper";
import { useAuth } from "../../access-manager/auth.hook";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluationEmails, setEvaluationEmails] = useState<string[]>([]);
  const [evaluationCredits] = useState(3); // Mock - virá da API

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
  }, [propertyId, open, auth.store.user?.id]);

  // Função para voltar
  const handleBack = () => {
    navigate("/pesquisar-anuncios");
    onClose();
  };

  // Função para mostrar todas as fotos
  const handleShowAllPhotos = () => {
    console.log("Mostrando todas as fotos da propriedade:", propertyId);
    // Implementar modal de galeria completa
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
    console.log("Acessando página da imobiliária:", property?.realEstateName);
    // Implementar navegação para página da imobiliária
  };

  // Função para clicar em uma imagem
  const handleImageClick = (index: number) => {
    console.log("Imagem clicada:", index);
    // Implementar lógica adicional se necessário
  };

  // Função para nova captação
  const handleNewCapture = () => {
    console.log("Nova captação para propriedade:", propertyId);
    // Implementar navegação ou modal para nova captação
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
    </Drawer>
  );
}
