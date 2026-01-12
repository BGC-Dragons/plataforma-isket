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
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
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
              gap: { xs: 1.5, sm: 3 },
              flexDirection: "row",
            }}
          >
            {/* Property Option */}
            <Box
              onClick={handlePropertyClick}
              sx={{
                flex: 1,
                minHeight: { xs: 180, sm: 280 },
                backgroundColor: "#C8E6C9",
                borderRadius: 2,
                p: { xs: 2, sm: 4 },
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
                  fontSize: { xs: 40, sm: 60 },
                  color: theme.palette.text.primary,
                  mb: { xs: 1, sm: 1.5 },
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  color: theme.palette.text.primary,
                  mb: { xs: 0.5, sm: 1 },
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
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  maxWidth: 300,
                  display: { xs: "none", sm: "block" },
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
                minHeight: { xs: 180, sm: 280 },
                backgroundColor: "#BBDEFB",
                borderRadius: 2,
                p: { xs: 2, sm: 4 },
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
                  fontSize: { xs: 40, sm: 60 },
                  color: theme.palette.text.primary,
                  mb: { xs: 1, sm: 1.5 },
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  color: theme.palette.text.primary,
                  mb: { xs: 0.5, sm: 1 },
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
                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                  maxWidth: 300,
                  display: { xs: "none", sm: "block" },
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
