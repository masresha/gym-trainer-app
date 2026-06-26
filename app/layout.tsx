import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoachDeck — Personal Trainer Platform",
  description: "Set goals, send workouts, and track client progress.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
