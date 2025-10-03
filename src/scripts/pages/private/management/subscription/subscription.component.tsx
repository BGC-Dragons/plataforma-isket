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
  LinearProgress,
  Avatar,
  Tooltip,
  Fade,
} from "@mui/material";
import {
  Edit,
  Add,
  LocationOn,
  People,
  Business,
  Assessment,
  Search,
  Radar,
  Warning,
  CheckCircle,
  TrendingDown,
  Schedule,
} from "@mui/icons-material";
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
import { EditCityModal } from "../../../../library/components/edit-city-modal";

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
  const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [isEditingCity, setIsEditingCity] = useState(false);

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

  const handleEditCity = (cityCode: string) => {
    setEditingCity(cityCode);
    setIsEditCityModalOpen(true);
  };

  const handleSaveEditedCity = async (newCity: string) => {
    if (!store.token || purchases.length === 0 || !editingCity) return;

    setIsEditingCity(true);
    try {
      // Aqui você implementaria a lógica para atualizar a cidade
      // Por enquanto, vou apenas fechar o modal
      console.log("Editando cidade:", editingCity, "para:", newCity);

      // Simular chamada da API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Recarregar dados
      const response = await getPurchases(store.token);
      setPurchases(response.data);

      setIsEditCityModalOpen(false);
      setEditingCity(null);
    } catch (err) {
      console.error("Erro ao editar cidade:", err);
    } finally {
      setIsEditingCity(false);
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

  const formatCityName = (cityName: string, stateAcronym: string): string => {
    // Converte o nome da cidade para o formato correto (primeira letra maiúscula, resto minúsculo)
    const formattedCity = cityName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return `${formattedCity} - ${stateAcronym}`;
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

  const getCreditStatus = (remaining: number, total: number) => {
    if (total === 0)
      return { status: "unavailable", color: "grey", icon: null };

    const percentage = (remaining / total) * 100;

    if (percentage === 0)
      return { status: "exhausted", color: "error", icon: Warning };
    if (percentage <= 20)
      return { status: "low", color: "warning", icon: TrendingDown };
    if (percentage <= 50)
      return { status: "medium", color: "info", icon: null };
    return { status: "good", color: "success", icon: CheckCircle };
  };

  const getCreditIcon = (type: ProductUnitType) => {
    const icons = {
      USERS: People,
      CITIES: LocationOn,
      PROPERTY_VALUATION: Assessment,
      RESIDENT_SEARCH: Search,
      RADARS: Radar,
    };
    return icons[type] || Business;
  };

  const getCreditColor = (status: string) => {
    const colors = {
      exhausted: "#f44336",
      low: "#ff9800",
      medium: "#2196f3",
      good: "#4caf50",
      unavailable: "#9e9e9e",
    };
    return colors[status as keyof typeof colors] || "#9e9e9e";
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
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        pt: 2,
        pb: 4,
        pl: 2,
        pr: 2,
        mb: { xs: 5, md: 0 },
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 3 }}
      >
        Assinatura
      </Typography>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Informações do Produto */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            mb: 3,
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

        {/* Informações do Plano */}
        <Box sx={{ mb: 3, mt: 3 }}>
          <Box
            sx={{
              pb: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              pt: 2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}
            >
              Informações do Plano
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {/* Card de Renovação */}
            <Fade in timeout={400}>
              <Card
                sx={{
                  p: 2.5,
                  height: "100%",
                  border: `2px solid ${theme.palette.primary.main}20`,
                  backgroundColor: `${theme.palette.primary.main}05`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      mr: 1.5,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                      📅
                    </Typography>
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      Renovação
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Data de vencimento
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 1,
                    textAlign: "center",
                  }}
                >
                  {formatDate(purchase.planPeriodEnd)}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Próxima cobrança
                  </Typography>
                </Box>
              </Card>
            </Fade>

            {/* Card de Período */}
            <Fade in timeout={500}>
              <Card
                sx={{
                  p: 2.5,
                  height: "100%",
                  border: `2px solid ${theme.palette.secondary.main}20`,
                  backgroundColor: `${theme.palette.secondary.main}05`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[4],
                    borderColor: theme.palette.secondary.main,
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.secondary.main,
                      mr: 1.5,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Schedule
                      sx={{
                        fontSize: 40,
                        color: theme.palette.secondary.main,
                        backgroundColor: theme.palette.primary.main,
                      }}
                    />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      Período
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Frequência de cobrança
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    mb: 1,
                    textAlign: "center",
                  }}
                >
                  {getPeriodType(purchase)}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {getPeriodType(purchase) === "Anual"
                      ? "Cobrança anual"
                      : "Cobrança mensal"}
                  </Typography>
                </Box>
              </Card>
            </Fade>
          </Box>
        </Box>

        {/* Créditos do Plano */}
        <Box sx={{ mb: 3, mt: 3 }}>
          <Box
            sx={{
              pb: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              pt: 2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}
            >
              Créditos do seu plano
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {Object.entries(units).map(([type, data]) => {
              const status = getCreditStatus(data.remaining, data.total);
              const IconComponent = getCreditIcon(type as ProductUnitType);
              const StatusIcon = status.icon;
              const percentage =
                data.total > 0 ? (data.remaining / data.total) * 100 : 0;

              return (
                <Box key={type}>
                  <Fade in timeout={300}>
                    <Card
                      sx={{
                        p: 2,
                        height: "100%",
                        border: `2px solid ${getCreditColor(status.status)}20`,
                        backgroundColor: `${getCreditColor(status.status)}05`,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: theme.shadows[4],
                          borderColor: getCreditColor(status.status),
                        },
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: getCreditColor(status.status),
                            mr: 1.5,
                            width: 40,
                            height: 40,
                          }}
                        >
                          <IconComponent />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5,
                            }}
                          >
                            {translateUnitType(type as ProductUnitType)}
                          </Typography>
                          {StatusIcon && (
                            <Tooltip title={`Status: ${status.status}`}>
                              <StatusIcon
                                sx={{
                                  fontSize: 16,
                                  color: getCreditColor(status.status),
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Disponível
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: getCreditColor(status.status),
                            }}
                          >
                            {data.remaining} / {data.total}
                          </Typography>
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: `${getCreditColor(
                              status.status
                            )}20`,
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: getCreditColor(status.status),
                              borderRadius: 4,
                            },
                          }}
                        />

                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            textAlign: "right",
                            mt: 0.5,
                            color: getCreditColor(status.status),
                            fontWeight: 600,
                          }}
                        >
                          {percentage.toFixed(0)}% restante
                        </Typography>
                      </Box>

                      {status.status === "exhausted" && (
                        <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            Créditos esgotados
                          </Typography>
                        </Alert>
                      )}

                      {status.status === "low" && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            Créditos baixos
                          </Typography>
                        </Alert>
                      )}
                    </Card>
                  </Fade>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Cidades */}
        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 2, sm: 0 },
              pb: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              pt: 2,
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
                      onClick={() =>
                        handleEditCity(purchase.defaultCityStateCode)
                      }
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
                    primary={(() => {
                      const cityParts =
                        purchase.defaultCityStateCode.split("_");
                      const cityName = cityParts
                        .slice(0, -1)
                        .join(" ")
                        .toUpperCase();
                      const stateAcronym =
                        cityParts[cityParts.length - 1].toUpperCase();
                      return formatCityName(cityName, stateAcronym);
                    })()}
                    secondary="Cidade padrão"
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              )}
              {/* Cidades adicionais */}
              {purchase.chosenCityCodes &&
                [...purchase.chosenCityCodes]
                  .sort((a, b) => a.localeCompare(b, "pt-BR"))
                  .map((city, index) => {
                    // Extrai nome da cidade e estado do cityStateCode
                    const cityParts = city.split("_");
                    const cityName = cityParts
                      .slice(0, -1)
                      .join(" ")
                      .toUpperCase();
                    const stateAcronym =
                      cityParts[cityParts.length - 1].toUpperCase();

                    return (
                      <ListItem
                        key={index}
                        sx={{ py: 0.5 }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            size="small"
                            sx={{ p: 0.5 }}
                            onClick={() => handleEditCity(city)}
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
                          primary={formatCityName(cityName, stateAcronym)}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    );
                  })}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhuma cidade selecionada
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <EditCityModal
        open={isEditCityModalOpen}
        onClose={() => {
          setIsEditCityModalOpen(false);
          setEditingCity(null);
        }}
        onSave={handleSaveEditedCity}
        currentCity={
          editingCity
            ? (() => {
                const cityParts = editingCity.split("_");
                const cityName = cityParts.slice(0, -1).join(" ").toUpperCase();
                const stateAcronym =
                  cityParts[cityParts.length - 1].toUpperCase();
                return formatCityName(cityName, stateAcronym);
              })()
            : ""
        }
        isLoading={isEditingCity}
      />

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
