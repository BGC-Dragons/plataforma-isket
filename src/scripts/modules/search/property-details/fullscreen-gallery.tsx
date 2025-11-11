import { useState, useEffect } from "react";
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  useTheme,
  Stack,
} from "@mui/material";
import {
  Close,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

interface FullscreenGalleryProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  propertyTitle?: string;
}

export function FullscreenGallery({
  open,
  onClose,
  images,
  initialIndex = 0,
  propertyTitle,
}: FullscreenGalleryProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Atualizar índice quando initialIndex mudar
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, open]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Navegação com teclado
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, images.length, onClose]);

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.common.black,
          color: theme.palette.common.white,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Header com título e botão fechar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            background: `linear-gradient(to bottom, ${theme.palette.common.black} 0%, transparent 100%)`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.common.white,
              fontWeight: 600,
              maxWidth: "60%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {propertyTitle || "Galeria de Fotos"}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: theme.palette.common.white,
              backgroundColor: theme.palette.common.black + "80",
              backdropFilter: "blur(10px)",
              "&:hover": {
                backgroundColor: theme.palette.common.black + "CC",
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Área principal da imagem */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            p: { xs: 1, sm: 2 },
            pt: { xs: 8, sm: 10 },
            pb: { xs: 20, sm: 24 },
          }}
        >
          {/* Imagem principal */}
          <Box
            component="img"
            src={images[currentIndex]}
            alt={`Foto ${currentIndex + 1} de ${images.length}`}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: 1,
              transition: "opacity 0.3s ease",
            }}
          />

          {/* Botão anterior */}
          {images.length > 1 && (
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: "absolute",
                left: { xs: 8, sm: 24 },
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: theme.palette.common.black + "80",
                backdropFilter: "blur(10px)",
                color: theme.palette.common.white,
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
                "&:hover": {
                  backgroundColor: theme.palette.common.black + "CC",
                },
              }}
            >
              <ChevronLeft sx={{ fontSize: { xs: 28, sm: 40 } }} />
            </IconButton>
          )}

          {/* Botão próximo */}
          {images.length > 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                right: { xs: 8, sm: 24 },
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: theme.palette.common.black + "80",
                backdropFilter: "blur(10px)",
                color: theme.palette.common.white,
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
                "&:hover": {
                  backgroundColor: theme.palette.common.black + "CC",
                },
              }}
            >
              <ChevronRight sx={{ fontSize: { xs: 28, sm: 40 } }} />
            </IconButton>
          )}

          {/* Contador de imagens */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 80, sm: 100 },
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: theme.palette.common.black + "80",
              backdropFilter: "blur(10px)",
              px: 2,
              py: 1,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.common.white,
                fontWeight: 600,
              }}
            >
              {currentIndex + 1} / {images.length}
            </Typography>
          </Box>
        </Box>

        {/* Miniaturas na parte inferior */}
        {images.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: `linear-gradient(to top, ${theme.palette.common.black} 0%, transparent 100%)`,
              overflowX: "auto",
              overflowY: "hidden",
              "&::-webkit-scrollbar": {
                height: 6,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: theme.palette.common.black + "40",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.common.white + "60",
                borderRadius: 3,
                "&:hover": {
                  backgroundColor: theme.palette.common.white + "80",
                },
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                justifyContent: "center",
                alignItems: "center",
                minWidth: "fit-content",
              }}
            >
              {images.map((image, index) => (
                <Box
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  sx={{
                    position: "relative",
                    width: { xs: 60, sm: 80 },
                    height: { xs: 45, sm: 60 },
                    borderRadius: 1,
                    overflow: "hidden",
                    cursor: "pointer",
                    border:
                      currentIndex === index
                        ? `3px solid ${theme.palette.primary.main}`
                        : `2px solid ${theme.palette.common.white + "40"}`,
                    transition: "all 0.3s ease",
                    opacity: currentIndex === index ? 1 : 0.7,
                    "&:hover": {
                      opacity: 1,
                      transform: "scale(1.05)",
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={image}
                    alt={`Miniatura ${index + 1}`}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {currentIndex === index && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: theme.palette.primary.main + "30",
                      }}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

