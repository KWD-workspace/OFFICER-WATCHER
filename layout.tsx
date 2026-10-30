import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Officier Watch — Ta veille, tes révisions",
  description: "Une veille sourcée pour préparer le concours d’Officier de la Police nationale.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
