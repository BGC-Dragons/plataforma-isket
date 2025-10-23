import { useState } from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import { PhotoCamera, ChevronLeft, ChevronRight } from "@mui/icons-material";

interface PropertyGalleryProps {
  images: string[];
  propertyTitle?: string;
  onImageClick?: (index: number) => void;
}

export function PropertyGallery({
  images,
  propertyTitle,
  onImageClick,
}: PropertyGalleryProps) {
  const theme = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailOffset, setThumbnailOffset] = useState(0);

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

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    onImageClick?.(index);
  };

  const handleThumbnailNavigation = (direction: "prev" | "next") => {
    const maxOffset = Math.max(0, images.length - 4);
    if (direction === "prev") {
      setThumbnailOffset(Math.max(0, thumbnailOffset - 1));
    } else {
      setThumbnailOffset(Math.min(maxOffset, thumbnailOffset + 1));
    }
  };

  const visibleThumbnails = images.slice(thumbnailOffset, thumbnailOffset + 4);
  const canNavigateLeft = thumbnailOffset > 0;
  const canNavigateRight = thumbnailOffset < images.length - 4;

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: theme.palette.grey[100],
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        minHeight: 400,
      }}
    >
      {/* Layout da Galeria */}
      <Box
        sx={{
          display: "flex",
          height: 400,
          gap: 1,
          p: 1,
          // Apenas para telas menores que 750px
          "@media (max-width: 750px)": {
            flexDirection: "column",
            height: 300,
          },
        }}
      >
        {/* Foto Principal - Lado Esquerdo */}
        <Box
          sx={{
            flex: 2,
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: theme.palette.grey[200],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Apenas para telas menores que 750px
            "@media (max-width: 750px)": {
              flex: 1,
              width: "100%",
            },
          }}
        >
          {images.length > 0 ? (
            <Box
              component="img"
              src={images[currentImageIndex]}
              alt={propertyTitle || "Propriedade"}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: theme.palette.grey[500],
              }}
            >
              <PhotoCamera sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Sem fotos disponíveis
              </Typography>
            </Box>
          )}

          {/* Botões de Navegação da Foto Principal */}
          {images.length > 1 && (
            <>
              <IconButton
                onClick={() => handleImageNavigation("prev")}
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
                  width: 40,
                  height: 40,
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                onClick={() => handleImageNavigation("next")}
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
                  width: 40,
                  height: 40,
                }}
              >
                <ChevronRight />
              </IconButton>
            </>
          )}

          {/* Indicadores de Imagem */}
          {images.length > 1 && (
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
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: theme.palette.common.white,
                    },
                  }}
                  onClick={() => handleThumbnailClick(index)}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Fotos Menores - Lado Direito */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            position: "relative",
            // Apenas para telas menores que 750px - esconder miniaturas
            "@media (max-width: 750px)": {
              display: "none",
            },
          }}
        >
          {/* Botão de navegação esquerda */}
          {canNavigateLeft && (
            <IconButton
              onClick={() => handleThumbnailNavigation("prev")}
              sx={{
                position: "absolute",
                left: -8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                width: 24,
                height: 24,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: 16 }} />
            </IconButton>
          )}

          {/* Botão de navegação direita */}
          {canNavigateRight && (
            <IconButton
              onClick={() => handleThumbnailNavigation("next")}
              sx={{
                position: "absolute",
                right: -8,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                width: 24,
                height: 24,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <ChevronRight sx={{ fontSize: 16 }} />
            </IconButton>
          )}

          {/* Grid de Fotos Menores */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              flex: 1,
            }}
          >
            {visibleThumbnails.map((image, index) => {
              const actualIndex = thumbnailOffset + index;
              return (
                <Box
                  key={actualIndex}
                  onClick={() => handleThumbnailClick(actualIndex)}
                  sx={{
                    position: "relative",
                    borderRadius: 1,
                    overflow: "hidden",
                    cursor: "pointer",
                    backgroundColor: theme.palette.grey[200],
                    aspectRatio: "1",
                    width: "100%",
                    height: "100%",
                    minHeight: "80px",
                    border: currentImageIndex === actualIndex ? 2 : 0,
                    borderColor: theme.palette.primary.main,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={image}
                    alt={`Foto ${index + 1}`}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                  {/* Overlay para indicar seleção */}
                  {currentImageIndex === actualIndex && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: theme.palette.primary.main + "20",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: theme.palette.primary.main,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.common.white,
                            fontSize: "0.6rem",
                            fontWeight: 600,
                          }}
                        >
                          {actualIndex + 1}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Contador de Fotos */}
      {images.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: theme.palette.common.black + "80",
            color: theme.palette.common.white,
            px: 2,
            py: 1,
            borderRadius: 2,
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {currentImageIndex + 1} / {images.length}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
