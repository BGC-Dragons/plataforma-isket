import { TextField, InputAdornment, IconButton } from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { useTheme } from "@mui/material";

interface CustomTextFieldProps extends Omit<TextFieldProps, "sx"> {
  showPasswordToggle?: boolean;
  sx?: SxProps<Theme>;
}

export function CustomTextField({
  showPasswordToggle = false,
  sx = {},
  ...props
}: CustomTextFieldProps) {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const baseSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": {
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
    },
    ...sx,
  };

  if (showPasswordToggle) {
    return (
      <TextField
        {...props}
        type={showPassword ? "text" : "password"}
        sx={baseSx}
        InputProps={{
          ...props.InputProps,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    );
  }

  return <TextField {...props} sx={baseSx} />;
}
