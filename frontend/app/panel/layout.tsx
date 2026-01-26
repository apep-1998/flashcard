"use client";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import PanelDrawer from "@/components/navigation/PanelDrawer";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "var(--color-dark-bg)",
        color: "text.primary",
      }}
    >
      <PanelDrawer />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          px: { xs: 2, md: 3 },
          pt: { xs: 9, md: 7 },
          pb: { xs: 2, md: 3 },
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Toolbar sx={{ display: { xs: "flex", md: "none" } }} />
        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
