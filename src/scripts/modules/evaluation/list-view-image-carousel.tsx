import { useState, useRef } from "react";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  Chip,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  PhotoLibrary,
} from "@mui/icons-material";
import { PropertyPlaceholderImage } from "../../../assets/property-placeholder-image";

interface ListViewImageCarouselProps {
  images: string[];
  propertyTitle?: string;
  onOpenGallery?: (initialIndex: number) => void;
}

export function ListViewImageCarousel({
  images,
  propertyTitle,
  onOpenGallery,
}: ListViewImageCarouselProps) {
  const theme = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const hasValidImages =
    images &&
    images.length > 0 &&
    images.some((img) => img && img.trim() !== "");

  const currentImageFailed = failedImages.has(currentImageIndex);
  const shouldShowPlaceholder = !hasValidImages || currentImageFailed;

  const handleImageNavigation = (direction: "prev" | "next") => {
    if (!hasValidImages || images.length <= 1) return;

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

  const handleOpenGallery = () => {
    if (onOpenGallery && hasValidImages) {
      onOpenGallery(currentImageIndex);
    }
  };

  // Touch events para swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe para a esquerda (próxima imagem)
        handleImageNavigation("next");
      } else {
        // Swipe para a direita (imagem anterior)
        handleImageNavigation("prev");
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <Box
      sx={{
        width: 140,
        height: 105,
        borderRadius: 1,
        overflow: "hidden",
        backgroundColor: theme.palette.grey[200],
        flexShrink: 0,
        position: "relative",
        cursor: hasValidImages ? "pointer" : "default",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleOpenGallery}
    >
      {/* Imagem Principal */}
      {shouldShowPlaceholder ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.grey[200],
          }}
        >
          <PropertyPlaceholderImage />
        </Box>
      ) : (
        <Box
          component="img"
          src={images[currentImageIndex]}
          alt={propertyTitle || "Propriedade"}
          onError={handleImageError}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Overlay escuro sutil no hover */}
      {isHovered && hasValidImages && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease",
          }}
        />
      )}

      {/* Badge com quantidade de fotos - clicável para abrir galeria */}
      {hasValidImages && images.length > 0 && (
        <Chip
          icon={<PhotoLibrary sx={{ fontSize: "0.875rem !important" }} />}
          label={`${images.length}`}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenGallery();
          }}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            backgroundColor: theme.palette.common.black + "CC",
            backdropFilter: "blur(10px)",
            color: theme.palette.common.white,
            fontWeight: 600,
            fontSize: "0.75rem",
            height: 24,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: theme.palette.common.black,
            },
            "& .MuiChip-icon": {
              color: theme.palette.common.white,
            },
          }}
        />
      )}

      {/* Botões de Navegação */}
      {hasValidImages &&
        images.length > 1 &&
        !shouldShowPlaceholder && (
          <>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation("prev");
              }}
              sx={{
                position: "absolute",
                left: 4,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: theme.palette.common.white + "CC",
                backdropFilter: "blur(10px)",
                width: 28,
                height: 28,
                opacity: isHovered ? 1 : 0.7,
                transition: "opacity 0.3s ease",
                "&:hover": {
                  backgroundColor: theme.palette.common.white,
                  opacity: 1,
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: "1rem" }} />
            </IconButton>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation("next");
              }}
              sx={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: theme.palette.common.white + "CC",
                backdropFilter: "blur(10px)",
                width: 28,
                height: 28,
                opacity: isHovered ? 1 : 0.7,
                transition: "opacity 0.3s ease",
                "&:hover": {
                  backgroundColor: theme.palette.common.white,
                  opacity: 1,
                },
              }}
            >
              <ChevronRight sx={{ fontSize: "1rem" }} />
            </IconButton>
          </>
        )}

      {/* Indicadores de posição (dots) */}
      {hasValidImages &&
        images.length > 1 &&
        !shouldShowPlaceholder && (
          <Box
            sx={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 0.5,
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentImageIndex
                      ? theme.palette.common.white
                      : theme.palette.common.white + "80",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Box>
        )}

      {/* Placeholder quando não há fotos */}
      {!hasValidImages && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.grey[200],
            color: theme.palette.grey[500],
          }}
        >
          <Typography variant="caption">Sem foto</Typography>
        </Box>
      )}
    </Box>
  );
}
