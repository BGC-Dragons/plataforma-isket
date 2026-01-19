import { useState, useEffect, useCallback } from "react";
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
  CircularProgress,
  Alert,
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
import { useAuth } from "../access-manager/auth.hook";
import {
  useGetPropertyListingAcquisitionsStages,
  clearPropertyListingAcquisitionsStagesCache,
  type IPropertyListingAcquisitionStage,
} from "../../../services/get-property-listing-acquisitions-stages.service";
import { postPropertyListingAcquisitionStage } from "../../../services/post-property-listing-acquisitions-stage.service";
import { deletePropertyListingAcquisitionStage } from "../../../services/delete-property-listing-acquisitions-stage.service";
import { patchPropertyListingAcquisitionStage } from "../../../services/patch-property-listing-acquisitions-stage.service";
import { deletePropertyListingAcquisition } from "../../../services/delete-property-listing-acquisition.service";

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
  rectSortingStrategy,
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
  onCardClick?: (card: KanbanCardData) => void;
  onAddColumn?: (column: Omit<KanbanColumn, "id" | "cards">) => void;
  searchQuery?: string; // Prop para indicar busca ativa
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

// Componente wrapper para tornar coluna arrastável
function SortableColumnWrapper({
  column,
  onCardDelete,
  onCardClick,
  onMenuOpen,
  isDraggingCard,
}: {
  column: KanbanColumn;
  onCardDelete: (cardId: string, columnId: ColumnId) => void;
  onCardClick?: (card: KanbanCardData) => void;
  onMenuOpen?: (
    event: React.MouseEvent<HTMLElement>,
    columnId: ColumnId
  ) => void;
  isDraggingCard?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        flexShrink: 0,
        minWidth: 300,
      }}
    >
      <SortableColumn
        column={column}
        onCardDelete={onCardDelete}
        onCardClick={onCardClick}
        onMenuOpen={onMenuOpen}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDraggingCard={isDraggingCard}
      />
    </Box>
  );
}

