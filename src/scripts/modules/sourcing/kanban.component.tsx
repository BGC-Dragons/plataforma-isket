import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Home,
  Person,
  TrendingUp,
  LocationOn,
  MoreVert,
  Add,
  Close,
} from "@mui/icons-material";
import { KanbanCard, type KanbanCardData } from "./kanban-cards.component";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type ColumnId =
  | "property-sourcing"
  | "contact-sourcing"
  | "prospecting"
  | "visit"
  | string; // Permite IDs dinâmicos para novas colunas

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  icon: React.ReactNode;
  color: string;
  cards: KanbanCardData[];
}

interface KanbanProps {
  columns?: KanbanColumn[];
  onCardMove?: (
    cardId: string,
    sourceColumnId: ColumnId,
    destinationColumnId: ColumnId
  ) => void;
  onCardDelete?: (cardId: string, columnId: ColumnId) => void;
  onAddColumn?: (column: Omit<KanbanColumn, "id" | "cards">) => void;
}

const defaultColumns: KanbanColumn[] = [
  {
    id: "property-sourcing",
    title: "Captação por imóvel",
    icon: <Home />,
    color: "#C8E6C9", // Verde claro
    cards: [],
  },
  {
    id: "contact-sourcing",
    title: "Captação por contato",
    icon: <Person />,
    color: "#BBDEFB", // Azul claro
    cards: [],
  },
  {
    id: "prospecting",
    title: "Prospecção",
    icon: <TrendingUp />,
    color: "#F8BBD0", // Rosa claro
    cards: [],
  },
  {
    id: "visit",
    title: "Visita",
    icon: <LocationOn />,
    color: "#FFE0B2", // Laranja claro
    cards: [],
  },
];

// Componente de coluna sortable
function SortableColumn({
  column,
  onCardDelete,
  onMenuOpen,
}: {
  column: KanbanColumn;
  onCardDelete: (cardId: string, columnId: ColumnId) => void;
  onMenuOpen?: (
    event: React.MouseEvent<HTMLElement>,
    columnId: ColumnId
  ) => void;
}) {
  const theme = useTheme();
  const cardIds = column.cards.map((card) => card.id);

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  });

  return (
    <Box
      ref={setDroppableRef}
      sx={{
        flex: 1,
        minWidth: 300,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        borderRadius: 2,
        transition: "background-color 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Header da coluna */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          backgroundColor: column.color,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Menu de ações (apenas para algumas colunas) */}
        {(column.id === "prospecting" || column.id === "visit") && (
          <IconButton
            size="small"
            onClick={(e) => onMenuOpen?.(e, column.id)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {column.icon}
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontSize: "0.9rem",
            }}
          >
            {column.title}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.75rem",
          }}
        >
          {getTotalLabel(column)}
        </Typography>
      </Paper>

      {/* Cards da coluna */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            maxHeight: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: theme.palette.grey[100],
            borderRadius: 2,
            p: 1,
            display: "flex",
            flexDirection: "column",
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: theme.palette.grey[200],
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.grey[400],
              borderRadius: 3,
              "&:hover": {
                backgroundColor: theme.palette.grey[600],
              },
            },
          }}
        >
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {column.cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                columnId={column.id}
                onDelete={onCardDelete}
              />
            ))}
          </Box>
        </Box>
      </SortableContext>
    </Box>
  );
}

// Componente de card sortable
function SortableCard({
  card,
  columnId,
  onDelete,
}: {
  card: KanbanCardData;
  columnId: ColumnId;
  onDelete: (cardId: string, columnId: ColumnId) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        card={card}
        columnId={columnId}
        onDelete={(id) => onDelete(id, columnId)}
      />
    </div>
  );
}

// Função auxiliar para calcular total
function getTotalLabel(column: KanbanColumn) {
  const propertyCount = column.cards.filter(
    (c) => c.type === "property"
  ).length;
  const contactCount = column.cards.filter((c) => c.type === "contact").length;

  if (propertyCount > 0 && contactCount > 0) {
    return `Total: ${propertyCount} imóvel${
      propertyCount > 1 ? "eis" : ""
    }, ${contactCount} contato${contactCount > 1 ? "s" : ""}`;
  } else if (propertyCount > 0) {
    return `Total: ${propertyCount} imóvel${propertyCount > 1 ? "eis" : ""}`;
  } else if (contactCount > 0) {
    return `Total: ${contactCount} contato${contactCount > 1 ? "s" : ""}`;
  }
  return "Total: 0";
}

