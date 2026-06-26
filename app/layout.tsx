import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoachDeck — Train. Track. Transform.",
  description: "Set goals, send workouts, and track client progress with energy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
