import { Box, Typography, IconButton, Chip, useTheme } from "@mui/material";
import {
  Delete,
  Home,
  Person,
  TrendingUp,
  LocationOn,
} from "@mui/icons-material";
import type { ColumnId } from "./kanban.component";

export type CardType = "property" | "contact";

export interface KanbanCardData {
  id: string;
  type: CardType;
  title: string;
  subtitle?: string;
  contact?: string;
  address?: string;
}

interface KanbanCardProps {
  card: KanbanCardData;
  columnId?: ColumnId;
  onDelete?: (id: string) => void;
}

export function KanbanCard({ card, columnId, onDelete }: KanbanCardProps) {
  const theme = useTheme();

  const getColumnIcon = () => {
    if (!columnId) return null;

    switch (columnId) {
      case "property-sourcing":
        return <Home sx={{ fontSize: 100 }} />;
      case "contact-sourcing":
        return <Person sx={{ fontSize: 100 }} />;
      case "prospecting":
        return <TrendingUp sx={{ fontSize: 100 }} />;
      case "visit":
        return <LocationOn sx={{ fontSize: 100 }} />;
      default:
        return null;
    }
  };

  const getColumnColor = () => {
    if (!columnId) return theme.palette.grey[300];

    switch (columnId) {
      case "property-sourcing":
        return "#C8E6C9"; // Verde claro
      case "contact-sourcing":
        return "#BBDEFB"; // Azul claro
      case "prospecting":
        return "#F8BBD0"; // Rosa claro
      case "visit":
        return "#FFE0B2"; // Laranja claro
      default:
        return theme.palette.grey[300];
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: theme.palette.common.white,
        borderRadius: 2,
        p: 2,
        mb: 2,
        boxShadow: theme.shadows[2],
        cursor: "grab",
        "&:active": {
          cursor: "grabbing",
        },
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: theme.shadows[4],
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Ícone de fundo */}
      {getColumnIcon() && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%) rotate(-15deg)",
            color: getColumnColor(),
            opacity: 0.2,
            zIndex: 0,
          }}
        >
          {getColumnIcon()}
        </Box>
      )}

      {/* Conteúdo do card */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        {/* Label do tipo */}
        <Chip
          label={card.type === "property" ? "Imóvel" : "Contato"}
          size="small"
          sx={{
            mb: 1.5,
            backgroundColor:
              card.type === "property"
                ? theme.palette.success.main
                : theme.palette.info.main,
            color: theme.palette.common.white,
            fontWeight: 600,
            fontSize: "0.7rem",
            height: 20,
          }}
        />

        {/* Título */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            color: theme.palette.text.primary,
            fontSize: "0.9rem",
          }}
        >
          {card.title}
        </Typography>

        {/* Subtítulo */}
        {card.subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mb: 0.5,
              fontSize: "0.8rem",
            }}
          >
            {card.subtitle}
          </Typography>
        )}

        {/* Endereço ou Contato */}
        {card.address && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.8rem",
            }}
          >
            Endereço: {card.address}
          </Typography>
        )}

        {card.contact && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.8rem",
            }}
          >
            Contato: {card.contact}
          </Typography>
        )}
      </Box>

      {/* Botão de deletar */}
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(card.id);
        }}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          backgroundColor: theme.palette.common.white,
          boxShadow: theme.shadows[2],
          "&:hover": {
            backgroundColor: theme.palette.error.light,
            color: theme.palette.common.white,
          },
          width: 28,
          height: 28,
        }}
      >
        <Delete fontSize="small" />
      </IconButton>
    </Box>
  );
}
