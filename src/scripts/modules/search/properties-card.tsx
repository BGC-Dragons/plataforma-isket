import { useState } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Bed,
  Bathtub,
  DirectionsCar,
  SquareFoot,
  LocationOn,
  Favorite,
  FavoriteBorder,
  Share,
} from "@mui/icons-material";
import { PropertyPlaceholderImage } from "../../../assets/property-placeholder-image";

interface PropertyCardProps {
  id: string;
  title?: string;
  price: number;
  pricePerSquareMeter: number;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  area: number;
  images: string[];
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  onShare?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function PropertiesCard({
  id,
  title,
  price,
  pricePerSquareMeter,
  address,
  neighborhood,
  city,
  propertyType,
  bedrooms = 0,
  bathrooms = 0,
  parking = 0,
  area,
  images,
  isFavorite = false,
  onFavoriteToggle,
  onShare,
  onClick,
}: PropertyCardProps) {
  const theme = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPricePerSquareMeter = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const hasValidImages =
    images &&
    images.length > 0 &&
    images.some((img) => img && img.trim() !== "");

  const handleImageNavigation = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentImageIndex(
        currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1
      );
    } else {
      setCurrentImageIndex(
        currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1
      );
    }
  };

  const handleImageError = () => {
    setFailedImages((prev) => new Set(prev).add(currentImageIndex));
  };

  const currentImageFailed = failedImages.has(currentImageIndex);
  const shouldShowPlaceholder = !hasValidImages || currentImageFailed;

  const getPropertyTypeColor = (type: string) => {
    switch (type) {
      case "COMERCIAL":
        return theme.palette.secondary.main;
      case "RESIDENCIAL":
        return theme.palette.primary.main;
      case "TERRENO":
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "COMERCIAL":
        return theme.palette.error.main; // Vermelho para comercial
      case "RESIDENCIAL":
        return theme.palette.primary.main;
      case "TERRENO":
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 400,
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: theme.shadows[2],
        transition: "all 0.3s ease",
        cursor: "pointer",
        "&:hover": {
          boxShadow: theme.shadows[8],
          transform: "translateY(-4px)",
        },
        backgroundColor: theme.palette.background.paper,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(id)}
    >
      {/* Seção da Imagem */}
      <Box sx={{ position: "relative", height: 240 }}>
        {/* Imagem Principal */}
        {shouldShowPlaceholder ? (
          <Box
            sx={{
              height: "100%",
              transition: "transform 0.3s ease",
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          >
            <PropertyPlaceholderImage />
          </Box>
        ) : (
          <CardMedia
            component="img"
            height="240"
            image={images[currentImageIndex]}
            alt={title || "Propriedade"}
            onError={handleImageError}
            sx={{
              objectFit: "cover",
              transition: "transform 0.3s ease",
              transform: isHovered ? "scale(1.05)" : "scale(1)",
            }}
          />
        )}

        {/* Overlay com gradiente sutil */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)",
          }}
        />

        {/* Tag do Tipo de Propriedade */}
        <Chip
          label={propertyType}
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: getPropertyTypeColor(propertyType),
            color: theme.palette.getContrastText(
              getPropertyTypeColor(propertyType)
            ),
            fontWeight: 600,
            fontSize: "0.75rem",
            height: 28,
            borderRadius: 2,
            boxShadow: theme.shadows[2],
          }}
        />

        {/* Indicadores do Carousel */}
        {hasValidImages && images.length > 1 && !shouldShowPlaceholder && (
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 1,
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentImageIndex
                      ? theme.palette.common.white
                      : theme.palette.common.white + "60",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Box>
        )}

        {/* Botões de Navegação (apenas no hover) */}
        {hasValidImages && images.length > 1 && !shouldShowPlaceholder && isHovered && (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation("prev");
              }}
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: theme.palette.common.white + "90",
                backdropFilter: "blur(10px)",
                "&:hover": {
                  backgroundColor: theme.palette.common.white,
                },
                width: 32,
                height: 32,
              }}
            >
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 600 }}>
                ‹
              </Typography>
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation("next");
              }}
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: theme.palette.common.white + "90",
                backdropFilter: "blur(10px)",
                "&:hover": {
                  backgroundColor: theme.palette.common.white,
                },
                width: 32,
                height: 32,
              }}
            >
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 600 }}>
                ›
              </Typography>
            </IconButton>
          </>
        )}

        {/* Botões de Ação */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.(id);
            }}
            sx={{
              backgroundColor: theme.palette.common.white + "90",
              backdropFilter: "blur(10px)",
              width: 36,
              height: 36,
              "&:hover": {
                backgroundColor: theme.palette.common.white,
              },
            }}
          >
            {isFavorite ? (
              <Favorite
                sx={{ color: theme.palette.error.main, fontSize: "1.2rem" }}
              />
            ) : (
              <FavoriteBorder
                sx={{ color: theme.palette.text.secondary, fontSize: "1.2rem" }}
              />
            )}
          </IconButton>

          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(id);
            }}
            sx={{
              backgroundColor: theme.palette.common.white + "90",
              backdropFilter: "blur(10px)",
              width: 36,
              height: 36,
              "&:hover": {
                backgroundColor: theme.palette.common.white,
              },
            }}
          >
            <Share
              sx={{ color: theme.palette.text.secondary, fontSize: "1.2rem" }}
            />
          </IconButton>
        </Box>
      </Box>

      {/* Seção de Conteúdo */}
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        {/* Preço Principal */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 1,
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          {formatCurrency(price)}
        </Typography>

        {/* Preço por m² */}
        {pricePerSquareMeter > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <SquareFoot
                sx={{
                  fontSize: "1rem",
                  color: getIconColor(propertyType),
                }}
              />
              {formatPricePerSquareMeter(pricePerSquareMeter)}/m²
            </Typography>
          </Box>
        )}

        {/* Endereço */}
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
          <LocationOn
            sx={{
              fontSize: "1rem",
              color: theme.palette.text.secondary,
              mr: 1,
              mt: 0.2,
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {address}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.8rem",
                lineHeight: 1.3,
              }}
            >
              {neighborhood && city
                ? `${neighborhood}, ${city}`
                : city || neighborhood}
            </Typography>
          </Box>
        </Box>

        {/* Amenities */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {bedrooms > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Bed
                sx={{
                  fontSize: "1rem",
                  color: getIconColor(propertyType),
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {bedrooms}
              </Typography>
            </Box>
          )}

          {bathrooms > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Bathtub
                sx={{
                  fontSize: "1rem",
                  color: getIconColor(propertyType),
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {bathrooms}
              </Typography>
            </Box>
          )}

          {parking > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <DirectionsCar
                sx={{
                  fontSize: "1rem",
                  color: getIconColor(propertyType),
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {parking}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SquareFoot
              sx={{
                fontSize: "1rem",
                color: getIconColor(propertyType),
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {area} m²
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
