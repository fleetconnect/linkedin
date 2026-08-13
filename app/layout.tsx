import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel Kaoba Command Center",
  description:
    "A proprietary hotel operations MVP for Hotel Kaoba, Cabarete, Dominican Republic — managing rooms, guests, bookings, pricing visibility, and follow-up from one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
