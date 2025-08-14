import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  useTheme,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { LocationOn } from "@mui/icons-material";

const cities = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Brasília",
  "Salvador",
  "Fortaleza",
  "Recife",
  "Porto Alegre",
  "Curitiba",
  "Goiânia",
  "Manaus",
  "Belém",
  "Vitória",
  "Florianópolis",
  "Natal",
  "Maceió",
  "João Pessoa",
  "Teresina",
  "Campo Grande",
  "Cuiabá",
];

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function CitySelect({
  value,
  onChange,
  label = "Selecione a cidade para as pesquisas de imóveis",
  required = false,
  disabled = false,
  sx = {},
}: CitySelectProps) {
  const theme = useTheme();

  return (
    <FormControl fullWidth sx={{ ...sx }}>
      <InputLabel id="city-label">{label}</InputLabel>
      <Select
        labelId="city-label"
        id="city"
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: "200px !important",
              width: "auto",
              minWidth: "100%",
              boxShadow: theme.palette.brand.shadow,
              border: `1px solid ${theme.palette.brand.border}`,
              borderRadius: 2,
              mt: 0.5,
              overflow: "auto !important",
              "& .MuiMenuItem-root": {
                padding: "8px 16px",
                fontSize: "14px",
                "&:hover": {
                  backgroundColor: `${theme.palette.brand.secondary}14`,
                },
                "&.Mui-selected": {
                  backgroundColor: `${theme.palette.brand.secondary}1F`,
                  "&:hover": {
                    backgroundColor: `${theme.palette.brand.secondary}29`,
                  },
                },
              },
            },
            style: {
              maxHeight: "200px",
              overflow: "auto",
            },
          },
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
          slotProps: {
            paper: {
              sx: {
                maxHeight: "200px !important",
                overflow: "auto !important",
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: theme.palette.brand.light,
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: theme.palette.brand.primary,
                  borderRadius: "4px",
                  "&:hover": {
                    background: theme.palette.brand.secondary,
                  },
                },
              },
              style: {
                maxHeight: "200px",
                overflow: "auto",
              },
            },
          },
        }}
        sx={{
          borderRadius: 3,
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.palette.brand.shadowHover,
          },
          "&.Mui-focused": {
            transform: "translateY(-2px)",
            boxShadow: theme.palette.brand.shadowFocus,
          },
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            gap: 1,
          },
        }}
        startAdornment={
          <InputAdornment position="start">
            <LocationOn sx={{ color: "primary.main", opacity: 0.7 }} />
          </InputAdornment>
        }
      >
        {cities.map((cityName) => (
          <MenuItem key={cityName} value={cityName}>
            {cityName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
