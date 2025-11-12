import { Box, IconButton, Typography, useTheme } from "@mui/material";
import {
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: CustomPaginationProps) {
  const theme = useTheme();

  // Calcular quais páginas mostrar
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  const handleFirstPage = () => {
    if (currentPage > 1) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        mt: 3,
        pt: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Botão Primeira Página */}
      <IconButton
        onClick={handleFirstPage}
        disabled={currentPage === 1}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${
            currentPage === 1
              ? theme.palette.grey[300]
              : theme.palette.primary.main
          }`,
          color:
            currentPage === 1
              ? theme.palette.grey[400]
              : theme.palette.primary.main,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              currentPage === 1
                ? theme.palette.background.paper
                : theme.palette.primary.light,
            color:
              currentPage === 1
                ? theme.palette.grey[400]
                : theme.palette.primary.contrastText,
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          },
          "&:disabled": {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.grey[400],
            borderColor: theme.palette.grey[300],
            cursor: "not-allowed",
            transform: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
        }}
      >
        <FirstPage fontSize="small" />
      </IconButton>

      {/* Botão Página Anterior */}
      <IconButton
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${
            currentPage === 1
              ? theme.palette.grey[300]
              : theme.palette.primary.main
          }`,
          color:
            currentPage === 1
              ? theme.palette.grey[400]
              : theme.palette.primary.main,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              currentPage === 1
                ? theme.palette.background.paper
                : theme.palette.primary.light,
            color:
              currentPage === 1
                ? theme.palette.grey[400]
                : theme.palette.primary.contrastText,
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          },
          "&:disabled": {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.grey[400],
            borderColor: theme.palette.grey[300],
            cursor: "not-allowed",
            transform: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
        }}
      >
        <ChevronLeft fontSize="small" />
      </IconButton>

      {/* Botões de Página */}
      {visiblePages.map((page) => (
        <IconButton
          key={page}
          onClick={() => handlePageClick(page)}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor:
              page === currentPage
                ? theme.palette.primary.main
                : theme.palette.background.paper,
            border: `1px solid ${
              page === currentPage
                ? theme.palette.primary.main
                : theme.palette.primary.main
            }`,
            color:
              page === currentPage
                ? theme.palette.primary.contrastText
                : theme.palette.primary.main,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
            fontWeight: page === currentPage ? 600 : 400,
            "&:hover": {
              backgroundColor:
                page === currentPage
                  ? theme.palette.primary.dark
                  : theme.palette.primary.light,
              color:
                page === currentPage
                  ? theme.palette.primary.contrastText
                  : theme.palette.primary.contrastText,
              transform: "translateY(-1px)",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: page === currentPage ? 600 : 400,
              fontSize: "0.875rem",
            }}
          >
            {page}
          </Typography>
        </IconButton>
      ))}

      {/* Botão Próxima Página */}
      <IconButton
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${
            currentPage === totalPages
              ? theme.palette.grey[300]
              : theme.palette.primary.main
          }`,
          color:
            currentPage === totalPages
              ? theme.palette.grey[400]
              : theme.palette.primary.main,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              currentPage === totalPages
                ? theme.palette.background.paper
                : theme.palette.primary.light,
            color:
              currentPage === totalPages
                ? theme.palette.grey[400]
                : theme.palette.primary.contrastText,
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          },
          "&:disabled": {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.grey[400],
            borderColor: theme.palette.grey[300],
            cursor: "not-allowed",
            transform: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
        }}
      >
        <ChevronRight fontSize="small" />
      </IconButton>

      {/* Botão Última Página */}
      <IconButton
        onClick={handleLastPage}
        disabled={currentPage === totalPages}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${
            currentPage === totalPages
              ? theme.palette.grey[300]
              : theme.palette.primary.main
          }`,
          color:
            currentPage === totalPages
              ? theme.palette.grey[400]
              : theme.palette.primary.main,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              currentPage === totalPages
                ? theme.palette.background.paper
                : theme.palette.primary.light,
            color:
              currentPage === totalPages
                ? theme.palette.grey[400]
                : theme.palette.primary.contrastText,
            transform: "translateY(-1px)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          },
          "&:disabled": {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.grey[400],
            borderColor: theme.palette.grey[300],
            cursor: "not-allowed",
            transform: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
        }}
      >
        <LastPage fontSize="small" />
      </IconButton>
    </Box>
  );
}
