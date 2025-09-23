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
  Drawer,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import {
  Person,
  Security,
  CardMembership,
  Upgrade,
  Menu,
} from "@mui/icons-material";
import { useAuth } from "../../../modules/access-manager/auth.hook";
import { ProfileSection } from "./profile/profile.component";
import { SecuritySection } from "./security/security.component";
import { SubscriptionSection } from "./subscription/subscription.component";
import { UpgradeSection } from "./upgrade/upgrade.component";

type ManagementSection = "profile" | "security" | "subscription" | "upgrade";

export function ManagementComponent() {
  const theme = useTheme();
  const { store } = useAuth();
  const [selectedSection, setSelectedSection] =
    useState<ManagementSection>("profile");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleSectionChange = (section: ManagementSection) => {
    setSelectedSection(section);
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
      case "upgrade":
        return <UpgradeSection />;
      default:
        return <ProfileSection />;
    }
  };

  const renderSidebar = () => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
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

      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
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

      <List sx={{ p: 2, flex: 1 }}>
        {menuItems.map((item) => (
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
    </Box>
  );

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
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Configurações
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleGoToSubscription}
            sx={{
              backgroundColor: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
              px: { xs: 2, sm: 3 },
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            {isMobile ? "Assinar" : "Assinar Plano"}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Desktop/Tablet Sidebar */}
        {!isMobile && (
          <Paper
            elevation={2}
            sx={{
              width: { md: 280, lg: 320 },
              minHeight: "calc(100vh - 64px)",
              borderRadius: 0,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              display: { xs: "none", md: "block" },
            }}
          >
            {renderSidebar()}
          </Paper>
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
            p: { xs: 2, sm: 3, md: 4 },
            minWidth: 0, // Prevents overflow
          }}
        >
          {renderSelectedSection()}
        </Box>
      </Box>
    </Box>
  );
}
