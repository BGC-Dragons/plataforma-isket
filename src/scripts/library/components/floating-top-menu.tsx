import { useState, useEffect } from "react";
import {
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  Button,
  Tooltip,
  Popper,
} from "@mui/material";
import {
  Analytics,
  Search,
  AddHome,
  Assessment,
  Settings,
  Logout,
  HomeWork,
  People,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../modules/access-manager/auth.hook";
import {
  useGetAuthMe,
  type IGetAuthMeResponseSuccess,
} from "../../../services/get-auth-me.service";
import {
  useGetPurchases,
  type IGetPurchasesResponseSuccess,
} from "../../../services/get-purchases.service";
import isketLogo from "../../../assets/simbolo-isket.svg";

export function FloatingTopMenu() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, store } = useAuth();
  const isSmallScreen = useMediaQuery("(max-width: 1200px)");
  const isVerySmallScreen = useMediaQuery("(max-width: 1084px)");
  const isExtraSmallScreen = useMediaQuery("(max-width: 920px)");
  const isTinyScreen = useMediaQuery("(max-width: 515px)");

  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [profileInfo, setProfileInfo] =
    useState<IGetAuthMeResponseSuccess | null>(null);
  const [purchases, setPurchases] = useState<IGetPurchasesResponseSuccess[]>(
    []
  );
  const [usagePopupAnchor, setUsagePopupAnchor] = useState<HTMLElement | null>(
    null
  );
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  // Data via SWR
  const { data: meData } = useGetAuthMe();
  const { data: purchasesData } = useGetPurchases();
  useEffect(() => {
    if (meData) setProfileInfo(meData);
  }, [meData]);
  useEffect(() => {
    if (purchasesData) setPurchases(purchasesData);
  }, [purchasesData]);

  const allMenuItems = [
    {
      text: "Análises",
      icon: <Analytics />,
      path: "/analises",
    },
    {
      text: "Pesquisar Anúncios",
      icon: <Search />,
      path: "/pesquisar-anuncios",
    },
    {
      text: "Captação",
      icon: <AddHome />,
      path: "/captacao",
    },
    {
      text: "Avaliação",
      icon: <Assessment />,
      path: "/avaliacao",
    },
  ];

  const menuItems = allMenuItems;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    setProfileMenuAnchor(null);
    logout();
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleSettingsClick = () => {
    navigate("/configuracoes");
  };

  // O botão "Assinar Plano" aparece quando não há plano ou quando o plano é TRIAL_PLAN
  const hasActivePlan =
    purchases[0].product.productType !== "TRIAL_PLAN";

  // Função para obter unidades restantes
  const getRemainingUnits = () => {
    if (purchases.length === 0)
      return { propertyValuation: 0, residentSearch: 0 };

    const purchase = purchases[0]; // Assumindo que há apenas uma compra ativa
    const propertyValuation =
      purchase.remainingUnits.find((unit) => unit.type === "PROPERTY_VALUATION")
        ?.unitsRemaining || 0;

    const residentSearch =
      purchase.remainingUnits.find((unit) => unit.type === "RESIDENT_SEARCH")
        ?.unitsRemaining || 0;

    return { propertyValuation, residentSearch };
  };

  const handleIconHover = (
    event: React.MouseEvent<HTMLElement>,
    iconType: string
  ) => {
    setUsagePopupAnchor(event.currentTarget);
    setHoveredIcon(iconType);
  };

  const handleIconLeave = () => {
    setUsagePopupAnchor(null);
    setHoveredIcon(null);
  };

  return (
    <>
      {/* Box branco de fundo para bloquear conteúdo */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: { xs: 76, sm: 84 },
          backgroundColor: theme.palette.background.default,
          zIndex: theme.zIndex.appBar,
        }}
      />

      {/* Container flutuante */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "none",
          zIndex: theme.zIndex.appBar + 1,
          filter:
            "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.07)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.06))",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "rgba(255, 255, 255, 1)",
            backdropFilter: "blur(20px) saturate(180%)",
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}20`,
            boxShadow: `
                     0 4px 6px -1px rgba(0, 0, 0, 0.1),
                     0 2px 4px -1px rgba(0, 0, 0, 0.06),
                     0 20px 25px -5px rgba(0, 0, 0, 0.1),
                     0 10px 10px -5px rgba(0, 0, 0, 0.04)
                   `,
            overflow: "hidden",
            position: "relative",
            // Fallback para navegadores que não suportam backdrop-filter
            "@supports not (backdrop-filter: blur(20px))": {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <Toolbar
            sx={{
              minHeight: { xs: 60, sm: 68 },
              px: { xs: 3, sm: 4 },
              py: 1,
              justifyContent: "space-between",
              backgroundColor: "transparent",
            }}
          >
            {/* Logo e Nome da Aplicação - Apenas em telas maiores que 515px */}
            {!isTinyScreen && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/pesquisar-anuncios")}
                >
                  <img
                    src={isketLogo}
                    alt="isket"
                    style={{
                      width: "40px",
                      height: "40px",
                    }}
                  />
                </Box>

                {/* Linha separadora */}
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 32,
                    alignSelf: "center",
                    borderColor: theme.palette.divider,
                    mx: 2,
                  }}
                />
              </>
            )}

            {/* Menu de Navegação */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: 1,
                justifyContent: "flex-start",
                ml: 2,
              }}
            >
              {menuItems.map((item) => (
                <Tooltip key={item.text} title={item.text} arrow>
                  <Button
                    onClick={() => handleNavigation(item.path)}
                    startIcon={!isExtraSmallScreen ? item.icon : undefined}
                    sx={{
                      color: isActiveRoute(item.path)
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                      backgroundColor: isActiveRoute(item.path)
                        ? theme.palette.primary.main + "10"
                        : "transparent",
                      borderRadius: 2,
                      px: isExtraSmallScreen ? 1.5 : 2.5,
                      py: isExtraSmallScreen ? 1 : 1.5,
                      minWidth: "auto",
                      textTransform: "none",
                      fontWeight: isActiveRoute(item.path) ? 600 : 500,
                      fontSize: "0.9rem",
                      position: "relative",
                      "&:hover": {
                        backgroundColor: isActiveRoute(item.path)
                          ? theme.palette.primary.main + "20"
                          : theme.palette.action.hover,
                        color: isActiveRoute(item.path)
                          ? theme.palette.primary.dark
                          : theme.palette.text.primary,
                      },
                      "&::after": isActiveRoute(item.path)
                        ? {
                            content: '""',
                            position: "absolute",
                            bottom: -1,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "80%",
                            height: 3,
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: "2px 2px 0 0",
                          }
                        : {},
                      transition: "all 0.2s ease",
                      "& .MuiButton-startIcon": {
                        fontSize: "1.25rem",
                      },
                    }}
                  >
                    {isExtraSmallScreen ? (
                      <Box
                        sx={{
                          fontSize: "1.25rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {item.icon}
                      </Box>
                    ) : (
                      item.text
                    )}
                  </Button>
                </Tooltip>
              ))}
            </Box>

            {/* Menu Mobile e Configurações */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Ícones de Uso - Apenas em telas maiores que 1200px */}
              {!isSmallScreen && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {/* Ícone Avaliação Imobiliária */}
                  <Box
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      p: 1,
                      borderRadius: 1,
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      handleIconHover(e, "propertyValuation")
                    }
                    onMouseLeave={handleIconLeave}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: "1.25rem",
                        "&:hover": {
                          backgroundColor: "transparent",
                          color: theme.palette.text.primary,
                        },
                      }}
                    >
                      <HomeWork />
                    </IconButton>

                    {/* Popup para Avaliação Imobiliária */}
                    <Popper
                      open={
                        hoveredIcon === "propertyValuation" &&
                        Boolean(usagePopupAnchor)
                      }
                      anchorEl={usagePopupAnchor}
                      placement="bottom"
                      sx={{ zIndex: theme.zIndex.appBar + 2 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          minWidth: 200,
                          borderRadius: 2,
                          boxShadow: theme.shadows[8],
                          border: `1px solid ${theme.palette.divider}20`,
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5,
                            }}
                          >
                            Avaliação Imobiliária
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Restam {getRemainingUnits().propertyValuation}
                          </Typography>
                        </Box>
                      </Paper>
                    </Popper>
                  </Box>

                  {/* Ícone Pesquisa de Proprietários */}
                  <Box
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      p: 1,
                      borderRadius: 1,
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => handleIconHover(e, "residentSearch")}
                    onMouseLeave={handleIconLeave}
                  >
                    <IconButton
                      size="small"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: "1.25rem",
                        "&:hover": {
                          backgroundColor: "transparent",
                          color: theme.palette.text.primary,
                        },
                      }}
                    >
                      <People />
                    </IconButton>

                    {/* Popup para Pesquisa de Proprietários */}
                    <Popper
                      open={
                        hoveredIcon === "residentSearch" &&
                        Boolean(usagePopupAnchor)
                      }
                      anchorEl={usagePopupAnchor}
                      placement="bottom"
                      sx={{ zIndex: theme.zIndex.appBar + 2 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          minWidth: 200,
                          borderRadius: 2,
                          boxShadow: theme.shadows[8],
                          border: `1px solid ${theme.palette.divider}20`,
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                              mb: 0.5,
                            }}
                          >
                            Pesquisa de Proprietários
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: theme.palette.text.secondary,
                            }}
                          >
                            Restam {getRemainingUnits().residentSearch}
                          </Typography>
                        </Box>
                      </Paper>
                    </Popper>
                  </Box>
                </Box>
              )}

              {/* Divider - Apenas se o botão Assinar Plano estiver visível */}
              {!isVerySmallScreen && !hasActivePlan && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 32,
                    alignSelf: "center",
                    borderColor: theme.palette.divider,
                    mx: 1,
                  }}
                />
              )}

              {/* Botão Assinar Plano - Apenas em telas maiores que 1084px */}
              {!isVerySmallScreen && !hasActivePlan && (
                <Button
                  variant="contained"
                  onClick={() => navigate("/configuracoes?section=upgrade")}
                  sx={{
                    backgroundColor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    "&:hover": {
                      backgroundColor: theme.palette.error.dark,
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Assinar Plano
                </Button>
              )}

              {/* Divider */}
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  height: 32,
                  alignSelf: "center",
                  borderColor: theme.palette.divider,
                  mx: 1,
                }}
              />

              {/* Botão Configurações */}
              <Tooltip title="Configurações" arrow>
                <IconButton
                  onClick={handleSettingsClick}
                  sx={{
                    color: isActiveRoute("/configuracoes")
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    backgroundColor: "transparent",
                    fontSize: "1.25rem",
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: isActiveRoute("/configuracoes")
                        ? theme.palette.primary.dark
                        : theme.palette.text.primary,
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>

              {/* Perfil do Usuário */}
              <Tooltip title="Perfil do usuário" arrow>
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{
                    p: 0.5,
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <Avatar
                    src={profileInfo?.profile?.imageURL || store.user?.picture}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: theme.palette.primary.main,
                      border: `2px solid ${theme.palette.background.paper}`,
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    {(profileInfo?.name || store.user?.name)
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}
                  </Avatar>
                </IconButton>
              </Tooltip>

              {/* Menu do Perfil */}
              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: 3,
                    minWidth: 280,
                    maxWidth: "90vw",
                    maxHeight: "none !important",
                    height: "auto !important",
                    overflow: "visible !important",
                    boxShadow: theme.shadows[8],
                    border: `1px solid ${theme.palette.divider}20`,
                    backdropFilter: "blur(20px)",
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper}CC 100%)`,
                    "&.MuiPaper-root": {
                      maxHeight: "none !important",
                      overflow: "visible !important",
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                MenuListProps={{
                  sx: {
                    maxHeight: "none !important",
                    overflow: "visible !important",
                    padding: 0,
                  },
                }}
              >
                <Box sx={{ p: 3, pb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar
                      src={
                        profileInfo?.profile?.imageURL || store.user?.picture
                      }
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: theme.palette.primary.main,
                        border: `3px solid ${theme.palette.primary.main}20`,
                      }}
                    >
                      {(profileInfo?.name || store.user?.name)
                        ?.charAt(0)
                        ?.toUpperCase() || "U"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          mb: 0.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {profileInfo?.name || store.user?.name || "Usuário"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: "0.8rem",
                          wordBreak: "break-word",
                        }}
                      >
                        {profileInfo?.profile?.email ||
                          store.user?.email ||
                          "email@exemplo.com"}
                      </Typography>
                    </Box>
                  </Box>

                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.action.hover,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}20`,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 500,
                      }}
                    >
                      {store.user?.sub ? "Conta Google" : "Dono da conta"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {store.user?.sub
                        ? "Conectado via Google"
                        : "Conta criada localmente"}
                    </Typography>
                  </Paper>
                </Box>

                <Divider />

                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    color: theme.palette.error.main,
                    py: 1.5,
                    px: 3,
                    "&:hover": {
                      backgroundColor: theme.palette.error.main + "10",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                    <Logout />
                  </ListItemIcon>
                  <ListItemText
                    primary="Fazer Logout"
                    primaryTypographyProps={{
                      fontWeight: 500,
                    }}
                  />
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Paper>
      </Box>

      {/* Spacer para compensar o menu flutuante */}
      <Box sx={{ height: { xs: 92, sm: 100 } }} />
    </>
  );
}
