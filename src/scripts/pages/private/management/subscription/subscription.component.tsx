import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Chip,
  Card,
  CardContent,
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

  // Carregar dados das compras
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
    // Verificar se há gateway prices para determinar se é mensal ou anual
    const hasYearly = purchase.product.gatewayPrices.some(
      (price) => price.type === "YEARLY"
    );
    const hasMonthly = purchase.product.gatewayPrices.some(
      (price) => price.type === "MONTHLY"
    );

    // Lógica para determinar o período baseado nos dados disponíveis
    if (hasYearly && !hasMonthly) return "Anual";
    if (hasMonthly && !hasYearly) return "Mensal";

    // Fallback: assumir mensal se não conseguir determinar
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

    // Preencher totais com os limites do produto
    purchase.product.units.forEach((unit) => {
      if (units[unit.type]) {
        units[unit.type].total = unit.limit;
      }
    });

    // Preencher valores restantes
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

  const purchase = purchases[0]; // Assumindo que há apenas uma compra ativa
  const units = getRemainingUnits(purchase);

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 3 }}
      >
        Assinatura
      </Typography>

      {/* Seção 1: Tipo de Produto e Conta */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {purchase.product.title}
          </Typography>
          <Chip
            label={translateProductType(purchase.product.productType)}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={translateAccountType(purchase.product.accountType)}
            color="secondary"
            variant="outlined"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {translateAccountType(purchase.product.accountType)}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {purchase.product.description}
        </Typography>
      </Paper>

      {/* Seção 2: Renovação e Período */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2, mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}
        >
          Informações do Plano
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 4,
          }}
        >
          {/* Card de Renovação */}
          <Card
            variant="outlined"
            sx={{ p: 3, backgroundColor: theme.palette.background.default }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: theme.palette.text.primary }}
              >
                Renovação
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}
            >
              {formatDate(purchase.planPeriodEnd)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data de vencimento do seu plano atual
            </Typography>
          </Card>

          {/* Card de Período */}
          <Card
            variant="outlined"
            sx={{ p: 3, backgroundColor: theme.palette.background.default }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: theme.palette.text.primary }}
              >
                Período
              </Typography>
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}
            >
              {getPeriodType(purchase)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Frequência de cobrança do plano
            </Typography>
          </Card>
        </Box>
      </Paper>

      {/* Seção 3: Créditos do Plano */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Créditos do seu plano
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {Object.entries(units).map(([type, data]) => (
            <Card
              variant="outlined"
              key={type}
              sx={{ minWidth: 200, flex: "1 1 200px" }}
            >
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {translateUnitType(type as ProductUnitType)}
                </Typography>
                <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                  {data.remaining}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  disponíveis de {data.total} contratados
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Paper>

      {/* Seção 4: Cidades */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Cidades
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ textTransform: "none" }}
          >
            Adicionar Cidade
          </Button>
        </Box>

        {(purchase.chosenCityCodes && purchase.chosenCityCodes.length > 0) ||
        purchase.defaultCityStateCode ? (
          <List>
            {/* Cidade padrão */}
            {purchase.defaultCityStateCode && (
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="edit">
                    <Edit />
                  </IconButton>
                }
              >
                <LocationOn sx={{ mr: 2, color: theme.palette.primary.main }} />
                <ListItemText
                  primary={purchase.defaultCityStateCode}
                  secondary="Cidade padrão"
                />
              </ListItem>
            )}
            {/* Cidades adicionais */}
            {purchase.chosenCityCodes &&
              purchase.chosenCityCodes.map((city, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" aria-label="edit">
                      <Edit />
                    </IconButton>
                  }
                >
                  <LocationOn
                    sx={{ mr: 2, color: theme.palette.primary.main }}
                  />
                  <ListItemText primary={city} />
                </ListItem>
              ))}
          </List>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Nenhuma cidade selecionada
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
