import { useState } from "react";
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  Avatar,
  AppBar,
  Toolbar,
  Button,
} from "@mui/material";
import { Person, Security, CardMembership, Upgrade } from "@mui/icons-material";
import { useAuth } from "../../../modules/access-manager/auth.hook";
import { ProfileSection } from "./profile/profile.component";
import { SecuritySection } from "./security/security.component";
import { SubscriptionSection } from "./subscription/subscription.component";

function UpgradeSection() {
  const theme = useTheme();

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ color: theme.palette.primary.main, mb: 3 }}
      >
        Upgrade
      </Typography>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Seção de upgrade em desenvolvimento...
        </Typography>
      </Paper>
    </Box>
  );
}

type ManagementSection = "profile" | "security" | "subscription" | "upgrade";

export function ManagementComponent() {
  const theme = useTheme();
  const { store } = useAuth();
  const [selectedSection, setSelectedSection] =
    useState<ManagementSection>("profile");

  const menuItems = [
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

  const handleGoToSubscription = () => {
    setSelectedSection("subscription");
  };

  const renderSelectedSection = () => {
    switch (selectedSection) {
      case "profile":
        return <ProfileSection />;
      case "security":
        return <SecuritySection />;
      case "subscription":
        return <SubscriptionSection />;
      case "upgrade":
        return <UpgradeSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="static"
        elevation={1}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Configurações
          </Typography>

          <Button
            variant="contained"
            onClick={handleGoToSubscription}
            sx={{
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Assinar Plano
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, gap: 3 }}>
        <Paper
          elevation={2}
          sx={{
            width: 300,
            minHeight: "calc(100vh - 64px)",
            borderRadius: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box
            sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              Configurações
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Gerencie sua conta e preferências
            </Typography>
          </Box>

          <Box
            sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={store.user?.picture}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.primary.main,
                }}
              >
                {store.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {store.user?.name || "Usuário"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {store.user?.email || "email@exemplo.com"}
                </Typography>
              </Box>
            </Box>
          </Box>

          <List sx={{ p: 2 }}>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => setSelectedSection(item.id)}
                  selected={selectedSection === item.id}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    backgroundColor:
                      selectedSection === item.id
                        ? theme.palette.primary.main + "15"
                        : "transparent",
                    "&:hover": {
                      backgroundColor:
                        selectedSection === item.id
                          ? theme.palette.primary.main + "25"
                          : theme.palette.action.hover,
                    },
                    "&.Mui-selected": {
                      backgroundColor: theme.palette.primary.main + "15",
                      "&:hover": {
                        backgroundColor: theme.palette.primary.main + "25",
                      },
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color:
                        selectedSection === item.id
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontWeight: selectedSection === item.id ? 600 : 400,
                      color:
                        selectedSection === item.id
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.75rem",
                      color: theme.palette.text.secondary,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Box sx={{ flex: 1, p: 4 }}>{renderSelectedSection()}</Box>
      </Box>
    </Box>
  );
}
