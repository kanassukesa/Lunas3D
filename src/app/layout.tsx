import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// Tipografia da marca (Google Fonts, servidas pelo próprio Next — sem requisição externa no navegador)
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: "Lunas 3D — Impressão 3D em Fortaleza",
    template: "%s | Lunas 3D",
  },
  description:
    "Peças em impressão 3D prontas para entrega e projetos personalizados sob medida. Fortaleza-CE, com envio para todo o Brasil.",
  applicationName: "Lunas 3D",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Lunas 3D" },
};

export const viewport: Viewport = {
  themeColor: "#141a3c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
