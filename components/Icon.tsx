import { cn } from "@/lib/utils";

export type IconName =
  | "crown"
  | "desk"
  | "sparkles"
  | "chart"
  | "calendar"
  | "calendar-plus"
  | "bed"
  | "users"
  | "dollar"
  | "trending-up"
  | "whatsapp"
  | "check-in"
  | "wrench"
  | "note"
  | "booking"
  | "search"
  | "filter"
  | "x"
  | "chevron-right"
  | "chevron-left"
  | "menu"
  | "home"
  | "clipboard"
  | "route"
  | "moon"
  | "check"
  | "arrow-right"
  | "arrow-left"
  | "plus"
  | "history"
  | "block"
  | "user-plus"
  | "alert"
  | "map"
  | "target"
  | "layers"
  | "phone"
  | "mail"
  | "tag"
  | "download";

const paths: Record<IconName, React.ReactNode> = {
  crown: <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8z" />,
  desk: <path d="M3 20V9l9-5 9 5v11M3 20h18M7 20v-6h10v6" />,
  sparkles: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </>
  ),
  chart: <path d="M4 20V10M11 20V4M18 20v-7" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  "calendar-plus": (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M12 14v5M9.5 16.5h5" />
    </>
  ),
  bed: <path d="M3 18v-7a2 2 0 012-2h4a2 2 0 012 2v1M3 18v2M3 18h18M21 18v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1M21 18v2M13 12V9a2 2 0 012-2h0" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 8.2a3.2 3.2 0 110 6.4M21 20c0-2.8-2-5.2-4.6-5.9" />
    </>
  ),
  dollar: <path d="M12 2v20M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5S9.2 10 12 10s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />,
  "trending-up": <path d="M3 17l6-6 4 4 8-9M15 6h6v6" />,
  whatsapp: <path d="M4 20l1.4-4.1A8 8 0 1112 20a8 8 0 01-4.3-1.2L4 20zM8.5 8.7c-.2.6-.2 1.4.4 2.7.7 1.6 2.3 3.2 3.9 3.9 1.3.6 2.1.5 2.7.4.5-.1 1.4-.6 1.6-1.1.2-.6.2-1.1.1-1.2-.1-.1-.4-.2-.8-.4-.4-.2-1.2-.6-1.4-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.1-.3.2-.5.1-.6-.3-1.4-.8-2-1.5-.5-.5-.9-1.1-1-1.3-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.1-.4 0-.1-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.1 0-.4.1-.6.3z" />,
  "check-in": <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />,
  wrench: <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2-.6-.6-2 2.6-2.6z" />,
  note: <path d="M4 4h13l3 3v13H4V4zM17 4v3h3M8 12h8M8 16h5" />,
  booking: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M8 13l1.5 1.5L12.5 11" />
    </>
  ),
  search: <path d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35" />,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  "chevron-right": <path d="M9 6l6 6-6 6" />,
  "chevron-left": <path d="M15 6l-6 6 6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  home: <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z" />,
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 2h6v4H9z" />
      <path d="M9 11h6M9 15h6" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h7a3 3 0 003-3v-1a3 3 0 00-3-3H9a3 3 0 01-3-3V8a3 3 0 013-3h7" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />,
  check: <path d="M5 13l4 4L19 7" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 18l-6-6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  history: <path d="M3 12a9 9 0 109-9M3 12H1m2 0l2-2m-2 2l2 2M12 7v5l4 2" />,
  block: <path d="M12 3a9 9 0 100 18 9 9 0 000-18zM5.5 5.5l13 13" />,
  "user-plus": (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M18 8v6M15 11h6" />
    </>
  ),
  alert: <path d="M12 3l10 18H2L12 3zM12 10v4m0 3h.01" />,
  map: <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zM9 4v14M15 6v14" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" />
    </>
  ),
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a12 12 0 006 6L16 14l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  tag: <path d="M12 2h7a1 1 0 011 1v7a1 1 0 01-.3.7l-9 9a1 1 0 01-1.4 0l-7-7a1 1 0 010-1.4l9-9A1 1 0 0112 2zM16.5 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  download: <path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />,
};

export function Icon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
