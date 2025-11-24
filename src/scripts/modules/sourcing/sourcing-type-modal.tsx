import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import { Close, Home, ContactPage } from "@mui/icons-material";

interface SourcingTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProperty?: () => void;
  onSelectContact?: () => void;
}

export function SourcingTypeModal({
  open,
  onClose,
  onSelectProperty,
  onSelectContact,
}: SourcingTypeModalProps) {
  const theme = useTheme();

  const handlePropertyClick = () => {
    onSelectProperty?.();
    onClose();
  };

  const handleContactClick = () => {
    onSelectContact?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: theme.shadows[24],
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              color: theme.palette.text.primary,
            }}
          >
            Adicionar captação
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: theme.palette.text.secondary,
              fontSize: "1rem",
            }}
          >
            Selecione o tipo de captação que deseja criar.
          </Typography>

          {/* Options Container */}
          <Box
            sx={{
              display: "flex",
              gap: 3,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            {/* Property Option */}
            <Box
              onClick={handlePropertyClick}
              sx={{
                flex: 1,
                minHeight: 280,
                backgroundColor: "#C8E6C9",
                borderRadius: 2,
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid transparent",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                  border: `1px solid ${theme.palette.divider}`,
                },
              }}
            >
              <Home
                sx={{
                  fontSize: 80,
                  color: theme.palette.text.primary,
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: theme.palette.text.primary,
                  mb: 1,
                  textAlign: "center",
                }}
              >
                Captação de Imóvel
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  textAlign: "center",
                  fontSize: "0.875rem",
                  maxWidth: 300,
                }}
              >
                Capte um imóvel específico informando endereço e características
              </Typography>
            </Box>

            {/* Contact Option */}
            <Box
              onClick={handleContactClick}
              sx={{
                flex: 1,
                minHeight: 280,
                backgroundColor: "#BBDEFB",
                borderRadius: 2,
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid transparent",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                  border: `1px solid ${theme.palette.divider}`,
                },
              }}
            >
              <ContactPage
                sx={{
                  fontSize: 80,
                  color: theme.palette.text.primary,
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: theme.palette.text.primary,
                  mb: 1,
                  textAlign: "center",
                }}
              >
                Captação de Contato
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  textAlign: "center",
                  fontSize: "0.875rem",
                  maxWidth: 300,
                }}
              >
                Capte um contato proprietário para posteriormente revelar seus
                imóveis
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
