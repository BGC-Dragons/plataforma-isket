import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  useTheme,
} from "@mui/material";
import {
  Add,
  Search as SearchIcon,
  ViewModule,
  ViewList,
} from "@mui/icons-material";

export type ViewMode = "grid" | "list";

interface ButtonsBarProps {
  onAddCapture?: () => void;
  onSearchResidents?: () => void;
  onSearchChange?: (value: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  searchValue?: string;
  viewMode?: ViewMode;
}

export function ButtonsBar({
  onAddCapture,
  onSearchResidents,
  onSearchChange,
  onViewModeChange,
  searchValue = "",
  viewMode = "grid",
}: ButtonsBarProps) {
  const theme = useTheme();
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearchValue(value);
    onSearchChange?.(value);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    onViewModeChange?.(mode);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        p: 2,
        flexWrap: { xs: "wrap", sm: "nowrap" },
      }}
    >
      {/* Botões à esquerda */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddCapture}
          sx={{
            backgroundColor: theme.palette.primary.main,
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Adicionar captação
        </Button>

        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={onSearchResidents}
          sx={{
            backgroundColor: theme.palette.primary.main,
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Pesquisar moradores
        </Button>
      </Box>

      {/* Input de pesquisa e visualização à direita */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Pesquisar"
          value={localSearchValue}
          onChange={handleSearchChange}
          size="small"
          sx={{
            minWidth: { xs: "100%", sm: 300, md: 350 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.divider,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Botões de visualização */}
        <Box
          sx={{
            display: "flex",
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <IconButton
            onClick={() => handleViewModeChange("grid")}
            sx={{
              borderRadius: 0,
              backgroundColor:
                viewMode === "grid"
                  ? theme.palette.primary.main
                  : "transparent",
              color:
                viewMode === "grid"
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.secondary,
              "&:hover": {
                backgroundColor:
                  viewMode === "grid"
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
              },
            }}
          >
            <ViewModule fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => handleViewModeChange("list")}
            sx={{
              borderRadius: 0,
              backgroundColor:
                viewMode === "list"
                  ? theme.palette.primary.main
                  : "transparent",
              color:
                viewMode === "list"
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.secondary,
              "&:hover": {
                backgroundColor:
                  viewMode === "list"
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
              },
            }}
          >
            <ViewList fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
