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

// Interface para os dados da propriedade
interface PropertyDetailsData {
  id: string;
  title: string;
  status: "VENDA" | "ALUGUEL";
  price: number;
  pricePerSquareMeter: number;
  address: string;
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  totalArea: number;
  usableArea?: number;
  images: string[];
  characteristics?: string[];
  description?: string;
  realEstateName?: string;
}

// Dados mockados (em uma implementação real, isso viria de uma API)
const mockPropertyDetails: Record<string, PropertyDetailsData> = {
  "1": {
    id: "1",
    title: "Estúdio - Comercial",
    status: "VENDA",
    price: 145000,
    pricePerSquareMeter: 5370.37,
    address: "Rua Marechal Deodoro, 235, Centro",
    city: "CURITIBA",
    state: "PR",
    propertyType: "COMERCIAL",
    bedrooms: 1,
    bathrooms: 1,
    totalArea: 180,
    usableArea: 180,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    ],
    characteristics: [
      "Ar condicionado",
      "Internet fibra óptica",
      "Estacionamento",
      "Segurança 24h",
      "Próximo ao metrô",
      "Área comercial",
    ],
    description:
      "Estúdio comercial localizado no centro da cidade, próximo ao metrô e com fácil acesso ao transporte público. Ideal para escritórios, consultórios ou pequenos comércios. O imóvel possui excelente localização e infraestrutura completa.",
    realEstateName: "Rarítá Imóveis",
  },
  "2": {
    id: "2",
    title: "Apartamento Residencial",
    status: "VENDA",
    price: 320000,
    pricePerSquareMeter: 8500.0,
    address: "Rua das Flores, 123, Batel",
    city: "CURITIBA",
    state: "PR",
    propertyType: "RESIDENCIAL",
    bedrooms: 3,
    bathrooms: 2,
    totalArea: 85,
    usableArea: 75,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    ],
    characteristics: [
      "3 quartos",
      "2 banheiros",
      "Sala de estar",
      "Cozinha americana",
      "Varanda",
      "Garagem",
    ],
    description:
      "Apartamento residencial em excelente localização no bairro Batel. Imóvel com 3 quartos, sendo 1 suíte, 2 banheiros, sala de estar integrada com cozinha americana e varanda. Possui 1 vaga de garagem coberta.",
    realEstateName: "Rarítá Imóveis",
  },
};

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
  const [property, setProperty] = useState<PropertyDetailsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar dados da propriedade
  useEffect(() => {
    if (propertyId && open) {
      setLoading(true);
      // Simula delay de carregamento
      setTimeout(() => {
        const propertyData = mockPropertyDetails[propertyId];
        if (propertyData) {
          setProperty(propertyData);
        }
        setLoading(false);
      }, 500);
    }
  }, [propertyId, open]);

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
              />

              {/* Seção de Localização (placeholder para futuro mapa) */}
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
                <Box
                  sx={{
                    height: 300,
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.palette.text.secondary,
                  }}
                >
                  <Typography variant="body1">
                    Mapa será implementado aqui
                  </Typography>
                </Box>
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