// Componente de coluna sortable
function SortableColumn({
  column,
  onCardDelete,
  onCardClick,
  onMenuOpen,
  dragHandleProps,
  isDraggingCard,
}: {
  column: KanbanColumn;
  onCardDelete: (cardId: string, columnId: ColumnId) => void;
  onCardClick?: (card: KanbanCardData) => void;
  onMenuOpen?: (
    event: React.MouseEvent<HTMLElement>,
    columnId: ColumnId
  ) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isDraggingCard?: boolean;
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
        width: 300,
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
        {...dragHandleProps}
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
          cursor: dragHandleProps ? "grab" : "default",
          "&:active": {
            cursor: dragHandleProps ? "grabbing" : "default",
          },
        }}
      >
        {/* Menu de ações (para todas as colunas) */}
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
          }}
        >
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {column.cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                columnId={column.id}
                onDelete={onCardDelete}
                onClick={onCardClick}
                isDraggingCard={isDraggingCard}
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
  onClick,
  isDraggingCard,
}: {
  card: KanbanCardData;
  columnId: ColumnId;
  onDelete: (cardId: string, columnId: ColumnId) => void;
  onClick?: (card: KanbanCardData) => void;
  isDraggingCard?: boolean;
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

  // Criar handler de clique que verifica se não está arrastando
  const handleClick = (clickedCard: KanbanCardData) => {
    if (!isDraggingCard && !isDragging) {
      onClick?.(clickedCard);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        card={card}
        onDelete={(id) => onDelete(id, columnId)}
        onClick={handleClick}
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

  // Corrigindo plural de imóvel para "imóveis" corretamente
  if (propertyCount > 0 && contactCount > 0) {
    return `Total: ${propertyCount} ${
      propertyCount === 1 ? "imóvel" : "imóveis"
    }, ${contactCount} contato${contactCount > 1 ? "s" : ""}`;
  } else if (propertyCount > 0) {
    return `Total: ${propertyCount} ${
      propertyCount === 1 ? "imóvel" : "imóveis"
    }`;
  } else if (contactCount > 0) {
    return `Total: ${contactCount} contato${contactCount > 1 ? "s" : ""}`;
  }
  return "Total: 0";
}

// Função para mapear listing da API para KanbanCardData
function mapListingToCard(
  listing: IPropertyListingAcquisitionStage["listings"][0]
): KanbanCardData {
  return {
    id: listing.id,
    type: listing.captureType === "PROPERTY" ? "property" : "contact",
    title: listing.title,
    address: listing.formattedAddress,
    subtitle: listing.status,
  };
}

// Função para mapear stage da API para KanbanColumn
function mapStageToColumn(
  stage: IPropertyListingAcquisitionStage
): KanbanColumn {
  const defaultColors = [
    "#C8E6C9",
    "#BBDEFB",
    "#F8BBD0",
    "#FFE0B2",
    "#E1BEE7",
    "#FFF9C4",
  ];
  const icons = [<Home />, <Person />, <TrendingUp />, <LocationOn />];
  const iconIndex = (stage.order - 1) % icons.length;
  const colorIndex = (stage.order - 1) % defaultColors.length;

  return {
    id: stage.id,
    title: stage.title,
    icon: icons[iconIndex],
    color: defaultColors[colorIndex],
    cards: stage.listings.map(mapListingToCard),
  };
}

// Função para mapear array de stages para array de columns
function mapStagesToColumns(
  stages: IPropertyListingAcquisitionStage[]
): KanbanColumn[] {
  // Ordenar por order antes de mapear
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  return sortedStages.map(mapStageToColumn);
}

export function Kanban({
  columns: propsColumns,
  onCardMove,
  onCardDelete,
  onCardClick,
  searchQuery = "",
}: KanbanProps) {
  const theme = useTheme();
  const auth = useAuth();
  const {
    data: stages,
    error,
    isLoading,
    mutate,
  } = useGetPropertyListingAcquisitionsStages();
  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    columnId: ColumnId;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    cardId: string | null;
    columnId: ColumnId | null;
  }>({
    open: false,
    cardId: null,
    columnId: null,
  });
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#C8E6C9");
  const [newColumnFontColor, setNewColumnFontColor] = useState("#000000");
  const [newColumnIcon, setNewColumnIcon] = useState<
    "home" | "person" | "trending" | "location"
  >("home");

  // Função para normalizar texto (remover acentos e espaços extras)
  const normalizeText = (text: string): string => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // Normaliza espaços múltiplos
  };

  // Mapear stages da API para columns
  useEffect(() => {
    // Sempre priorizar dados da API quando disponíveis
    if (stages && stages.length > 0) {
      const mappedColumns = mapStagesToColumns(stages);

      // Se há busca ativa, filtrar os cards
      if (searchQuery.trim()) {
        const searchNormalized = normalizeText(searchQuery);
        const filtered = mappedColumns.map((column) => ({
          ...column,
          cards: column.cards.filter((card) => {
            if (!card.title) return false;
            const cardTitle = normalizeText(card.title);
            return cardTitle.includes(searchNormalized);
          }),
        }));
        setLocalColumns(filtered);
      } else {
        setLocalColumns(mappedColumns);
      }
    } else if (propsColumns) {
      // Fallback para props se não houver dados da API
      // Se há busca ativa, filtrar os propsColumns também
      if (searchQuery.trim()) {
        const searchNormalized = normalizeText(searchQuery);
        const filtered = propsColumns.map((column) => ({
          ...column,
          cards: column.cards.filter((card) => {
            if (!card.title) return false;
            const cardTitle = normalizeText(card.title);
            return cardTitle.includes(searchNormalized);
          }),
        }));
        setLocalColumns(filtered);
      } else {
        setLocalColumns(propsColumns);
      }
    } else {
      setLocalColumns(defaultColumns);
    }
  }, [stages, propsColumns, searchQuery]);

  // Configurar sensores para drag and drop
  // Adicionar activationConstraint para permitir cliques simples
  // O drag só será ativado após mover pelo menos 8px
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Só ativa o drag após mover 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCardDelete = (cardId: string, columnId: ColumnId) => {
    // Abrir dialog de confirmação
    setDeleteConfirmDialog({
      open: true,
      cardId,
      columnId,
    });
  };

  const handleConfirmDelete = async () => {
    if (
      !deleteConfirmDialog.cardId ||
      !deleteConfirmDialog.columnId ||
      !auth.store.token
    ) {
      return;
    }

    setIsDeletingCard(true);
    try {
      // Deletar a acquisition via API
      await deletePropertyListingAcquisition(
        deleteConfirmDialog.cardId,
        auth.store.token
      );

      // Atualizar os stages e acquisitions
      clearPropertyListingAcquisitionsStagesCache();
      await mutate();

      // Fechar dialog e limpar estado
      setDeleteConfirmDialog({
        open: false,
        cardId: null,
        columnId: null,
      });

      // Chamar callback se existir
      onCardDelete?.(deleteConfirmDialog.cardId, deleteConfirmDialog.columnId);
    } catch (error) {
      console.error("Erro ao deletar captação:", error);
      alert("Erro ao deletar captação. Tente novamente.");
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDialog({
      open: false,
      cardId: null,
      columnId: null,
    });
  };

  const handleDragStart: Parameters<typeof DndContext>[0]["onDragStart"] = (
    event
  ) => {
    setActiveId(event.active.id as string);
    // Verificar se é um card (não uma coluna)
    const isCard = localColumns.some((col) =>
      col.cards.some((card) => card.id === event.active.id)
    );
    if (isCard) {
      setIsDraggingCard(true);
    }
  };

  const handleDragEnd: Parameters<typeof DndContext>[0]["onDragEnd"] = async (
    event
  ) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDraggingCard(false); // Resetar flag de drag

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Verificar se é uma coluna sendo arrastada
    const sourceColumn = localColumns.find((col) => col.id === activeId);
    const destinationColumn = localColumns.find((col) => col.id === overId);

    if (
      sourceColumn &&
      destinationColumn &&
      sourceColumn.id !== destinationColumn.id
    ) {
      // Reordenar colunas
      const sourceIndex = localColumns.findIndex((col) => col.id === activeId);
      const destinationIndex = localColumns.findIndex(
        (col) => col.id === overId
      );

      // Salvar estado anterior para possível reversão
      const previousColumns = [...localColumns];

      const newColumns = [...localColumns];
      const [removed] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(destinationIndex, 0, removed);

      // Atualizar estado local
      setLocalColumns(newColumns);

      // Atualizar ordem na API
      if (auth.store.token && stages) {
        try {
          // Criar um mapa de IDs para stages
          const stageMap = new Map(stages.map((s) => [s.id, s]));

          // Atualizar a ordem de todas as colunas afetadas
          const updatePromises = newColumns.map((col, index) => {
            const stage = stageMap.get(col.id);
            if (stage && stage.order !== index + 1) {
              return patchPropertyListingAcquisitionStage(
                auth.store.token as string,
                col.id as string,
                { order: index + 1 }
              );
            }
            return Promise.resolve();
          });

          await Promise.all(updatePromises);
          clearPropertyListingAcquisitionsStagesCache();
          await mutate();
        } catch (error) {
          console.error("Erro ao atualizar ordem das colunas:", error);
          // Reverter mudanças locais em caso de erro
          setLocalColumns(previousColumns);
          alert("Erro ao atualizar ordem das colunas. Tente novamente.");
        }
      }
      return;
    }

    // Lógica original para mover cards
    const sourceCardColumn = localColumns.find((col) =>
      col.cards.some((card) => card.id === activeId)
    );

    if (!sourceCardColumn) return;

    // Encontrar coluna de destino
    // Pode ser o ID da coluna diretamente ou um card dentro de uma coluna
    let destinationCardColumn = localColumns.find((col) => col.id === overId);

    // Se não encontrou pela coluna, procura pelo card
    if (!destinationCardColumn) {
      destinationCardColumn = localColumns.find((col) =>
        col.cards.some((card) => card.id === overId)
      );
    }

    if (!destinationCardColumn) return;
    if (sourceCardColumn.id === destinationCardColumn.id) return;

    // Mover card
    const card = sourceCardColumn.cards.find((c) => c.id === activeId);
    if (!card) return;

    setLocalColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceCardColumn.id) {
          return {
            ...col,
            cards: col.cards.filter((c) => c.id !== activeId),
          };
        }
        if (col.id === destinationCardColumn.id) {
          return {
            ...col,
            cards: [...col.cards, card],
          };
        }
        return col;
      })
    );

    onCardMove?.(activeId, sourceCardColumn.id, destinationCardColumn.id);
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

  const handleDeleteStage = useCallback(async () => {
    if (!menuAnchor) return;

    const columnId = menuAnchor.columnId;
    const column = localColumns.find((col) => col.id === columnId);

    if (!column || !auth.store.token) return;

    // Não permitir deletar se tiver cards
    if (column.cards.length > 0) {
      alert("Não é possível deletar uma etapa que contém captações.");
      handleMenuClose();
      return;
    }

    setIsDeleting(true);
    try {
      await deletePropertyListingAcquisitionStage(
        auth.store.token,
        columnId as string
      );
      clearPropertyListingAcquisitionsStagesCache();
      await mutate();
      handleMenuClose();
    } catch (error) {
      console.error("Erro ao deletar etapa:", error);
      alert("Erro ao deletar etapa. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }, [menuAnchor, localColumns, auth.store.token, mutate]);

  const handleCreateStage = useCallback(async () => {
    if (!newColumnTitle.trim() || !auth.store.token) return;

    setIsCreating(true);
    try {
      // Calcular a ordem (última ordem + 1)
      const maxOrder =
        stages && stages.length > 0
          ? Math.max(...stages.map((s) => s.order)) + 1
          : 1;

      await postPropertyListingAcquisitionStage(auth.store.token, {
        title: newColumnTitle.trim(),
        order: maxOrder,
      });

      clearPropertyListingAcquisitionsStagesCache();
      await mutate();

      // Reset form
      setNewColumnTitle("");
      setNewColumnColor("#C8E6C9");
      setNewColumnFontColor("#000000");
      setNewColumnIcon("home");
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar etapa:", error);
      alert("Erro ao criar etapa. Tente novamente.");
    } finally {
      setIsCreating(false);
    }
  }, [newColumnTitle, auth.store.token, stages, mutate]);

  const activeCard = localColumns
    .flatMap((col) => col.cards)
    .find((card) => card.id === activeId);

  const activeColumn = localColumns.find((col) => col.id === activeId);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar etapas. Tente recarregar a página.
        </Alert>
      </Box>
    );
  }

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
        }}
      >
        <SortableContext
          items={localColumns.map((col) => col.id)}
          strategy={rectSortingStrategy}
        >
          {localColumns.map((column) => (
            <SortableColumnWrapper
              key={column.id}
              column={column}
              onCardDelete={handleCardDelete}
              onCardClick={onCardClick}
              onMenuOpen={handleMenuOpen}
              isDraggingCard={isDraggingCard}
            />
          ))}
        </SortableContext>

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
        ) : activeColumn ? (
          <Box
            sx={{
              minWidth: 300,
              opacity: 0.8,
              transform: "rotate(5deg)",
            }}
          >
            <SortableColumn
              column={activeColumn}
              onCardDelete={handleCardDelete}
              onCardClick={onCardClick}
              onMenuOpen={handleMenuOpen}
            />
          </Box>
        ) : null}
      </DragOverlay>

      {/* Menu de ações */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteStage} disabled={isDeleting}>
          {isDeleting ? "Excluindo..." : "Excluir etapa"}
        </MenuItem>
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
            onClick={handleCreateStage}
            variant="contained"
            disabled={!newColumnTitle.trim() || isCreating}
            sx={{ textTransform: "none" }}
          >
            {isCreating ? "Criando..." : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir esta captação? Esta ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: { xs: 2, sm: 2 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 1 },
            justifyContent: { xs: "stretch", sm: "flex-end" },
          }}
        >
          <Button
            onClick={handleCancelDelete}
            disabled={isDeletingCard}
            fullWidth={true}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: { xs: 0.75, sm: 1 },
              order: { xs: 2, sm: 1 },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeletingCard}
            fullWidth={true}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: { xs: 0.75, sm: 1 },
              order: { xs: 1, sm: 2 },
              ml: { xs: 0, sm: 1 },
            }}
            startIcon={isDeletingCard ? <CircularProgress size={16} /> : null}
          >
            {isDeletingCard ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </DndContext>
  );
}
