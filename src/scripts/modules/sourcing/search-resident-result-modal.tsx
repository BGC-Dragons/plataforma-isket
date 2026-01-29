import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
  Paper,
  Avatar,
} from "@mui/material";
import { Close, Person } from "@mui/icons-material";

export interface ResidentResult {
  id: string;
  name: string;
  cpf: string;
}

interface SearchResidentResultModalProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  results?: ResidentResult[];
  onReveal?: (resident: ResidentResult) => void;
  onView?: (resident: ResidentResult) => void;
}

export function SearchResidentResultModal({
  open,
  onClose,
  onBack,
  results = [],
  onReveal,
  onView,
}: SearchResidentResultModalProps) {
  const theme = useTheme();

  // Dados de exemplo se não houver resultados
  const displayResults =
    results.length > 0
      ? results
      : [
          { id: "1", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "2", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "3", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "4", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "5", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "6", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "7", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "8", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "9", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
          { id: "10", name: "JOANA SOUZA STANSKI", cpf: "022.860.589-03" },
        ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: theme.shadows[24],
          height: "90vh",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxHeight: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                fontSize: "1.5rem",
                color: theme.palette.text.primary,
              }}
            >
              Pesquisar moradores: resultado(s)
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Botão Voltar */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Button
            onClick={onBack}
            variant="text"
            sx={{
              textTransform: "none",
              color: theme.palette.primary.main,
              p: 0,
              minWidth: "auto",
              fontSize: "0.875rem",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "transparent",
                textDecoration: "underline",
                color: theme.palette.primary.dark,
              },
            }}
          >
            &lt; Voltar
          </Button>
        </Box>

        {/* Content - Grid de Cards */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 3,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 2,
            }}
          >
            {displayResults.map((resident) => (
              <Paper
                key={resident.id}
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 2,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 0,
                }}
              >
                {/* Ícone */}
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#BBDEFB",
                    color: theme.palette.primary.main,
                  }}
                >
                  <Person />
                </Avatar>

                {/* Nome e CPF */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: theme.palette.text.primary,
                      mb: 0.5,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resident.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.75rem",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {resident.cpf}
                  </Typography>
                </Box>

                {/* Botões */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    flexWrap: "wrap",
                    gap: 1,
                    flexShrink: 0,
                    width: { xs: "100%", sm: "auto" },
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={() => onView?.(resident)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 1.5,
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.5, sm: 0.75 },
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      minWidth: { xs: "100%", sm: "auto" },
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.common.white,
                      backgroundColor: theme.palette.primary.light,
                      "&:hover": {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    Revelar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => onReveal?.(resident)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 1.5,
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.5, sm: 0.75 },
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      minWidth: { xs: "100%", sm: "auto" },
                      backgroundColor: theme.palette.primary.light,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    Captar contato
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
