import { useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  Avatar,
} from "@mui/material";
import { Check, Star, TrendingUp, Business, Person } from "@mui/icons-material";

export function UpgradeSection() {
  const theme = useTheme();

  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [accountType, setAccountType] = useState<"autonomous" | "business">(
    "autonomous"
  );

  const plans = {
    basic: {
      title: "Básico",
      description:
        "Se diferencie do mercado, seja um(a) corretor(a) inteligente e comece a impulsionar seu negócio.",
      monthlyPrice: 67.9,
      annualPrice: 746.5,
      monthlyfeatures: [
        "150 consultas de proprietários",
        "15 laudos de avaliação",
        "10 radar de oportunidades",
        "2 cidades",
      ],
      annualfeatures: [
        "1800 consultas de proprietários",
        "180 laudos de avaliação",
        "120 radar de oportunidades",
        "2 cidades",
      ],
    },
    medium: {
      title: "Médio",
      description:
        "Dê um upgrade na sua conta e adquira recursos mais avançados do mercado para suprir suas demandas.",
      monthlyPrice: 127.9,
      annualPrice: 1366.0,
      monthlyfeatures: [
        "300 consultas de proprietários",
        "30 laudos de avaliação",
        "30 radar de oportunidades",
        "4 cidades",
      ],
      annualfeatures: [
        "3600 consultas de proprietários",
        "360 laudos de avaliação",
        "360 radar de oportunidades",
        "4 cidades",
      ],
      recommended: true,
    },
    pro: {
      title: "Pró",
      description:
        "A solução completa para corretores experientes que querem dominar o mercado e vender em larga escala.",
      monthlyPrice: 207.9,
      annualPrice: 2220.0,
      monthlyfeatures: [
        "500 consultas de proprietários",
        "45 laudos de avaliação",
        "45 radar de oportunidades",
        "10 cidades",
      ],
      annualfeatures: [
        "6000 consultas de proprietários",
        "540 laudos de avaliação",
        "540 radar de oportunidades",
        "10 cidades",
      ],
    },
    bussinessbasic: {
      title: "Básico",
      description:
        "Se diferencie do mercado, seja uma imobiliária inteligente e comece a impulsionar seu negócio.",
      monthlyPrice: 117.9,
      annualPrice: 1259.0,
      monthlyfeatures: [
        "200 consultas de proprietários",
        "30 laudos de avaliação",
        "30 radar de oportunidades",
        "5 cidades",
      ],
      annualfeatures: [
        "2400 consultas de proprietários",
        "360 laudos de avaliação",
        "360 radar de oportunidades",
        "5 cidades",
      ],
    },
    bussinessmedium: {
      title: "Médio",
      description:
        "O essencial para sua empresa, gerencie seu time de corretores e desfrute do que há de mais tecnológico no mercado.",
      monthlyPrice: 127.9,
      annualPrice: 2433.0,
      monthlyfeatures: [
        "400 consultas de proprietários",
        "60 laudos de avaliação",
        "60 radar de oportunidades",
        "10 cidades",
      ],
      annualfeatures: [
        "4800 consultas de proprietários",
        "720 laudos de avaliação",
        "720 radar de oportunidades",
        "10 cidades",
      ],
    },
    bussinesspro: {
      title: "Pró",
      description:
        "A solução completa para corretores experientes que querem dominar o mercado e vender em larga escala.",
      monthlyPrice: 447.9,
      annualPrice: 4783.0,
      monthlyfeatures: [
        "800 consultas de proprietários",
        "120 laudos de avaliação",
        "120 radar de oportunidades",
        "10 cidades",
      ],
      annualfeatures: [
        "9600 consultas de proprietários",
        "1440 laudos de avaliação",
        "1440 radar de oportunidades",
        "10 cidades",
      ],
      recommended: true,
    },
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getCurrentPrice = (plan: typeof plans.basic) => {
    return period === "annual" ? plan.annualPrice : plan.monthlyPrice;
  };

  const getPriceText = (plan: typeof plans.basic) => {
    const price = getCurrentPrice(plan);
    const periodText = period === "annual" ? "ano" : "mês";
    return `${formatPrice(price)} / ${periodText}`;
  };

  const getAccountTypeText = () => {
    return accountType === "business" ? "Imobiliária" : "Autônomo";
  };

  type PlanType = {
    title: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    monthlyfeatures: string[];
    annualfeatures: string[];
    recommended?: boolean;
  };

  const getCurrentFeatures = (plan: PlanType) => {
    return period === "annual" ? plan.annualfeatures : plan.monthlyfeatures;
  };

  const getCurrentPlans = (): PlanType[] => {
    if (accountType === "business") {
      return [plans.bussinessbasic, plans.bussinessmedium, plans.bussinesspro];
    }
    return [plans.basic, plans.medium, plans.pro];
  };

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
        Escolha seu Plano
      </Typography>

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      >
        {/* Configurações do Plano */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}
          >
            Configurações do Plano
          </Typography>

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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        mr: 1.5,
                        width: 40,
                        height: 40,
                      }}
                    >
                      <TrendingUp sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Período
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    value={period}
                    exclusive
                    onChange={(_, newValue) => newValue && setPeriod(newValue)}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="monthly">Mensal</ToggleButton>
                    <ToggleButton value="annual">Anual</ToggleButton>
                  </ToggleButtonGroup>
                  {period === "annual" && (
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      💰 Economize até 20%
                    </Typography>
                  )}
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        mr: 1.5,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {accountType === "business" ? (
                        <Business sx={{ fontSize: 20 }} />
                      ) : (
                        <Person
                          sx={{
                            fontSize: 20,
                            color: theme.palette.secondary.main,
                          }}
                        />
                      )}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Tipo de Conta
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    value={accountType}
                    exclusive
                    onChange={(_, newValue) =>
                      newValue && setAccountType(newValue)
                    }
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="autonomous">Autônomo</ToggleButton>
                    <ToggleButton value="business">Imobiliária</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Stack>
            </Card>
          </Fade>
        </Box>
      </Box>

      {/* Planos Disponíveis */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}
        >
          Planos Disponíveis
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            width: "100%",
          }}
        >
          {getCurrentPlans().map((plan: PlanType, index: number) => {
            const isRecommended = plan.recommended;
            const isPro = index === 2;

            return (
              <Box key={plan.title} sx={{ position: "relative" }}>
                {isRecommended && (
                  <Chip
                    icon={<Star />}
                    label="Recomendado"
                    color="primary"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontWeight: 600,
                      zIndex: 10,
                    }}
                  />
                )}

                <Fade in timeout={300 + index * 100}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: isRecommended
                        ? `2px solid ${theme.palette.primary.main}`
                        : isPro
                        ? `2px solid ${theme.palette.secondary.main}`
                        : `2px solid ${theme.palette.divider}`,
                      background: isPro
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`
                        : isRecommended
                        ? `${theme.palette.primary.main}05`
                        : undefined,
                      pt: isRecommended ? 2 : 0,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: isPro ? theme.shadows[12] : theme.shadows[8],
                        borderColor: isRecommended
                          ? theme.palette.primary.main
                          : isPro
                          ? theme.palette.secondary.main
                          : theme.palette.primary.main,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 2,
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {getAccountTypeText()} {plan.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, flexGrow: 1 }}
                      >
                        {plan.description}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                          }}
                        >
                          {getPriceText(plan)}
                        </Typography>
                        {period === "annual" && (
                          <Typography variant="caption" color="success.main">
                            Economia de{" "}
                            {formatPrice(
                              plan.monthlyPrice * 12 - plan.annualPrice
                            )}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          Incluído:
                        </Typography>
                        <Stack spacing={0.5}>
                          {getCurrentFeatures(plan).map(
                            (feature: string, index: number) => (
                              <Box
                                key={index}
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Check
                                  sx={{
                                    color: "success.main",
                                    fontSize: 16,
                                    mr: 1,
                                  }}
                                />
                                <Typography variant="caption">
                                  {feature}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Stack>
                      </Box>

                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="small"
                        sx={{
                          mt: "auto",
                          textTransform: "none",
                          fontWeight: 600,
                          py: 1.5,
                        }}
                      >
                        Escolher Plano
                      </Button>
                    </CardContent>
                  </Card>
                </Fade>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
