import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  Avatar,
  Button,
  Drawer,
  IconButton,
  useMediaQuery,
  Divider,
} from "@mui/material";
import {
  Person,
  Security,
  CardMembership,
  Upgrade,
  Menu,
  Business,
  Group,
} from "@mui/icons-material";
import { useAuth } from "../../../modules/access-manager/auth.hook";
import {
  useGetPurchases,
  type IGetPurchasesResponseSuccess,
} from "../../../../services/get-purchases.service";
import {
  useGetAuthMe,
  type IGetAuthMeResponseSuccess,
} from "../../../../services/get-auth-me.service";
import { ProfileSection } from "./profile/profile.component";
import { SecuritySection } from "./security/security.component";
import { SubscriptionSection } from "./subscription/subscription.component";
import { UpgradeSection } from "./upgrade/upgrade.component";
import { CompanySection } from "./company/company.component";
import { CollaboratorsSection } from "./collaborators/collaborators.component";

type ManagementSection =
  | "profile"
  | "security"
  | "subscription"
  | "upgrade"
  | "company"
  | "collaborators";

export function ManagementComponent() {
  const theme = useTheme();
  const { store } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] =
    useState<ManagementSection>("profile");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [purchases, setPurchases] = useState<IGetPurchasesResponseSuccess[]>(
    []
  );
  const [profileInfo, setProfileInfo] =
    useState<IGetAuthMeResponseSuccess | null>(null);

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Verificar se o usuário tem plano empresarial (imobiliária)
  const isBusinessPlan =
    purchases.length > 0 && purchases[0].product.accountType === "BUSINESS";

  // Detectar parâmetro da URL para definir seção inicial
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const sectionParam = urlParams.get("section");
    if (
      sectionParam &&
      [
        "profile",
        "security",
        "subscription",
        "upgrade",
        "company",
        "collaborators",
      ].includes(sectionParam)
    ) {
      setSelectedSection(sectionParam as ManagementSection);
    }
  }, [location.search]);

  // Data via SWR
  const { data: meData } = useGetAuthMe();
  const { data: purchasesData } = useGetPurchases();
  useEffect(() => {
    if (meData) setProfileInfo(meData);
  }, [meData]);
  useEffect(() => {
    if (purchasesData) setPurchases(purchasesData);
  }, [purchasesData]);

  // Seção CONTA
  const accountMenuItems = [
    {
      id: "profile" as ManagementSection,
      label: "Perfil",
      icon: <Person />,
      description: "Gerencie suas informações pessoais",
    },
    {
      id: "security" as ManagementSection,
      label: "Segurança",
      icon: <Security />,
      description: "Configurações de segurança e privacidade",
    },
  ];

  // Seção EMPRESA
  const businessMenuItems = isBusinessPlan
    ? [
        {
          id: "company" as ManagementSection,
          label: "Detalhes da Empresa",
          icon: <Business />,
          description: "Informações da sua empresa",
        },
        {
          id: "collaborators" as ManagementSection,
          label: "Colaboradores",
          icon: <Group />,
          description: "Gerencie sua equipe",
        },
      ]
    : [];

  // Seção FATURAMENTO
  const billingMenuItems = [
    {
      id: "subscription" as ManagementSection,
      label: "Meu Plano",
      icon: <CardMembership />,
      description: "Gerencie sua assinatura e pagamentos",
    },
    {
      id: "upgrade" as ManagementSection,
      label: "Upgrade",
      icon: <Upgrade />,
      description: "Faça upgrade do seu plano",
    },
  ];

  const handleGoToUpgrade = () => {
    setSelectedSection("upgrade");
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleSectionChange = (section: ManagementSection) => {
    // Verificar se o usuário está tentando acessar seções de empresa sem ter plano empresarial
    if (
      (section === "company" || section === "collaborators") &&
      !isBusinessPlan
    ) {
      // Redirecionar para o perfil se não tiver plano empresarial
      setSelectedSection("profile");
    } else {
      setSelectedSection(section);
    }

    // Limpar parâmetros da URL
    navigate("/configuracoes", { replace: true });

    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const renderSelectedSection = () => {
    switch (selectedSection) {
      case "profile":
        return <ProfileSection />;
      case "security":
        return <SecuritySection />;
      case "subscription":
        return <SubscriptionSection />;
      case "company":
        // Verificar se o usuário tem plano empresarial
        if (!isBusinessPlan) {
          return <ProfileSection />;
        }
        return <CompanySection />;
      case "collaborators":
        // Verificar se o usuário tem plano empresarial
        if (!isBusinessPlan) {
          return <ProfileSection />;
        }
        return <CollaboratorsSection />;
      case "upgrade":
        return <UpgradeSection />;
      default:
        return <ProfileSection />;
    }
  };

  const renderSidebar = () => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* User Profile Section */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={profileInfo?.profile?.imageURL || store.user?.picture}
            sx={{
              width: 52,
              height: 52,
              bgcolor: theme.palette.primary.main,
              border: `2px solid ${theme.palette.primary.main}20`,
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
              color="text.secondary"
              sx={{
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
      </Box>

      {/* Navigation Menu */}
      <Box
        sx={{ flex: 1, p: 2, backgroundColor: theme.palette.background.paper }}
      >
        <List sx={{ p: 0 }}>
          {/* Seção CONTA */}
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              px: 2,
              py: 1,
              display: "block",
            }}
          >
            Conta
          </Typography>
          {accountMenuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleSectionChange(item.id)}
                selected={selectedSection === item.id}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  backgroundColor:
                    selectedSection === item.id
                      ? theme.palette.primary.main + "12"
                      : "transparent",
                  border:
                    selectedSection === item.id
                      ? `1px solid ${theme.palette.primary.main}30`
                      : "1px solid transparent",
                  "&:hover": {
                    backgroundColor:
                      selectedSection === item.id
                        ? theme.palette.primary.main + "20"
                        : theme.palette.action.hover,
                    borderColor:
                      selectedSection === item.id
                        ? theme.palette.primary.main + "50"
                        : theme.palette.divider,
                  },
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.main + "12",
                    borderColor: theme.palette.primary.main + "30",
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main + "20",
                      borderColor: theme.palette.primary.main + "50",
                    },
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedSection === item.id
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                    minWidth: 44,
                    mr: 1,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: selectedSection === item.id ? 600 : 500,
                    color:
                      selectedSection === item.id
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    fontSize: "0.9rem",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.75rem",
                    color: theme.palette.text.secondary,
                    lineHeight: 1.3,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Separador para seção empresa */}
          {isBusinessPlan && (
            <>
              <Box sx={{ my: 2 }}>
                <Divider />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  px: 2,
                  py: 1,
                  display: "block",
                }}
              >
                Empresa
              </Typography>
            </>
          )}

          {/* Seção EMPRESA */}
          {businessMenuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleSectionChange(item.id)}
                selected={selectedSection === item.id}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  backgroundColor:
                    selectedSection === item.id
                      ? theme.palette.primary.main + "12"
                      : "transparent",
                  border:
                    selectedSection === item.id
                      ? `1px solid ${theme.palette.primary.main}30`
                      : "1px solid transparent",
                  "&:hover": {
                    backgroundColor:
                      selectedSection === item.id
                        ? theme.palette.primary.main + "20"
                        : theme.palette.action.hover,
                    borderColor:
                      selectedSection === item.id
                        ? theme.palette.primary.main + "50"
                        : theme.palette.divider,
                  },
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.main + "12",
                    borderColor: theme.palette.primary.main + "30",
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main + "20",
                      borderColor: theme.palette.primary.main + "50",
                    },
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedSection === item.id
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                    minWidth: 44,
                    mr: 1,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: selectedSection === item.id ? 600 : 500,
                    color:
                      selectedSection === item.id
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    fontSize: "0.9rem",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.75rem",
                    color: theme.palette.text.secondary,
                    lineHeight: 1.3,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* Separador para seção faturamento */}
          <Box sx={{ my: 2 }}>
            <Divider />
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              px: 2,
              py: 1,
              display: "block",
            }}
          >
            Faturamento
          </Typography>

          {/* Seção FATURAMENTO */}
          {billingMenuItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleSectionChange(item.id)}
                selected={selectedSection === item.id}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  backgroundColor:
                    selectedSection === item.id
                      ? theme.palette.primary.main + "12"
                      : "transparent",
                  border:
                    selectedSection === item.id
                      ? `1px solid ${theme.palette.primary.main}30`
                      : "1px solid transparent",
                  "&:hover": {
                    backgroundColor:
                      selectedSection === item.id
                        ? theme.palette.primary.main + "20"
                        : theme.palette.action.hover,
                    borderColor:
                      selectedSection === item.id
                        ? theme.palette.primary.main + "50"
                        : theme.palette.divider,
                  },
                  "&.Mui-selected": {
                    backgroundColor: theme.palette.primary.main + "12",
                    borderColor: theme.palette.primary.main + "30",
                    "&:hover": {
                      backgroundColor: theme.palette.primary.main + "20",
                      borderColor: theme.palette.primary.main + "50",
                    },
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      selectedSection === item.id
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                    minWidth: 44,
                    mr: 1,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: selectedSection === item.id ? 600 : 500,
                    color:
                      selectedSection === item.id
                        ? theme.palette.primary.main
                        : theme.palette.text.primary,
                    fontSize: "0.9rem",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.75rem",
                    color: theme.palette.text.secondary,
                    lineHeight: 1.3,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: { xs: 1, sm: 2 },
          }}
        >
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={toggleMobileDrawer}
              sx={{ mr: 1 }}
            >
              <Menu />
            </IconButton>
          )}
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: theme.palette.text.primary }}
          >
            Configurações
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={handleGoToUpgrade}
          sx={{
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            px: { xs: 2, sm: 3 },
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          {isMobile ? "Assinar" : "Assinar Plano"}
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flex: 1,
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Desktop/Tablet Sidebar */}
        {!isMobile && (
          <Box
            sx={{
              width: { md: 280, lg: 320 },
              minHeight: "calc(100vh - 64px)",
              backgroundColor: theme.palette.background.paper,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              position: "relative",
              borderRight: `1px solid ${theme.palette.divider}`,
            }}
          >
            {renderSidebar()}
          </Box>
        )}

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={toggleMobileDrawer}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: 280,
              boxSizing: "border-box",
            },
          }}
        >
          {renderSidebar()}
        </Drawer>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0, // Prevents overflow
            backgroundColor: theme.palette.background.default,
            position: "relative",
            borderLeft: {
              xs: "none",
              md: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {renderSelectedSection()}
        </Box>
      </Box>
    </Box>
  );
}
