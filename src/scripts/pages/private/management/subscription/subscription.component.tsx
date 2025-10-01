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
import { postPurchasesAddCity } from "../../../../../services/post-purchases-add-city.service";
import { AddCitiesModal } from "../../../../library/components/add-cities-modal";

export function SubscriptionSection() {
  const theme = useTheme();
  const { store } = useAuth();

  const [purchases, setPurchases] = useState<IGetPurchasesResponseSuccess[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddCitiesModalOpen, setIsAddCitiesModalOpen] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [addCityError, setAddCityError] = useState<string | null>(null);

  const handleSaveCities = async (cities: string[]) => {
    if (!store.token || purchases.length === 0) return;

    const purchase = purchases[0];
    setIsAddingCity(true);
    setAddCityError(null);

    try {
      const city = cities[0];
      const addCityResponse = await postPurchasesAddCity(
        purchase.id,
        city,
        store.token
      );

      if ((addCityResponse.data as { status?: number })?.status === 402) {
        const errorMessage =
          "Você esgotou seus créditos. Por favor, adquira créditos adicionais para adicionar uma nova cidade.";
        setAddCityError(errorMessage);
        return;
      }

      const response = await getPurchases(store.token);
      setPurchases(response.data);
    } catch (err: unknown) {
      console.error("Erro ao adicionar cidade:", err);

      let errorMessage = "Erro ao adicionar cidade. Tente novamente.";

      const axiosError = err as {
        response?: { status?: number; data?: { message?: string } };
      };

      if (
        (axiosError.response?.data as { status?: number })?.status === 402 ||
        axiosError.response?.status === 402
      ) {
        errorMessage =
          "Você esgotou seus créditos. Por favor, adquira créditos adicionais para adicionar uma nova cidade.";
      } else if (axiosError.response?.status === 409) {
        errorMessage = "Esta cidade já foi adicionada anteriormente.";
      } else if (axiosError.response?.status === 422) {
        errorMessage = "Limite de cidades atingido para seu plano.";
      } else if (axiosError.response?.status === 404) {
        errorMessage = "Compra não encontrada.";
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }

      setAddCityError(errorMessage);
    } finally {
      setIsAddingCity(false);
    }
  };

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
      CUSTOM_PLAN: "Personalizado",
      TRIAL_PLAN: "Teste",
      CREDIT_PACKAGE: "Créditos",
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
    <Box sx={{ width: "100%", maxWidth: "100%", pb: 4 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 1.5 }}
      >
        Assinatura
      </Typography>

      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 1.5, width: "100%" }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            mb: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 1,
                wordBreak: "break-word",
              }}
            >
              {purchase.product.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {purchase.product.description}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <Chip
              label={translateProductType(purchase.product.productType)}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={translateAccountType(purchase.product.accountType)}
              color="secondary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 1.5, width: "100%" }}
      >
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

      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 1.5, width: "100%" }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Créditos do seu plano
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
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

      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, width: "100%" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Cidades
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="small"
            onClick={() => setIsAddCitiesModalOpen(true)}
            sx={{
              textTransform: "none",
              minWidth: "auto",
              px: 1.5,
              py: 0.5,
              width: { xs: "100%", sm: "auto" },
            }}
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

      <AddCitiesModal
        open={isAddCitiesModalOpen}
        onClose={() => {
          setIsAddCitiesModalOpen(false);
          setAddCityError(null);
        }}
        onSave={handleSaveCities}
        existingCities={
          purchases.length > 0 ? purchases[0].chosenCityCodes : []
        }
        isLoading={isAddingCity}
        apiError={addCityError}
      />
    </Box>
  );
}
