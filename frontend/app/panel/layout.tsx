"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PANEL_SECTIONS = [
  { label: "Study", href: "/panel/study", icon: "study" },
  { label: "Boxes", href: "/panel/boxes", icon: "boxes" },
  { label: "Cards", href: "/panel/cards", icon: "cards" },
  { label: "Exercises", href: "/panel/exercises", icon: "exercises" },
  { label: "Activity", href: "/panel/activity", icon: "activity" },
  { label: "Profile", href: "/panel/profile", icon: "profile" },
];

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
    case "profile":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <circle
            cx="12"
            cy="8"
            r="3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M5 19c1.6-3 4.3-4.5 7-4.5s5.4 1.5 7 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
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

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen min-w-screen overflow-hidden bg-[#0f141b] text-white">
      <div className="flex justify-center min-h-screen min-w-screen ">
        <main className="flex justify-center min-w-screen">{children}</main>
      </div>

      <nav className="fixed h-20 bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-3xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-xl">
        <div className="grid grid-cols-6 gap-2 text-[11px]">
          {PANEL_SECTIONS.map((section) => {
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${
                  isActive
                    ? "bg-white text-[#111827]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <NavIcon name={section.icon} />
                <span className="text-[10px] uppercase tracking-[0.2em]">
                  {section.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
