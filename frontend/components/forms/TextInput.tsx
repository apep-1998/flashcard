import TextField, { type TextFieldProps } from "@mui/material/TextField";

type Props = TextFieldProps;

export default function TextInput({ sx, ...props }: Props) {
  return (
    <TextField
      {...props}
      variant="outlined"
      fullWidth
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
