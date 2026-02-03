import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  putUserCreditLimit,
  type IPutUserCreditLimitRequest,
} from "../../../../../services/put-user-credit-limit.service";
import { clearUserCreditLimitsCache } from "../../../../../services/get-user-credit-limits.service";

interface CreditLimitDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  unitType: "PROPERTY_VALUATION" | "RESIDENT_SEARCH" | "RADARS";
  unitTypeLabel: string;
  currentLimit: number | null;
  currentConsumed: number;
}

export function CreditLimitDialog({
  open,
  onClose,
  userId,
  userName,
  unitType,
  unitTypeLabel,
  currentLimit,
  currentConsumed,
}: CreditLimitDialogProps) {
  const { store } = useAuth();
  const [limitValue, setLimitValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLimitValue(currentLimit !== null ? String(currentLimit) : "");
      setError(null);
    }
  }, [open, currentLimit]);

  const handleSave = async (limitAmount: number | null) => {
    if (!store.token) return;

    try {
      setIsSaving(true);
      setError(null);

      const data: IPutUserCreditLimitRequest = {
        userId,
        unitType,
        limitAmount,
      };

      await putUserCreditLimit(store.token, data);
      clearUserCreditLimitsCache();
      onClose();
    } catch (err) {
      setError("Erro ao salvar limite. Tente novamente.");
      console.error("Erro ao salvar limite de crédito:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = () => {
    const parsed = parseInt(limitValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setError("Informe um valor numérico válido (0 ou maior).");
      return;
    }
    handleSave(parsed);
  };

  const handleRemoveLimit = () => {
    handleSave(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Definir Limite - {unitTypeLabel}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Defina o limite máximo de créditos de{" "}
          <strong>{unitTypeLabel.toLowerCase()}</strong> para{" "}
          <strong>{userName}</strong>. Se nenhum limite for definido, o usuário
          terá acesso ilimitado ao pool da conta.
        </Typography>

        {currentConsumed > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Este usuário já consumiu <strong>{currentConsumed}</strong>{" "}
            crédito(s) neste período.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          label="Limite de créditos"
          type="number"
          fullWidth
          variant="outlined"
          value={limitValue}
          onChange={(e) => setLimitValue(e.target.value)}
          inputProps={{ min: 0 }}
          placeholder="Ex: 50"
          helperText={
            currentLimit !== null
              ? `Limite atual: ${currentLimit}`
              : "Sem limite definido"
          }
        />
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: "space-between", px: 3, pb: 2 }}
      >
        <Box>
          {currentLimit !== null && (
            <Button
              onClick={handleRemoveLimit}
              color="warning"
              disabled={isSaving}
            >
              Remover Limite
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!limitValue || isSaving}
          >
            {isSaving ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                Salvando...
              </Box>
            ) : (
              "Salvar"
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
