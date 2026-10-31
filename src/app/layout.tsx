import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// Tipografia da marca (Google Fonts, servidas pelo próprio Next — sem requisição externa no navegador)
// Fredoka: arredondada e "fofinha", conversa com as letras infladas da logo (títulos e botões).
// Nunito: arredondada e muito legível no celular (textos).
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], display: "swap" });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap" });

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
  themeColor: "#d5ecfc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
