import React from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

interface SubscriptionBlockedModalProps {
  open: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const SubscriptionBlockedModal: React.FC<
  SubscriptionBlockedModalProps
> = ({ open, onClose, onBackToLogin }) => {
  const handleEmailClick = () => {
    window.open("mailto:suporte@isket.com.br", "_blank");
  };

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/5541988628686", "_blank");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.3)",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Seção de Erro - Fundo Vermelho */}
        <Box
          sx={{
            backgroundColor: "#d32f2f",
            color: "white",
            p: 4,
            position: "relative",
            textAlign: "center",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "white",
              border: "3px solid #d32f2f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <ErrorIcon sx={{ color: "#d32f2f", fontSize: 30 }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: "1.5rem",
            }}
          >
            Acesso Bloqueado
          </Typography>

          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              fontSize: "0.95rem",
              lineHeight: 1.4,
            }}
          >
            Sua assinatura expirou ou está inativa. Entre em contato com nossa
            equipe para reativar seu acesso.
          </Typography>
        </Box>

        {/* Seção de Contato - Fundo Branco */}
        <Box sx={{ p: 4, backgroundColor: "white" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#333",
              mb: 1,
              textAlign: "center",
            }}
          >
            Como podemos ajudar?
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#666",
              mb: 3,
              textAlign: "center",
            }}
          >
            Nossa equipe está pronta para atender você
          </Typography>

          {/* Opções de Contato */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            {/* Email */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                },
              }}
              onClick={handleEmailClick}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <EmailIcon sx={{ color: "#666", fontSize: 24 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#999",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      letterSpacing: 0.5,
                    }}
                  >
                    EMAIL
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#333",
                      fontWeight: 500,
                      mt: 0.5,
                    }}
                  >
                    suporte@isket.com.br
                  </Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: "#666", fontSize: 20 }} />
              </Box>
            </Paper>

            {/* WhatsApp */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                },
              }}
              onClick={handleWhatsAppClick}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <WhatsAppIcon sx={{ color: "#25D366", fontSize: 24 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#999",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      letterSpacing: 0.5,
                    }}
                  >
                    WHATSAPP
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#333",
                      fontWeight: 500,
                      mt: 0.5,
                    }}
                  >
                    (41) 98862-8686
                  </Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: "#666", fontSize: 20 }} />
              </Box>
            </Paper>
          </Box>

          {/* Banner de Informação */}
          <Box
            sx={{
              backgroundColor: "#e3f2fd",
              borderRadius: 2,
              p: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <InfoIcon sx={{ color: "#1976d2", fontSize: 20 }} />
            <Typography
              variant="body2"
              sx={{
                color: "#333",
                fontSize: "0.875rem",
              }}
            >
              <strong>Tempo de resposta:</strong> Nossa equipe responde em até
              24 horas durante dias úteis.
            </Typography>
          </Box>

          {/* Botão Voltar ao Login */}
          <Button
            fullWidth
            variant="outlined"
            onClick={onBackToLogin}
            sx={{
              py: 1.5,
              borderRadius: 2,
              borderColor: "#e0e0e0",
              color: "white",
              fontWeight: 500,
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": {
                borderColor: "#999",
                backgroundColor: "#f5f5f5",
                color: "red",
              },
            }}
          >
            Voltar ao Login
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
