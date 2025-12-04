import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useAuth } from "../access-manager/auth.hook";
import { useGetPurchases } from "../../../services/get-purchases.service";
import { postPropertyListingAcquisitionContactHistory } from "../../../services/post-property-listing-acquisition-contact-history.service";
import type { IPropertyOwner } from "../../../services/get-property-owner-finder-by-address.service";

interface RevealContactModalProps {
  open: boolean;
  onClose: () => void;
  owner: IPropertyOwner | null;
  acquisitionProcessId?: string;
  onContactCreated?: () => void;
}

export function RevealContactModal({
  open,
  onClose,
  owner,
  acquisitionProcessId,
  onContactCreated,
}: RevealContactModalProps) {
  const theme = useTheme();
  const auth = useAuth();
  const { data: purchases } = useGetPurchases();
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular créditos restantes de RESIDENT_SEARCH
  const getRemainingCredits = (): number => {
    if (!purchases || purchases.length === 0) return 0;

    // Pegar a primeira compra ativa
    const purchase = purchases[0];
    const residentSearchUnit = purchase.remainingUnits.find(
      (unit) => unit.type === "RESIDENT_SEARCH"
    );

    return residentSearchUnit?.unitsRemaining || 0;
  };

  const remainingCredits = getRemainingCredits();

  const formatCPF = (cpf: string) => {
    // Formatar CPF: 000.000.000-00
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6,
        9
      )}-${numbers.slice(9, 11)}`;
    }
    return cpf;
  };

  const formatName = (owner: IPropertyOwner | null): string => {
    if (!owner) return "";
    const firstName = owner.firstName || "";
    const lastName = owner.lastName || "";
    return `${firstName} ${lastName}`
      .trim()
      .replace(/\s+undefined\s*/gi, " ")
      .trim();
  };

  const handleReveal = async () => {
    if (!owner || !acquisitionProcessId || !auth.store.token) {
      setError("Dados insuficientes para revelar o contato.");
      return;
    }

    if (remainingCredits <= 0) {
      setError(
        "Você não possui créditos suficientes para revelar este contato."
      );
      return;
    }

    setIsRevealing(true);
    setError(null);

    try {
      const ownerName = formatName(owner);
      const ownerCpf = owner.nationalId || "";

      // Criar o contato usando contacthistory
      await postPropertyListingAcquisitionContactHistory(
        {
          acquisitionProcessId,
          contactName: ownerName,
          contactDetails: `CPF: ${formatCPF(ownerCpf)}`,
          contactDate: new Date().toISOString(),
          status: "UNDEFINED",
        },
        auth.store.token
      );

      // Chamar callback para atualizar a lista de contatos
      onContactCreated?.();

      // Fechar modal
      onClose();
    } catch (error: unknown) {
      console.error("Erro ao revelar contato:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string };
          };
        };

        if (axiosError.response?.status === 402) {
          setError(
            "Você não possui créditos suficientes. Por favor, adquira créditos para continuar usando o serviço."
          );
        } else {
          const errorMessage =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            "Erro ao revelar contato. Tente novamente.";
          setError(errorMessage);
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro inesperado ao revelar contato. Tente novamente.");
      }
    } finally {
      setIsRevealing(false);
    }
  };

  // Limpar erro quando o modal abrir/fechar
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  if (!owner) return null;

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
          boxShadow: theme.shadows[24],
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
            Revelar contato
          </Typography>
          <IconButton
            onClick={onClose}
            disabled={isRevealing}
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
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Nome e CPF */}
          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {formatName(owner)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.875rem",
                color: theme.palette.text.secondary,
              }}
            >
              {formatCPF(owner.nationalId || "")}
            </Typography>
          </Box>

          {/* Texto de confirmação */}
          <Typography
            variant="body1"
            sx={{
              fontSize: "1rem",
              color: theme.palette.text.primary,
            }}
          >
            Deseja revelar as informações completas?
          </Typography>

          {/* Créditos restantes */}
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.875rem",
              color: theme.palette.text.secondary,
            }}
          >
            Você possui <strong>{remainingCredits}</strong>{" "}
            {remainingCredits === 1 ? "crédito" : "créditos"} restante
            {remainingCredits !== 1 ? "s" : ""} para pesquisa de moradores.
          </Typography>

          {/* Erro */}
          {error && (
            <Box
              sx={{
                p: 2,
                backgroundColor: theme.palette.error.light,
                borderRadius: 2,
                color: theme.palette.error.dark,
              }}
            >
              <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                {error}
              </Typography>
            </Box>
          )}

          {/* Botões */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
              pt: 1,
            }}
          >
            <Button
              onClick={onClose}
              disabled={isRevealing}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1,
                fontSize: "0.875rem",
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReveal}
              disabled={isRevealing || remainingCredits <= 0}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1,
                fontSize: "0.875rem",
                backgroundColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
                "&:disabled": {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              }}
            >
              {isRevealing ? (
                <CircularProgress
                  size={20}
                  sx={{ color: theme.palette.common.white }}
                />
              ) : (
                "Revelar"
              )}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
