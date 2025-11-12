import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Avatar,
  Card,
  CircularProgress,
  Alert,
  LinearProgress,
  Tooltip,
  Fade,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  ArrowBack,
  Email,
  Phone,
  Business,
  Assessment,
  Search,
  LocationOn,
  Radar,
  Warning,
  CheckCircle,
  TrendingDown,
} from "@mui/icons-material";
import { useAuth } from "../../../../modules/access-manager/auth.hook";
import {
  useGetUser,
  clearUserCache,
} from "../../../../../services/get-user.service";
import {
  useGetDashboardUser,
  type IGetDashboardUserResponseSuccess,
  clearDashboardUserCache,
} from "../../../../../services/get-dashboard-user.service";
import type { IGetUsersResponseSuccess } from "../../../../../services/get-users.service";
import {
  patchUser,
  type IPatchUserRequest,
} from "../../../../../services/patch-user.service";

interface UserDetailsProps {
  userId: string;
  onBack: () => void;
}

interface UserStats {
  propertyValuations: {
    total: number;
    remaining: number;
    used: number;
  };
  residentSearches: {
    total: number;
    remaining: number;
    used: number;
  };
  radars: {
    total: number;
    remaining: number;
    used: number;
  };
  cities: string[];
}

export function UserDetailsComponent({ userId, onBack }: UserDetailsProps) {
  const theme = useTheme();
  const { store } = useAuth();

  const [user, setUser] = useState<IGetUsersResponseSuccess | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dashboardUser, setDashboardUser] =
    useState<IGetDashboardUserResponseSuccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    personalId: "",
  });

  // Data via SWR
  const {
    data: userData,
    error: userError,
    isLoading: isLoadingUser,
  } = useGetUser(userId);
  const {
    data: dashboardData,
    error: dashboardError,
    isLoading: isLoadingDashboard,
  } = useGetDashboardUser(userId);

  // Processar dados do usuário quando disponível
  useEffect(() => {
    if (userData) {
      setUser(userData);
      setEditData({
        name: userData.name,
        personalId: userData.personalId || "",
      });
    }
    if (userError) {
      console.error("Erro ao carregar dados do usuário:", userError);
      setError("Erro ao carregar dados do usuário. Tente novamente.");
    }
  }, [userData, userError]);

  // Processar dados do dashboard quando disponível
  useEffect(() => {
    if (dashboardData) {
      setDashboardUser(dashboardData);

      // Processar dados do dashboard imediatamente
      // Pegar o primeiro item do histórico de compras (mais recente)
      const latestPurchase = dashboardData.purchaseHistory?.[0];

      // Converter cidades do formato API para formato legível
      const formatCityName = (cityCode: string) => {
        // Converter de "curitiba_pr" para "Curitiba - PR"
        const parts = cityCode.split("_");
        if (parts.length >= 2) {
          const cityName = parts[0]
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          const state = parts[parts.length - 1].toUpperCase();
          return `${cityName} - ${state}`;
        }
        return cityCode;
      };

      // Usar dados reais do remainingUnits
      const propertyValuationUnit = latestPurchase?.remainingUnits?.find(
        (unit) => unit.type === "PROPERTY_VALUATION"
      );
      const residentSearchUnit = latestPurchase?.remainingUnits?.find(
        (unit) => unit.type === "RESIDENT_SEARCH"
      );
      const radarsUnit = latestPurchase?.remainingUnits?.find(
        (unit) => unit.type === "RADARS"
      );

      const realStats: UserStats = {
        propertyValuations: {
          total: propertyValuationUnit?.unitsRemaining || 0,
          remaining: propertyValuationUnit?.unitsRemaining || 0,
          used: 0, // Não temos dados de usados, apenas restantes
        },
        residentSearches: {
          total: residentSearchUnit?.unitsRemaining || 0,
          remaining: residentSearchUnit?.unitsRemaining || 0,
          used: 0, // Não temos dados de usados, apenas restantes
        },
        radars: {
          total: radarsUnit?.unitsRemaining || 0,
          remaining: radarsUnit?.unitsRemaining || 0,
          used: 0, // Não temos dados de usados, apenas restantes
        },
        cities: latestPurchase?.chosenCities?.map(formatCityName) || [],
      };

      setUserStats(realStats);
    }
    if (dashboardError) {
      // Não bloqueia a tela se der erro; segue com dados básicos
      console.warn("Falha ao carregar dashboard do usuário", dashboardError);

      // Fallback para dados vazios se não houver dados do dashboard
      setUserStats({
        propertyValuations: { total: 0, remaining: 0, used: 0 },
        residentSearches: { total: 0, remaining: 0, used: 0 },
        radars: { total: 0, remaining: 0, used: 0 },
        cities: [],
      });
    }
  }, [dashboardData, dashboardError]);

  // Controlar estado de loading combinado
  useEffect(() => {
    setIsLoading(isLoadingUser || isLoadingDashboard);
  }, [isLoadingUser, isLoadingDashboard]);

  const handleEditUser = async () => {
    if (!store.token || !user) return;

    try {
      setIsEditing(true);
      setError(null);

      const updateData: IPatchUserRequest = {
        name: editData.name,
        personalId: editData.personalId,
      };

      await patchUser(store.token, user.id, updateData);

      // Recarregar dados
      clearUserCache(user.id);
      clearDashboardUserCache(user.id);
      setIsEditModalOpen(false);
    } catch (err) {
      setError("Erro ao atualizar dados do usuário. Tente novamente.");
      console.error("Erro ao atualizar usuário:", err);
    } finally {
      setIsEditing(false);
    }
  };

  const getStatusColor = (remaining: number, total: number) => {
    if (total === 0) return "#9e9e9e";

    const percentage = (remaining / total) * 100;

    if (percentage === 0) return "#f44336";
    if (percentage <= 20) return "#ff9800";
    if (percentage <= 50) return "#2196f3";
    return "#4caf50";
  };

  const getStatusIcon = (remaining: number, total: number) => {
    if (total === 0) return null;

    const percentage = (remaining / total) * 100;

    if (percentage === 0) return Warning;
    if (percentage <= 20) return TrendingDown;
    if (percentage <= 50) return null;
    return CheckCircle;
  };

  const getStatusLabel = (remaining: number, total: number) => {
    if (total === 0) return "Indisponível";

    const percentage = (remaining / total) * 100;

    if (percentage === 0) return "Esgotado";
    if (percentage <= 20) return "Baixo";
    if (percentage <= 50) return "Médio";
    return "Bom";
  };

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "";

    const cleaned = phone.replace(/\D/g, "");
    let phoneNumber = cleaned;

    if (cleaned.startsWith("55") && cleaned.length > 10) {
      phoneNumber = cleaned.substring(2);
    }

    if (phoneNumber.length === 11) {
      return phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (phoneNumber.length === 10) {
      return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return phone;
  };

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case "OWNER":
        return "Dono da conta";
      case "ADMIN":
        return "Administrador";
      case "MEMBER":
        return "Membro";
      default:
        return role;
    }
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={onBack} startIcon={<ArrowBack />}>
          Voltar
        </Button>
      </Box>
    );
  }

  if (!user || !userStats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          Usuário não encontrado
        </Typography>
        <Button onClick={onBack} startIcon={<ArrowBack />} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        pt: { xs: 1, sm: 2 },
        pb: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2 },
        mb: { xs: 5, md: 0 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
          gap: 2,
        }}
      >
        <IconButton onClick={onBack} sx={{ p: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
          }}
        >
          Detalhes do Usuário
        </Typography>
      </Box>

      {/* Informações do Usuário */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Avatar
            src={user.profile?.profileImgURL}
            sx={{
              width: { xs: 60, sm: 80 },
              height: { xs: 60, sm: 80 },
              bgcolor: theme.palette.primary.main,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                {user.name}
              </Typography>
              <Chip
                label={getRoleLabel(user.roles[0]?.role || "MEMBER")}
                color={user.inactive ? "error" : "success"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {/* Plano e status da conta vindos do dashboard */}
              {dashboardUser && (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Plano:
                    </Typography>
                    <Chip
                      label={
                        dashboardUser.plan
                          ? `${dashboardUser.plan.name} (${dashboardUser.plan.type})`
                          : "Sem plano"
                      }
                      color={dashboardUser.plan ? "primary" : "default"}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Status da conta:
                    </Typography>
                    <Chip
                      label={
                        dashboardUser.accountStatus === "active"
                          ? "Ativa"
                          : "Expirada"
                      }
                      color={
                        dashboardUser.accountStatus === "active"
                          ? "success"
                          : "warning"
                      }
                      size="small"
                    />
                  </Box>
                </>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Email sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography
                  variant="body2"
                  color={
                    user.profile?.email ? "text.secondary" : "text.disabled"
                  }
                  sx={{
                    fontStyle: user.profile?.email ? "normal" : "italic",
                  }}
                >
                  {user.profile?.email || "Email não informado"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography
                  variant="body2"
                  color={
                    user.profile?.phoneNumber
                      ? "text.secondary"
                      : "text.disabled"
                  }
                  sx={{
                    fontStyle: user.profile?.phoneNumber ? "normal" : "italic",
                  }}
                >
                  {user.profile?.phoneNumber
                    ? formatPhoneNumber(user.profile.phoneNumber)
                    : "Telefone não informado"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Business sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                  {user.account?.company?.name || "Empresa não informada"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setIsEditModalOpen(true)}
            size="small"
            sx={{ textTransform: "none" }}
          >
            Editar
          </Button> */}
        </Box>
      </Box>

      {/* Estatísticas do Usuário */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 3,
            color: theme.palette.text.primary,
          }}
        >
          Estatísticas de Uso
        </Typography>

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
          {/* Avaliações de Imóveis */}
          <Fade in timeout={300}>
            <Card
              sx={{
                p: 2.5,
                height: "100%",
                border: `2px solid ${getStatusColor(
                  userStats.propertyValuations.remaining,
                  userStats.propertyValuations.total
                )}20`,
                backgroundColor: `${getStatusColor(
                  userStats.propertyValuations.remaining,
                  userStats.propertyValuations.total
                )}05`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: getStatusColor(
                      userStats.propertyValuations.remaining,
                      userStats.propertyValuations.total
                    ),
                    mr: 1.5,
                    width: 40,
                    height: 40,
                  }}
                >
                  <Assessment />
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
                    Avaliações de Imóveis
                  </Typography>
                  {(() => {
                    const StatusIcon = getStatusIcon(
                      userStats.propertyValuations.remaining,
                      userStats.propertyValuations.total
                    );
                    return StatusIcon ? (
                      <Tooltip
                        title={`Status: ${getStatusLabel(
                          userStats.propertyValuations.remaining,
                          userStats.propertyValuations.total
                        )}`}
                      >
                        <StatusIcon
                          sx={{
                            fontSize: 16,
                            color: getStatusColor(
                              userStats.propertyValuations.remaining,
                              userStats.propertyValuations.total
                            ),
                          }}
                        />
                      </Tooltip>
                    ) : null;
                  })()}
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
                      color: getStatusColor(
                        userStats.propertyValuations.remaining,
                        userStats.propertyValuations.total
                      ),
                    }}
                  >
                    {userStats.propertyValuations.remaining} /{" "}
                    {userStats.propertyValuations.total}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={
                    userStats.propertyValuations.total > 0
                      ? (userStats.propertyValuations.remaining /
                          userStats.propertyValuations.total) *
                        100
                      : 0
                  }
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `${getStatusColor(
                      userStats.propertyValuations.remaining,
                      userStats.propertyValuations.total
                    )}20`,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getStatusColor(
                        userStats.propertyValuations.remaining,
                        userStats.propertyValuations.total
                      ),
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
                    color: getStatusColor(
                      userStats.propertyValuations.remaining,
                      userStats.propertyValuations.total
                    ),
                    fontWeight: 600,
                  }}
                >
                  {userStats.propertyValuations.total > 0
                    ? `${(
                        (userStats.propertyValuations.remaining /
                          userStats.propertyValuations.total) *
                        100
                      ).toFixed(0)}% restante`
                    : "0% restante"}
                </Typography>
              </Box>

              {getStatusLabel(
                userStats.propertyValuations.remaining,
                userStats.propertyValuations.total
              ) === "Esgotado" && (
                <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption">Créditos esgotados</Typography>
                </Alert>
              )}

              {getStatusLabel(
                userStats.propertyValuations.remaining,
                userStats.propertyValuations.total
              ) === "Baixo" && (
                <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption">Créditos baixos</Typography>
                </Alert>
              )}
            </Card>
          </Fade>

          {/* Buscas de Morador */}
          <Fade in timeout={400}>
            <Card
              sx={{
                p: 2.5,
                height: "100%",
                border: `2px solid ${getStatusColor(
                  userStats.residentSearches.remaining,
                  userStats.residentSearches.total
                )}20`,
                backgroundColor: `${getStatusColor(
                  userStats.residentSearches.remaining,
                  userStats.residentSearches.total
                )}05`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: getStatusColor(
                      userStats.residentSearches.remaining,
                      userStats.residentSearches.total
                    ),
                    mr: 1.5,
                    width: 40,
                    height: 40,
                  }}
                >
                  <Search />
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
                    Buscas de Morador
                  </Typography>
                  {(() => {
                    const StatusIcon = getStatusIcon(
                      userStats.residentSearches.remaining,
                      userStats.residentSearches.total
                    );
                    return StatusIcon ? (
                      <Tooltip
                        title={`Status: ${getStatusLabel(
                          userStats.residentSearches.remaining,
                          userStats.residentSearches.total
                        )}`}
                      >
                        <StatusIcon
                          sx={{
                            fontSize: 16,
                            color: getStatusColor(
                              userStats.residentSearches.remaining,
                              userStats.residentSearches.total
                            ),
                          }}
                        />
                      </Tooltip>
                    ) : null;
                  })()}
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
                      color: getStatusColor(
                        userStats.residentSearches.remaining,
                        userStats.residentSearches.total
                      ),
                    }}
                  >
                    {userStats.residentSearches.remaining} /{" "}
                    {userStats.residentSearches.total}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={
                    userStats.residentSearches.total > 0
                      ? (userStats.residentSearches.remaining /
                          userStats.residentSearches.total) *
                        100
                      : 0
                  }
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `${getStatusColor(
                      userStats.residentSearches.remaining,
                      userStats.residentSearches.total
                    )}20`,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getStatusColor(
                        userStats.residentSearches.remaining,
                        userStats.residentSearches.total
                      ),
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
                    color: getStatusColor(
                      userStats.residentSearches.remaining,
                      userStats.residentSearches.total
                    ),
                    fontWeight: 600,
                  }}
                >
                  {userStats.residentSearches.total > 0
                    ? `${(
                        (userStats.residentSearches.remaining /
                          userStats.residentSearches.total) *
                        100
                      ).toFixed(0)}% restante`
                    : "0% restante"}
                </Typography>
              </Box>

              {getStatusLabel(
                userStats.residentSearches.remaining,
                userStats.residentSearches.total
              ) === "Esgotado" && (
                <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption">Créditos esgotados</Typography>
                </Alert>
              )}

              {getStatusLabel(
                userStats.residentSearches.remaining,
                userStats.residentSearches.total
              ) === "Baixo" && (
                <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption">Créditos baixos</Typography>
                </Alert>
              )}
            </Card>
          </Fade>

          {/* Radares */}
          <Fade in timeout={500}>
            <Card
              sx={{
                p: 2.5,
                height: "100%",
                border: `2px solid ${getStatusColor(
                  userStats.radars.remaining,
                  userStats.radars.total
                )}20`,
                backgroundColor: `${getStatusColor(
                  userStats.radars.remaining,
                  userStats.radars.total
                )}05`,
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: getStatusColor(
                      userStats.radars.remaining,
                      userStats.radars.total
                    ),
                    mr: 1.5,
                    width: 40,
                    height: 40,
                  }}
                >
                  <Radar />
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
                    Radares
                  </Typography>
                  {(() => {
                    const StatusIcon = getStatusIcon(
                      userStats.radars.remaining,
                      userStats.radars.total
                    );
                    return StatusIcon ? (
                      <Tooltip
                        title={`Status: ${getStatusLabel(
                          userStats.radars.remaining,
                          userStats.radars.total
                        )}`}
                      >
                        <StatusIcon
                          sx={{
                            fontSize: 16,
                            color: getStatusColor(
                              userStats.radars.remaining,
                              userStats.radars.total
                            ),
                          }}
                        />
                      </Tooltip>
                    ) : null;
                  })()}
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
                      color: getStatusColor(
                        userStats.radars.remaining,
                        userStats.radars.total
                      ),
                    }}
                  >
                    {userStats.radars.remaining} / {userStats.radars.total}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={
                    userStats.radars.total > 0
                      ? (userStats.radars.remaining / userStats.radars.total) *
                        100
                      : 0
                  }
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `${getStatusColor(
                      userStats.radars.remaining,
                      userStats.radars.total
                    )}20`,
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getStatusColor(
                        userStats.radars.remaining,
                        userStats.radars.total
                      ),
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
                    color: getStatusColor(
                      userStats.radars.remaining,
                      userStats.radars.total
                    ),
                    fontWeight: 600,
                  }}
                >
                  {userStats.radars.total > 0
                    ? `${(
                        (userStats.radars.remaining / userStats.radars.total) *
                        100
                      ).toFixed(0)}% restante`
                    : "0% restante"}
                </Typography>
              </Box>

              {getStatusLabel(
                userStats.radars.remaining,
                userStats.radars.total
              ) === "Esgotado" && (
                <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption">Créditos esgotados</Typography>
                </Alert>
              )}

              {getStatusLabel(
                userStats.radars.remaining,
                userStats.radars.total
              ) === "Baixo" && (
                <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                  <Typography variant="caption">Créditos baixos</Typography>
                </Alert>
              )}
            </Card>
          </Fade>
        </Box>

        {/* Cidades */}
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Cidades com Acesso
          </Typography>

          {userStats.cities.length > 0 ? (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {userStats.cities.map((city, index) => (
                <Chip
                  key={index}
                  icon={<LocationOn />}
                  label={city}
                  variant="outlined"
                  sx={{
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nenhuma cidade com acesso
            </Typography>
          )}
        </Box>
      </Box>

      {/* Modal de Edição */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            variant="outlined"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="CPF/CNPJ"
            fullWidth
            variant="outlined"
            value={editData.personalId}
            onChange={(e) =>
              setEditData({ ...editData, personalId: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsEditModalOpen(false)}
            disabled={isEditing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEditUser}
            variant="contained"
            disabled={!editData.name || isEditing}
          >
            {isEditing ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                Salvando...
              </Box>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
