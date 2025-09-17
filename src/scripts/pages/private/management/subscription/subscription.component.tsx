import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Chip,
  Card,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Edit, Add, LocationOn } from "@mui/icons-material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  getPurchases,
  type IGetPurchasesResponseSuccess,
  type ProductUnitType,
  type ProductType,
  type AccountType,
} from "../../../../../services/get-purchases.service";

export function SubscriptionSection() {
  const theme = useTheme();
  const { store } = useAuth();

  const [purchases, setPurchases] = useState<IGetPurchasesResponseSuccess[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPurchases = async () => {
      if (!store.token) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await getPurchases(store.token);
        setPurchases(response.data);
        console.log(response.data);
      } catch (err) {
        console.error("Erro ao carregar compras:", err);
        setError("Erro ao carregar dados da assinatura");
      } finally {
        setIsLoading(false);
      }
    };

    loadPurchases();
  }, [store.token]);

  const translateProductType = (type: ProductType): string => {
    const translations: Record<ProductType, string> = {
      FIXED_PLAN: "Plano Fixo",
      CUSTOM_PLAN: "Plano Personalizado",
      TRIAL_PLAN: "Plano de Teste",
      CREDIT_PACKAGE: "Pacote de Créditos",
    };
    return translations[type] || type;
  };

  const getPeriodType = (purchase: IGetPurchasesResponseSuccess): string => {
    const hasYearly = purchase.product.gatewayPrices.some(
      (price) => price.type === "YEARLY"
    );
    const hasMonthly = purchase.product.gatewayPrices.some(
      (price) => price.type === "MONTHLY"
    );

    if (hasYearly && !hasMonthly) return "Anual";
    if (hasMonthly && !hasYearly) return "Mensal";

    return "Mensal";
  };

  const translateAccountType = (type: AccountType): string => {
    const translations: Record<AccountType, string> = {
      INDEPENDENT: "Autônomo",
      BUSINESS: "Empresarial",
    };
    return translations[type] || type;
  };

  const translateUnitType = (type: ProductUnitType): string => {
    const translations: Record<ProductUnitType, string> = {
      USERS: "Usuários",
      CITIES: "Cidades",
      PROPERTY_VALUATION: "Avaliação de Imóveis",
      RESIDENT_SEARCH: "Busca de Proprietários",
      RADARS: "Radares",
    };
    return translations[type] || type;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRemainingUnits = (purchase: IGetPurchasesResponseSuccess) => {
    const units: Record<ProductUnitType, { remaining: number; total: number }> =
      {
        USERS: { remaining: 0, total: 0 },
        CITIES: { remaining: 0, total: 0 },
        PROPERTY_VALUATION: { remaining: 0, total: 0 },
        RESIDENT_SEARCH: { remaining: 0, total: 0 },
        RADARS: { remaining: 0, total: 0 },
      };

    purchase.product.units.forEach((unit) => {
      if (units[unit.type]) {
        units[unit.type].total = unit.limit;
      }
    });

    purchase.remainingUnits.forEach((unit) => {
      if (units[unit.type]) {
        units[unit.type].remaining = unit.unitsRemaining;
      }
    });
    return units;
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: theme.palette.primary.main, mb: 3 }}
        >
          Assinatura
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (purchases.length === 0) {
    return (
      <Box>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: theme.palette.primary.main, mb: 3 }}
        >
          Assinatura
        </Typography>
        <Paper
          elevation={2}
          sx={{ p: 4, borderRadius: 2, textAlign: "center" }}
        >
          <Typography variant="body1" color="text.secondary">
            Nenhuma assinatura encontrada.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const purchase = purchases[0];
  const units = getRemainingUnits(purchase);

  return (
    <Box>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 1.5 }}
      >
        Assinatura
      </Typography>

      <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {purchase.product.title}
          </Typography>
          <Chip
            label={translateProductType(purchase.product.productType)}
            color="primary"
            variant="outlined"
            size="small"
          />
          <Chip
            label={translateAccountType(purchase.product.accountType)}
            color="secondary"
            variant="outlined"
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {translateAccountType(purchase.product.accountType)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {purchase.product.description}
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 1.5 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}
        >
          Informações do Plano
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Card
            variant="outlined"
            sx={{ p: 2, backgroundColor: theme.palette.background.default }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}
            >
              Renovação
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 0.5,
              }}
            >
              {formatDate(purchase.planPeriodEnd)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Data de vencimento do seu plano atual
            </Typography>
          </Card>

          <Card
            variant="outlined"
            sx={{ p: 2, backgroundColor: theme.palette.background.default }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}
            >
              Período
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 0.5,
              }}
            >
              {getPeriodType(purchase)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Frequência de cobrança do plano
            </Typography>
          </Card>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 2, borderRadius: 2, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Créditos do seu plano
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {Object.entries(units).map(([type, data]) => (
            <Box
              key={type}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                backgroundColor: theme.palette.background.default,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                minWidth: "fit-content",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: theme.palette.text.primary }}
              >
                {translateUnitType(type as ProductUnitType)}:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: theme.palette.primary.main }}
              >
                {data.remaining} disponíveis de {data.total} contratados
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Cidades
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="small"
            sx={{ textTransform: "none", minWidth: "auto", px: 1.5, py: 0.5 }}
          >
            Adicionar
          </Button>
        </Box>

        {(purchase.chosenCityCodes && purchase.chosenCityCodes.length > 0) ||
        purchase.defaultCityStateCode ? (
          <List dense>
            {purchase.defaultCityStateCode && (
              <ListItem
                sx={{ py: 0.5 }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    size="small"
                    sx={{ p: 0.5 }}
                  >
                    <Edit sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              >
                <LocationOn
                  sx={{
                    mr: 1.5,
                    color: theme.palette.primary.main,
                    fontSize: 20,
                  }}
                />
                <ListItemText
                  primary={purchase.defaultCityStateCode}
                  secondary="Cidade padrão"
                  primaryTypographyProps={{ variant: "body2" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            )}
            {/* Cidades adicionais */}
            {purchase.chosenCityCodes &&
              purchase.chosenCityCodes.map((city, index) => (
                <ListItem
                  key={index}
                  sx={{ py: 0.5 }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      size="small"
                      sx={{ p: 0.5 }}
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  }
                >
                  <LocationOn
                    sx={{
                      mr: 1.5,
                      color: theme.palette.primary.main,
                      fontSize: 20,
                    }}
                  />
                  <ListItemText
                    primary={city}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
          </List>
        ) : (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma cidade selecionada
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
