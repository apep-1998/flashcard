"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { apiFetch, getApiBaseUrl } from "@/lib/auth";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";

const drawerWidth = 260;

const PANEL_SECTIONS = [
  { label: "Study", href: "/panel/study", icon: "study" },
  { label: "Boxes", href: "/panel/boxes", icon: "boxes" },
  { label: "Cards", href: "/panel/cards", icon: "cards" },
  { label: "Exercises", href: "/panel/exercises", icon: "exercises" },
  { label: "Activity", href: "/panel/activity", icon: "activity" },
];

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThemeToggleIcon({ mode }: { mode: Theme }) {
  if (mode === "dark") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case "study":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 6.5 12 3l8 3.5v11L12 21l-8-3.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M4 6.5 12 10l8-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "boxes":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 7h16v10H4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 7v10M16 7v10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "cards":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <rect
            x="5"
            y="6"
            width="14"
            height="12"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 10h8M8 14h6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 18h16M7 15V9m5 6V6m5 9v-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "exercises":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M6 4h9l3 3v13H6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M9 11h6M9 15h6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M15 4v4h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
  }
}

export default function PanelDrawer() {
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState<Theme>("dark");
  const [profile, setProfile] = useState<{
    username?: string;
    email?: string;
    avatar_url?: string | null;
  } | null>(null);

  const handleToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleThemeToggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setTheme(next);
    setMode(next);
  };

  useEffect(() => {
    const stored = getStoredTheme() ?? "dark";
    setMode(stored);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiFetch(
          `${getApiBaseUrl()}/api/auth/profile/`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          username?: string;
          email?: string;
          avatar_url?: string | null;
        };
        setProfile(data);
      } catch {
        setProfile(null);
      }
    };
    loadProfile();
  }, []);

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#EEEEEE",
      }}
    >
      <Toolbar sx={{ gap: 1.5, pr: 1 }}>
        <Box
          sx={{
            height: 36,
            width: 36,
            borderRadius: 2,
            bgcolor: "#0F4C75",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          LF
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Learning Fast
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Study workspace
          </Typography>
        </Box>
        <IconButton
          onClick={handleThemeToggle}
          color="inherit"
          aria-label="Toggle theme"
          sx={{
            bgcolor: "rgba(15, 76, 117, 0.25)",
            color: "inherit",
            border: "1px solid rgba(15, 76, 117, 0.45)",
            "&:hover": { bgcolor: "rgba(15, 76, 117, 0.35)" },
          }}
        >
          <ThemeToggleIcon mode={mode} />
        </IconButton>
      </Toolbar>
      <Divider sx={{ borderColor: "var(--panel-border)" }} />
      <List sx={{ px: 1, py: 2, flexGrow: 1, color: "#EEEEEE" }}>
        {PANEL_SECTIONS.map((section) => {
          const isActive =
            pathname === section.href ||
            pathname.startsWith(`${section.href}/`) ||
            (section.href === "/panel/boxes" &&
              pathname.startsWith("/panel/boxes/"));
          return (
            <ListItemButton
              key={section.href}
              component={Link}
              href={section.href}
              selected={isActive}
              onClick={() => {
                if (!isDesktop) setMobileOpen(false);
              }}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                color: "#EEEEEE",
                bgcolor: isActive ? "#32383E !important" : "transparent",
                "&.Mui-selected": {
                  bgcolor: "#32383E !important",
                },
                "&:hover": {
                  bgcolor: isActive
                    ? "#32383E"
                    : "rgba(50, 56, 62, 0.6)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: "#EEEEEE",
                }}
              >
                <NavIcon name={section.icon} />
              </ListItemIcon>
              <ListItemText
                primary={section.label}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ borderColor: "var(--panel-border)" }} />
      <List sx={{ px: 1, py: 1.5 }}>
        <ListItemButton
          component={Link}
          href="/panel/profile"
          onClick={() => {
            if (!isDesktop) setMobileOpen(false);
          }}
          sx={{
            borderRadius: 2,
            py: 1.2,
            "&:hover": {
              bgcolor: "rgba(50, 56, 62, 0.6)",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 48 }}>
            <Avatar
              src={profile?.avatar_url ?? undefined}
              alt={profile?.username ?? "User"}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#0F4C75",
                color: "#fff",
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={profile?.username || "Profile settings"}
            secondary={profile?.email ?? "View profile"}
            primaryTypographyProps={{
              fontWeight: 600,
              noWrap: true,
              fontSize: 14,
              color: "#EEEEEE",
            }}
            secondaryTypographyProps={{
              noWrap: true,
              fontSize: 12,
              color: "rgba(238, 238, 238, 0.7)",
            }}
          />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{ display: "none" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleToggle}
            sx={{ mr: 1 }}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Learning Fast
          </Typography>
        </Toolbar>
      </AppBar>
      <IconButton
        onClick={handleToggle}
        aria-label="Toggle navigation"
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          bgcolor: "var(--panel-surface)",
          color: "var(--foreground)",
          border: "1px solid var(--panel-border)",
          "&:hover": { bgcolor: "var(--panel-card)" },
          display: { xs: mobileOpen ? "none" : "inline-flex", md: "none" },
        }}
      >
        <MenuIcon />
      </IconButton>
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
        aria-label="Panel navigation"
      >
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isDesktop ? true : mobileOpen}
          onClose={handleToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "#0B0D0E",
              color: "#EEEEEE",
              borderRight: "1px solid var(--panel-border)",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
    </>
  );
}
