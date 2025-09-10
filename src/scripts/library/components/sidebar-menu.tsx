import { useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Divider,
  Avatar,
  Typography,
  Paper,
  Button,
  useTheme,
  Tooltip,
  Popper,
  ClickAwayListener,
  Grow,
} from "@mui/material";
import {
  Analytics,
  Search,
  PersonAdd,
  Assessment,
  Settings,
  Close,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../modules/access-manager/auth.hook";
import isketLogo from "../../../assets/simbolo-isket.svg";

const DRAWER_WIDTH = 80; // Menu compacto

interface SidebarMenuProps {}

export function SidebarMenu({}: SidebarMenuProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, store } = useAuth();
  const [profilePopperOpen, setProfilePopperOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(
    null
  );

  const menuItems = [
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
      icon: <PersonAdd />,
      path: "/captacao",
    },
    {
      text: "Avaliação",
      icon: <Assessment />,
      path: "/avaliacao",
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
    setProfilePopperOpen(true);
  };

  const handleProfileClose = () => {
    setProfilePopperOpen(false);
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    setProfilePopperOpen(false);
    logout();
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header com Logo */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          mb: 1,
        }}
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

      {/* Menu de Navegação */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <Tooltip
              title={item.text}
              placement="right"
              arrow
              sx={{
                "& .MuiTooltip-tooltip": {
                  backgroundColor: theme.palette.grey[800],
                  color: theme.palette.common.white,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                },
              }}
            >
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: "center",
                  backgroundColor: isActiveRoute(item.path)
                    ? theme.palette.primary.main + "20"
                    : "transparent",
                  color: isActiveRoute(item.path)
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                  "&:hover": {
                    backgroundColor: isActiveRoute(item.path)
                      ? theme.palette.primary.main + "30"
                      : theme.palette.action.hover,
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "inherit",
                    minWidth: "auto",
                    margin: 0,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: theme.palette.divider, mx: 1 }} />

      {/* Configurações */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <Tooltip
            title="Configurações"
            placement="right"
            arrow
            sx={{
              "& .MuiTooltip-tooltip": {
                backgroundColor: theme.palette.grey[800],
                color: theme.palette.common.white,
                fontSize: "0.875rem",
                fontWeight: 500,
              },
            }}
          >
            <ListItemButton
              onClick={() => handleNavigation("/configuracoes")}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: "center",
                backgroundColor: isActiveRoute("/configuracoes")
                  ? theme.palette.primary.main + "20"
                  : "transparent",
                color: isActiveRoute("/configuracoes")
                  ? theme.palette.primary.main
                  : theme.palette.text.primary,
                "&:hover": {
                  backgroundColor: isActiveRoute("/configuracoes")
                    ? theme.palette.primary.main + "30"
                    : theme.palette.action.hover,
                },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon
                sx={{
                  color: "inherit",
                  minWidth: "auto",
                  margin: 0,
                }}
              >
                <Settings />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>

      {/* Perfil do Usuário */}
      <Box
        sx={{
          p: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Tooltip
          title="Perfil do usuário"
          placement="right"
          arrow
          sx={{
            "& .MuiTooltip-tooltip": {
              backgroundColor: theme.palette.grey[800],
              color: theme.palette.common.white,
              fontSize: "0.875rem",
              fontWeight: 500,
            },
          }}
        >
          <ListItemButton
            onClick={handleProfileClick}
            sx={{
              borderRadius: 2,
              minHeight: 48,
              justifyContent: "center",
              p: 0,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
              transition: "all 0.2s ease",
            }}
          >
            <Avatar
              src={store.user?.picture}
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
              }}
            >
              {store.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={true}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[4],
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Popper de Perfil (inline) */}
      <Popper
        open={profilePopperOpen}
        anchorEl={profileAnchorEl}
        placement="right-start"
        transition
        disablePortal
        sx={{ zIndex: 1300 }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper
              elevation={8}
              sx={{
                ml: 1,
                borderRadius: 2,
                boxShadow: theme.shadows[8],
                border: `1px solid ${theme.palette.divider}`,
                minWidth: 280,
              }}
            >
              <ClickAwayListener onClickAway={handleProfileClose}>
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Perfil do Usuário
                    </Typography>
                    <IconButton
                      onClick={handleProfileClose}
                      size="small"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <Close />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mb: 4,
                    }}
                  >
                    <Avatar
                      src={store.user?.picture}
                      sx={{
                        width: 80,
                        height: 80,
                        mb: 2,
                        bgcolor: theme.palette.primary.main,
                      }}
                    >
                      {store.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 1,
                        textAlign: "center",
                      }}
                    >
                      {store.user?.name || "Usuário"}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        textAlign: "center",
                      }}
                    >
                      {store.user?.email || "email@exemplo.com"}
                    </Typography>

                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: theme.palette.action.hover,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        width: "100%",
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

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      borderColor: theme.palette.error.main,
                      color: theme.palette.error.main,
                      backgroundColor: theme.palette.background.paper,
                      "&:hover": {
                        borderColor: theme.palette.error.dark,
                        backgroundColor: theme.palette.error.main + "15",
                        color: theme.palette.error.dark,
                      },
                      "&:focus": {
                        borderColor: theme.palette.error.dark,
                        backgroundColor: theme.palette.error.main + "10",
                      },
                    }}
                  >
                    Fazer Logout
                  </Button>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
