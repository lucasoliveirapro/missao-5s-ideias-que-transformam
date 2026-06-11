import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ranking AM - Cartoes SS Z2/Z3/Z4",
  description: "Ranking industrial de cartoes SS exportados do Manusis4."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
