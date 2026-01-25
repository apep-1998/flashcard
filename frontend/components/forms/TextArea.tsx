import TextField, { type TextFieldProps } from "@mui/material/TextField";

type Props = TextFieldProps & { rows?: number };

export default function TextArea({ sx, rows = 4, ...props }: Props) {
  return (
    <TextField
      {...props}
      rows={rows}
      fullWidth
      multiline
      sx={{
        bgcolor: "#0B0D0E",
        borderRadius: 0.5,
        "& .MuiInputLabel-root": {
          color: "rgba(238, 238, 238, 0.7)",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "rgba(238, 238, 238, 0.9)",
        },
        "& .MuiInputBase-input": {
          color: "#EEEEEE",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--panel-border)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--panel-border)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--panel-border)",
        },
        ...sx,
      }}
    />
  );
}
