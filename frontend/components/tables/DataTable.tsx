"use client";

import type { ChangeEvent, ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  minWidth?: number;
  render?: (row: T) => ReactNode;
};

type Props<T> = {
  title?: string;
  actions?: ReactNode;
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  page?: number;
  rowsPerPage?: number;
  count?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  rowsPerPageOptions?: number[];
};

export default function DataTable<T>({
  title,
  actions,
  columns,
  rows,
  getRowKey,
  loading,
  emptyMessage = "No data to display.",
  onScroll,
  page,
  rowsPerPage,
  count,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions,
}: Props<T>) {
  const showPagination =
    typeof page === "number" &&
    typeof rowsPerPage === "number" &&
    typeof count === "number" &&
    typeof onPageChange === "function";

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: "var(--panel-border)",
        bgcolor: "#0B0D0E",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 0.5,
      }}
    >
      {(title || actions) && (
        <Box
          sx={{
            px: 2,
            py: 1.8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            borderBottom: "1px solid var(--panel-border)",
          }}
        >
          {title ? (
            <Typography variant="subtitle1" fontWeight={700}>
              {title}
            </Typography>
          ) : (
            <span />
          )}
          {actions && <Box sx={{ display: "flex", gap: 1 }}>{actions}</Box>}
        </Box>
      )}
      <TableContainer
        sx={{ flexGrow: 1, minHeight: 0, height: "100%", direction: "ltr" }}
        onScroll={onScroll}
      >
        <Table
          stickyHeader
          aria-label={title ?? "Data table"}
          sx={{ direction: "ltr" }}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align ?? "left"}
                  sx={{
                    bgcolor: "var(--color-table-head)",
                    color: "text.primary",
                    fontWeight: 700,
                    minWidth: column.minWidth,
                    py: 1.6,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary">
                    Loading...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  hover
                  sx={{
                    "& td, & th": {
                      borderBottom: "1px solid var(--panel-border)",
                    },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align ?? "left"}
                      sx={{ color: "text.primary", py: 1.4 }}
                    >
                      {column.render ? column.render(row) : (row as any)[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {showPagination && (
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={rowsPerPageOptions ?? [10, 25, 50]}
          sx={{
            borderTop: "1px solid var(--panel-border)",
            color: "text.secondary",
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { color: "text.secondary" },
            "& .MuiTablePagination-toolbar": {
              minHeight: 48,
              overflow: "hidden",
            },
            overflow: "hidden",
          }}
        />
      )}
    </Paper>
  );
}