export function Kanban({
  columns = defaultColumns,
  onCardMove,
  onCardDelete,
  onAddColumn,
}: KanbanProps) {
  const theme = useTheme();
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>(columns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    columnId: ColumnId;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#C8E6C9");
  const [newColumnFontColor, setNewColumnFontColor] = useState("#000000");
  const [newColumnIcon, setNewColumnIcon] = useState<
    "home" | "person" | "trending" | "location"
  >("home");

  // Sincronizar colunas quando props mudarem
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCardDelete = (cardId: string, columnId: ColumnId) => {
    setLocalColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col
      )
    );
    onCardDelete?.(cardId, columnId);
  };

  const handleDragStart: Parameters<typeof DndContext>[0]["onDragStart"] = (
    event
  ) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd: Parameters<typeof DndContext>[0]["onDragEnd"] = (
    event
  ) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar coluna de origem
    const sourceColumn = localColumns.find((col) =>
      col.cards.some((card) => card.id === activeId)
    );

    if (!sourceColumn) return;

    // Encontrar coluna de destino
    // Pode ser o ID da coluna diretamente ou um card dentro de uma coluna
    let destinationColumn = localColumns.find((col) => col.id === overId);

    // Se não encontrou pela coluna, procura pelo card
    if (!destinationColumn) {
      destinationColumn = localColumns.find((col) =>
        col.cards.some((card) => card.id === overId)
      );
    }

    if (!destinationColumn) return;
    if (sourceColumn.id === destinationColumn.id) return;

    // Mover card
    const card = sourceColumn.cards.find((c) => c.id === activeId);
    if (!card) return;

    setLocalColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            cards: col.cards.filter((c) => c.id !== activeId),
          };
        }
        if (col.id === destinationColumn.id) {
          return {
            ...col,
            cards: [...col.cards, card],
          };
        }
        return col;
      })
    );

    onCardMove?.(activeId, sourceColumn.id, destinationColumn.id);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    columnId: ColumnId
  ) => {
    setMenuAnchor({ element: event.currentTarget, columnId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const activeCard = localColumns
    .flatMap((col) => col.cards)
    .find((card) => card.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          overflowY: "hidden",
          height: "100%",
          width: "100%",
          px: 2,
          py: 2,
          backgroundColor: theme.palette.background.paper,
          boxSizing: "border-box",
          "&::-webkit-scrollbar": {
            height: 8,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: theme.palette.grey[100],
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.grey[400],
            borderRadius: 4,
            "&:hover": {
              backgroundColor: theme.palette.grey[600],
            },
          },
        }}
      >
        {localColumns.map((column) => (
          <SortableColumn
            key={column.id}
            column={column}
            onCardDelete={handleCardDelete}
            onMenuOpen={handleMenuOpen}
          />
        ))}

        {/* Botão de adicionar coluna */}
        <Box
          sx={{
            minWidth: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: 2,
            border: `2px dashed ${theme.palette.divider}`,
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.action.hover,
            },
          }}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <IconButton
            sx={{
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
              },
            }}
          >
            <Add sx={{ fontSize: 40 }} />
          </IconButton>
        </Box>
      </Box>

      <DragOverlay>
        {activeCard ? (
          <Box sx={{ opacity: 0.8, transform: "rotate(5deg)" }}>
            <KanbanCard card={activeCard} />
          </Box>
        ) : null}
      </DragOverlay>

      {/* Menu de ações */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Excluir etapa</MenuItem>
      </Menu>

      {/* Modal de criar etapa */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Criar etapa
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsCreateModalOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: 3 }}
          >
            Crie uma nova coluna para seu processo de captação imobiliária.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Campo Título */}
            <TextField
              fullWidth
              label="Título"
              value={newColumnTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewColumnTitle(e.target.value)
              }
              placeholder="Digite o título da etapa"
            />

            {/* Seleção de cor da coluna e cor da fonte */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Selecione a cor da coluna</InputLabel>
                <Select
                  value={newColumnColor}
                  onChange={(e) => setNewColumnColor(e.target.value)}
                  label="Selecione a cor da coluna"
                >
                  <MenuItem value="#C8E6C9">Verde claro</MenuItem>
                  <MenuItem value="#BBDEFB">Azul claro</MenuItem>
                  <MenuItem value="#F8BBD0">Rosa claro</MenuItem>
                  <MenuItem value="#FFE0B2">Laranja claro</MenuItem>
                  <MenuItem value="#E1BEE7">Roxo claro</MenuItem>
                  <MenuItem value="#FFF9C4">Amarelo claro</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Selecione a cor da fonte</InputLabel>
                <Select
                  value={newColumnFontColor}
                  onChange={(e) => setNewColumnFontColor(e.target.value)}
                  label="Selecione a cor da fonte"
                >
                  <MenuItem value="#000000">Preto</MenuItem>
                  <MenuItem value="#FFFFFF">Branco</MenuItem>
                  <MenuItem value="#333333">Cinza escuro</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Seleção de ícone */}
            <FormControl fullWidth>
              <InputLabel>Selecione um ícone</InputLabel>
              <Select
                value={newColumnIcon}
                onChange={(e) =>
                  setNewColumnIcon(
                    e.target.value as
                      | "home"
                      | "person"
                      | "trending"
                      | "location"
                  )
                }
                label="Selecione um ícone"
              >
                <MenuItem value="home">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Home />
                    <Typography>Casa</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="person">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Person />
                    <Typography>Pessoa</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="trending">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TrendingUp />
                    <Typography>Tendência</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="location">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn />
                    <Typography>Localização</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setIsCreateModalOpen(false)}
            variant="contained"
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              const iconMap = {
                home: <Home />,
                person: <Person />,
                trending: <TrendingUp />,
                location: <LocationOn />,
              };

              onAddColumn?.({
                title: newColumnTitle,
                icon: iconMap[newColumnIcon],
                color: newColumnColor,
              });

              // Reset form
              setNewColumnTitle("");
              setNewColumnColor("#C8E6C9");
              setNewColumnFontColor("#000000");
              setNewColumnIcon("home");
              setIsCreateModalOpen(false);
            }}
            variant="contained"
            disabled={!newColumnTitle.trim()}
            sx={{ textTransform: "none" }}
          >
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </DndContext>
  );
}
